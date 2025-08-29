import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

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
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

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

    return NextResponse.json({ message: "Flashcard set deleted" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard set" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
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
      { status: 500 }
    );
  }
}
