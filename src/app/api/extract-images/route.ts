import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import cuid from "cuid";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, standard, subject, images, thumbnail } = body;

    if (!title || !description || !standard || !subject || !images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Uploads go to object storage, not public/uploads/ — the container
    // filesystem is ephemeral, so anything written there is lost on redeploy.
    // Run them concurrently; `map` keeps the original slide order.
    const savedImages = await Promise.all(
      images
        .filter((image) => image?.dataUrl)
        .map(async (image) => {
          const { slideNumber, dataUrl, type } = image;

          const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
          const imageName = `${cuid()}.png`;

          await uploadToS3(buffer, imageName, "image/png");

          return {
            slideNumber,
            imageName,
            type,
          };
        })
    );

    let thumbnailId: string | null = null;
    if (thumbnail) {
        const buffer = Buffer.from(thumbnail.split(",")[1], "base64");
        const imageName = `${cuid()}.png`;

        await uploadToS3(buffer, imageName, "image/png");
        thumbnailId = imageName;
    }


    const newFlashcardSet = await prisma.flashcardSet.create({
      data: {
        title: title as string,
        description: description as string,
        standard: standard as string,
        subject: subject as string,
        createdBy: session.user.id,
        createdByName: session.user.name,
        flashcardsData: savedImages as Prisma.JsonArray,
        flashcardCount: savedImages.length,
        published: true,
        thumbnailId: thumbnailId,
      },
    });

    return NextResponse.json(newFlashcardSet);
  } catch (error) {
    console.error("Image saving failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to save images",
        details: {
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
