import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Convert a string to a URL-safe slug */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * GET /api/flashcard/public?standard=10th&subject=science-1&title=test
 *
 * Returns a published flashcard set matched by slugified standard / subject / title.
 * Only published sets are returned (published = true).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const standardParam = searchParams.get("standard")?.trim() ?? "";
  const subjectParam = searchParams.get("subject")?.trim() ?? "";
  const titleParam = searchParams.get("title")?.trim() ?? "";

  if (!standardParam || !subjectParam || !titleParam) {
    return NextResponse.json(
      { error: "standard, subject and title query params are required" },
      { status: 400 },
    );
  }

  try {
    // Fetch all published sets (SQLite does not support mode:'insensitive')
    // We match on the slug of each field to handle spaces / case differences.
    const candidates = await prisma.flashcardSet.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true } },
      },
    });

    const match = candidates.find(
      (set: (typeof candidates)[number]) =>
        slugify(set.standard) === slugify(standardParam) &&
        slugify(set.subject) === slugify(subjectParam) &&
        slugify(set.title) === slugify(titleParam),
    );

    if (!match) {
      return NextResponse.json(
        { error: "Flashcard set not found or not published" },
        { status: 404 },
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching public flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcard set" },
      { status: 500 },
    );
  }
}
