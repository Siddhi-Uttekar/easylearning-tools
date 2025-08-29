import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flashcardSets = await prisma.flashcardSet.findMany({
      where: {
        createdBy: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        standard: true,
        subject: true,
        flashcardCount: true,
        published: true,
        createdAt: true,
        thumbnailId: true,
      },
    });

    const response = flashcardSets.map(({ thumbnailId, ...rest }) => ({
      ...rest,
      thumbnail: thumbnailId,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch flashcard sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcard sets" },
      { status: 500 }
    );
  }
}
