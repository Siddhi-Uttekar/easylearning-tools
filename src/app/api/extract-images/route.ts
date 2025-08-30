import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    const savedImages = [];
    for (const image of images) {
        const { slideNumber, dataUrl, type } = image;
        
        if(!dataUrl) continue;

        const buffer = Buffer.from(dataUrl.split(",")[1], "base64");
        const imageName = `${cuid()}.png`;
        const imagePath = path.join(process.cwd(), "public", "uploads", imageName);

        await fs.writeFile(imagePath, buffer);

        savedImages.push({
            slideNumber,
            imageName,
            type
        });
    }
    
    let thumbnailId: string | null = null;
    if (thumbnail) {
        const buffer = Buffer.from(thumbnail.split(",")[1], "base64");
        const imageName = `${cuid()}.png`;
        const imagePath = path.join(process.cwd(), "public", "uploads", imageName);

        await fs.writeFile(imagePath, buffer);
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
        flashcardsData: savedImages as any,
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
