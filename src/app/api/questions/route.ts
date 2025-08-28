// app/api/questions/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.QUESTIONDB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chapter = searchParams.get("chapter") || "Laws of Motion";
  const difficulty = searchParams.get("difficulty") || "all";
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  const cacheKey = `questions_${chapter}_${difficulty}_${limit}_${offset}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    // First, get the question IDs with pagination
    let questionIdQuery = `
      SELECT q."originalId"
      FROM "QuestionBankQuestion" q
      JOIN "QuestionBankChapter" c ON q."chapterOriginalId" = c."originalId"
      WHERE c.name ILIKE $1
    `;
    const queryParams: any[] = [`%${chapter}%`];

    // Add difficulty filter if specified
    if (difficulty !== "all") {
      questionIdQuery += ` AND q."difficultyLevel" = $2`;
      queryParams.push(difficulty);
    }

    // Add pagination
    questionIdQuery += ` ORDER BY RANDOM() LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const questionIdResult = await pool.query(questionIdQuery, queryParams);
    const questionIds = questionIdResult.rows.map((row) => row.originalId);

    if (questionIds.length === 0) {
      // Fallback: Try without difficulty filter
      let fallbackQuery = `
        SELECT q."originalId"
        FROM "QuestionBankQuestion" q
        JOIN "QuestionBankChapter" c ON q."chapterOriginalId" = c."originalId"
        WHERE c.name ILIKE $1
        ORDER BY RANDOM()
        LIMIT $2
      `;
      const fallbackResult = await pool.query(fallbackQuery, [
        `%${chapter}%`,
        limit,
      ]);
      const fallbackQuestionIds = fallbackResult.rows.map(
        (row) => row.originalId
      );

      if (fallbackQuestionIds.length === 0) {
        // No questions found at all
        const allChapters = await pool.query(
          'SELECT DISTINCT name FROM "QuestionBankChapter" LIMIT 20'
        );
        const difficultyCounts = await pool.query(
          `
          SELECT "difficultyLevel", COUNT(*) as count
          FROM "QuestionBankQuestion"
          WHERE "chapterOriginalId" IN (
            SELECT "originalId" FROM "QuestionBankChapter" WHERE name ILIKE $1
          )
          GROUP BY "difficultyLevel"
          `,
          [`%${chapter}%`]
        );

        const result = {
          questions: [],
          message: `No questions found for '${chapter}' chapter`,
          available_chapters: allChapters.rows,
          difficulty_counts: difficultyCounts.rows,
          total_questions: 0,
          debug_info: {
            searched_chapter: chapter,
            difficulty_filter: difficulty,
            limit,
            offset,
          },
        };
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return NextResponse.json(result);
      }

      // Use fallback question IDs
      questionIds.push(...fallbackQuestionIds);
    }

    // Now get all questions and their options using the question IDs
    const questionIdsString = questionIds.map((_, i) => `$${i + 1}`).join(",");
    const fullQuery = `
      SELECT 
        q."originalId" AS question_id,
        q."questionText",
        q.solution,
        q."difficultyLevel",
        c.name AS chapter_name,
        c.subject,
        c.standard,
        o."originalId" AS option_id,
        o."optionText",
        o."isCorrect"
      FROM "QuestionBankQuestion" q
      JOIN "QuestionBankChapter" c ON q."chapterOriginalId" = c."originalId"
      LEFT JOIN "QuestionBankOption" o ON q."originalId" = o."questionOriginalId"
      WHERE q."originalId" IN (${questionIdsString})
      ORDER BY q."originalId", o."originalId"
    `;

    const fullResult = await pool.query(fullQuery, questionIds);

    // Process results
    const questions = processQuestionRows(fullResult.rows);

    const response = {
      questions,
      total: questions.length,
      chapter,
      difficulty,
      limit,
      offset,
      has_more: questions.length >= limit,
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch questions from database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to process question rows
function processQuestionRows(rows: any[]) {
  const questionsMap = new Map();

  for (const row of rows) {
    const questionId = row.question_id;

    if (!questionsMap.has(questionId)) {
      questionsMap.set(questionId, {
        question_id: questionId,
        question_text: row.questionText,
        solution: row.solution,
        difficulty_level: row.difficultyLevel,
        chapter_name: row.chapter_name,
        subject: row.subject,
        standard: row.standard,
        options: [],
      });
    }

    if (row.option_id) {
      questionsMap.get(questionId).options.push({
        option_id: row.option_id,
        option_text: row.optionText,
        is_correct: Boolean(row.isCorrect),
      });
    }
  }

  return Array.from(questionsMap.values());
}
