import { NextRequest, NextResponse } from "next/server";
import { PDFiumLibrary } from "@hyzyla/pdfium";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

interface RenderOptions {
  data: Uint8Array;
  width: number;
  height: number;
}

async function renderFunction(options: RenderOptions) {
  try {
    return await sharp(options.data, {
      raw: {
        width: options.width,
        height: options.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  } catch (error) {
    console.error("Sharp rendering error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let library: any = null;
  let document: any = null;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const { title, description, standard, subject } = Object.fromEntries(
      formData.entries()
    );

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title || !description || !standard || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Initializing PDFium library...");
    library = await PDFiumLibrary.init();

    console.log("Loading PDF document...");
    document = await library.loadDocument(buffer);
    const pageCount = document.getPageCount();
    console.log(`Document loaded with ${pageCount} pages`);

    const images = [];

    // Process ALL pages in the PDF
    for (let i = 0; i < pageCount; i++) {
      try {
        console.log(`Processing page ${i + 1}/${pageCount}...`);
        const page = document.getPage(i);

        const image = await page.render({
          scale: 7,
          render: renderFunction,
        });

        const imageId = crypto.randomUUID();
        const imageName = `${imageId}.png`;
        const imagePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          imageName
        );

        await fs.writeFile(imagePath, image.data);

        images.push({
          slideNumber: i,
          imageName: imageName,
          type: i === 0 ? "title" : i % 2 === 1 ? "front" : "back",
        });

        console.log(`Page ${i + 1} processed and saved as ${imageName}`);
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        continue;
      }
    }

    let thumbnailId: string | null = null;
    if (thumbnailFile) {
      try {
        console.log("Processing thumbnail...");
        const thumbId = crypto.randomUUID();
        const thumbnailName = `${thumbId}.png`;
        const thumbnailPath = path.join(
          process.cwd(),
          "public",
          "uploads",
          thumbnailName
        );
        const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        await fs.writeFile(thumbnailPath, thumbnailBuffer);
        thumbnailId = thumbnailName;
        console.log(`Thumbnail saved as ${thumbnailName}`);
      } catch (thumbError) {
        console.error("Error processing thumbnail:", thumbError);
        // Do not fail the whole request, just log the error
      }
    }

    const newFlashcardSet = await prisma.flashcardSet.create({
      data: {
        title: title as string,
        description: description as string,
        standard: standard as string,
        subject: subject as string,
        createdBy: session.user.id,
        createdByName: session.user.name,
        flashcardsData: images as any,
        flashcardCount: images.length,
        published: true,
        thumbnailId: thumbnailId,
      },
    });

    return NextResponse.json(newFlashcardSet);
  } catch (error) {
    console.error("PDF processing failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as any).code;

    return NextResponse.json(
      {
        error: "Failed to extract PDF",
        details: {
          message: errorMessage,
          stack: errorStack,
          code: errorCode,
        },
      },
      { status: 500 }
    );
  } finally {
    if (document) {
      try {
        document.destroy();
      } catch (cleanupError) {
        console.error("Error destroying document:", cleanupError);
      }
    }
    if (library) {
      try {
        library.destroy();
      } catch (cleanupError) {
        console.error("Error destroying library:", cleanupError);
      }
    }
  }
}
