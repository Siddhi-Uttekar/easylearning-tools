import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Exam folders present under data/pyq/ — see data/pyq/README.md.
const EXAMS = ["mht-cet", "neet", "mht-cet-biology"] as const;

interface CatalogChapter {
  key: string;
  title: string;
  questionCount: number;
  isOutOfSyllabus?: boolean;
}

interface CatalogSubject {
  key: string;
  title: string;
  topics: { key: string; title: string; chapters: CatalogChapter[] }[];
}

interface RawCatalog {
  exam: string;
  examTitle: string;
  subjects: {
    key: string;
    title: string;
    topics: {
      key: string;
      title: string;
      chapters: {
        key: string;
        title: string;
        questionCount: number;
        isOutOfSyllabus?: boolean;
      }[];
    }[];
  }[];
}

interface ExamCatalog {
  exam: string;
  examTitle: string;
  subjects: CatalogSubject[];
}

let cache: { data: { exams: ExamCatalog[] } | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 10 * 60 * 1000;

export async function GET() {
  if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  const dataRoot = path.join(process.cwd(), "data", "pyq");
  const exams: ExamCatalog[] = [];

  for (const examDir of EXAMS) {
    try {
      const catalogPath = path.join(dataRoot, examDir, "catalog.json");
      const raw = JSON.parse(
        await fs.readFile(catalogPath, "utf-8"),
      ) as RawCatalog;

      exams.push({
        exam: raw.exam,
        examTitle: raw.examTitle,
        subjects: raw.subjects.map((subject) => ({
          key: subject.key,
          title: subject.title,
          topics: subject.topics.map((topic) => ({
            key: topic.key,
            title: topic.title,
            chapters: topic.chapters
              .filter((c) => c.questionCount > 0)
              .map((c) => ({
                key: c.key,
                title: c.title,
                questionCount: c.questionCount,
                isOutOfSyllabus: c.isOutOfSyllabus,
              })),
          })),
        })),
      });
    } catch {
      // This exam's data isn't present on disk (e.g. not synced yet) — skip it.
    }
  }

  const response = { exams };
  cache = { data: response, timestamp: Date.now() };
  return NextResponse.json(response);
}
