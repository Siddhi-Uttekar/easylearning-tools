import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET all suggestions
export async function GET() {
  try {
    const suggestions = await prisma.featureSuggestion.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, image: true } } },
    });
    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

// POST a new suggestion
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const newSuggestion = await prisma.featureSuggestion.create({
      data: {
        title,
        description,
        authorId: session.user.id,
      },
    });
    return NextResponse.json(newSuggestion, { status: 201 });
  } catch (error) {
    console.error("Failed to create suggestion:", error);
    return NextResponse.json(
      {
        error: "Failed to create suggestion",
        details: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
