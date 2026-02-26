import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promises as fs } from "fs";
import path from "path";
import cuid from "cuid";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const flashcardSet = await prisma.flashcardSet.findUnique({
      where: { id },
    });

    if (!flashcardSet) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (flashcardSet.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { flashcardsData, thumbnailId, ...rest } = flashcardSet;
    const response = {
      ...rest,
      thumbnail: thumbnailId,
      flashcards: flashcardsData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcard set" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const flashcardSet = await prisma.flashcardSet.findUnique({
      where: { id },
    });

    if (!flashcardSet) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (flashcardSet.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.flashcardSet.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Flashcard set deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard set" },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  const body = await request.json();

  try {
    const flashcardSet = await prisma.flashcardSet.findUnique({
      where: { id },
    });

    if (!flashcardSet) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (flashcardSet.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedFlashcardSet = await prisma.flashcardSet.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        standard: body.standard,
        subject: body.subject,
        published: body.published,
      },
    });

    return NextResponse.json(updatedFlashcardSet);
  } catch (error) {
    console.error("Failed to update flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard set" },
      { status: 500 },
    );
  }
}

// PATCH – update flashcardsData (add / remove cards)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, context: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  const body = await request.json();

  try {
    const flashcardSet = await prisma.flashcardSet.findUnique({
      where: { id },
    });

    if (!flashcardSet) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    if (flashcardSet.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // body.action === "add"  →  body.cards: array of new card objects
    //   card types:
    //     { cardType:"text",  type:"front"|"back", text:"...", slideNumber }
    //     { cardType:"image", type:"front"|"back", dataUrl:"data:...", slideNumber }
    // body.action === "remove"  →  body.slideNumbers: number[]
    // body.action === "replace" →  body.flashcardsData: full array (reorder etc.)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = Array.isArray(flashcardSet.flashcardsData)
      ? (flashcardSet.flashcardsData as any[])
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updated: any[];

    if (body.action === "remove") {
      const toRemove: number[] = body.slideNumbers ?? [];
      updated = existing.filter((c) => !toRemove.includes(c.slideNumber));
    } else if (body.action === "add") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCards: any[] = [];
      for (const card of body.cards ?? []) {
        if (card.cardType === "image" && card.dataUrl) {
          const buffer = Buffer.from(card.dataUrl.split(",")[1], "base64");
          const imageName = `${cuid()}.png`;
          const imagePath = path.join(
            process.cwd(),
            "public",
            "uploads",
            imageName,
          );
          await fs.writeFile(imagePath, buffer);
          newCards.push({
            slideNumber: card.slideNumber,
            imageName,
            type: card.type,
            cardType: "image",
          });
        } else {
          // text card – no file saved
          newCards.push({
            slideNumber: card.slideNumber,
            imageName: "",
            type: card.type,
            cardType: "text",
            text: card.text ?? "",
          });
        }
      }
      updated = [...existing, ...newCards];
    } else if (body.action === "replace") {
      updated = body.flashcardsData ?? existing;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const result = await prisma.flashcardSet.update({
      where: { id },
      data: {
        flashcardsData: updated as Prisma.JsonArray,
        flashcardCount: updated.filter((c) => c.type !== "title").length,
      },
    });

    const { flashcardsData, thumbnailId, ...rest } = result;
    return NextResponse.json({
      ...rest,
      thumbnail: thumbnailId,
      flashcards: flashcardsData,
    });
  } catch (error) {
    console.error("Failed to patch flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to patch flashcard set" },
      { status: 500 },
    );
  }
}
