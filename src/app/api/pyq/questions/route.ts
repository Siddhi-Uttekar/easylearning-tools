import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const EXAMS = new Set(["mht-cet", "neet", "mht-cet-biology"]);

// Chapter/subject keys are slugs (e.g. "units-and-measurement-and-dimensions")
// — reject anything that isn't, so this can't be used to read arbitrary files.
const SAFE_SLUG = /^[a-z0-9-]+$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam") || "";
  const subject = searchParams.get("subject") || "";
  const chapter = searchParams.get("chapter") || "";

  if (!EXAMS.has(exam)) {
    return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  }
  if (!SAFE_SLUG.test(subject) || !SAFE_SLUG.test(chapter)) {
    return NextResponse.json(
      { error: "Invalid subject or chapter" },
      { status: 400 },
    );
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "pyq",
    exam,
    "questions",
    subject,
    `${chapter}.json`,
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return new NextResponse(raw, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Chapter not found" },
      { status: 404 },
    );
  }
}
