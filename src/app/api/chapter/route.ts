import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.QUESTIONDB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const chaptersCache = { data: null as any, timestamp: 0 };
const CACHE_DURATION = 10 * 60 * 1000;

export async function GET() {
  if (
    chaptersCache.data &&
    Date.now() - chaptersCache.timestamp < CACHE_DURATION
  ) {
    return NextResponse.json(chaptersCache.data);
  }

  try {
    const query = `
      SELECT 
        c."originalId",
        c.name,
        c.subject,
        c.standard,
        COUNT(q."originalId") as question_count
      FROM "QuestionBankChapter" c
      LEFT JOIN "QuestionBankQuestion" q ON c."originalId" = q."chapterOriginalId"
      GROUP BY c."originalId", c.name, c.subject, c.standard
      ORDER BY c.subject, c.standard, c.name
    `;

    const result = await pool.query(query);
    const chapters = result.rows;

    const response = {
      chapters: chapters,
      total: chapters.length,
    };

    chaptersCache.data = response;
    chaptersCache.timestamp = Date.now();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chapters from database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
