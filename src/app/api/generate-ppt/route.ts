import { NextRequest, NextResponse } from "next/server";
import * as PPTX from "pptxgenjs";
import path from "path";

interface Option {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  question_id: number;
  question_text: string;
  solution?: string;
  difficulty_level?: string;
  chapter_name?: string;
  subject?: string;
  standard?: string;
  options: Option[];
  // PYQ (previous-year-question) provenance — shown as a badge on the slide
  examTitle?: string;
  year?: number | string;
  paperTitle?: string;
}

interface Metadata {
  chapter?: string;
  subject?: string;
  standard?: string;
  username?: string;
  difficultyFilters?: string;
  totalCount?: number;
  exam?: string;
  examYearRange?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addWatermark = (slide: any) => {
  slide.addText("EasyLearning", {
    x: 0,
    y: 2.5,
    w: 10,
    h: 0.8,
    fontSize: 52,
    color: "F1F5F9",
    align: "center",
    valign: "middle",
    fontFace: "Calibri",
    bold: true,
    rotate: -30,
    transparency: 80,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addLogo = (slide: any) => {
  const logoPath = path.join(process.cwd(), "public/icon.png");
  try {
    slide.addImage({
      path: logoPath,
      x: 9.3, // 10 (slide width) - 0.5 (logo width) - 0.2 (margin)
      y: 0.01, // aligned with the exam badge's vertical center (badge: y 0.05, h 0.32)
      w: 0.5,
      h: 0.5,
    });
  } catch {
    // Logo file may not exist; skip silently
  }
};

// ── Layout helpers ───────────────────────────────────────────────
// Real PYQ content (long multi-clause questions, long option text, and
// multi-step explanations) varies a lot in length. The boxes below used to
// be fixed-height, so anything longer than a short demo MCQ would visually
// overflow its box and collide with the content underneath. These helpers
// estimate how much vertical space text needs (given a box width and font
// size) so boxes/fonts can be sized to fit instead.
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const avgCharWidthIn = (fontSize: number, bold = false) =>
  (fontSize * (bold ? 0.58 : 0.5)) / 72;

const lineHeightIn = (fontSize: number) => (fontSize * 1.28) / 72;

const estimateLines = (
  text: string,
  widthIn: number,
  fontSize: number,
  bold = false,
) => {
  if (!text) return 1;
  const perLine = Math.max(
    6,
    Math.floor(widthIn / avgCharWidthIn(fontSize, bold)),
  );
  return text
    .split("\n")
    .reduce(
      (sum, line) => sum + Math.max(1, Math.ceil((line.length || 1) / perLine)),
      0,
    );
};

// Badge sits to the left of the logo (x: 9.2–9.8) with a clear gap so the
// two never overlap.
const EXAM_BADGE_X = 7.2;
const EXAM_BADGE_W = 1.9;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addExamBadge = (slide: any, q: Question) => {
  if (!q.examTitle) return;
  const label = q.year ? `${q.examTitle} ${q.year}` : q.examTitle;
  slide.addShape("rect", {
    x: EXAM_BADGE_X,
    y: 0.05,
    w: EXAM_BADGE_W,
    h: 0.32,
    fill: { color: COLORS.headerBg },
    line: { color: COLORS.headerBg, width: 0 },
  });
  slide.addText(label, {
    x: EXAM_BADGE_X,
    y: 0.05,
    w: EXAM_BADGE_W,
    h: 0.32,
    fontSize: 9,
    bold: true,
    color: "FFFFFF",
    fontFace: "Calibri",
    align: "center",
    valign: "middle",
  });
};

const OPTION_LABELS = ["A", "B", "C", "D", "E"];
const COLORS = {
  bg: "F8FAFC",
  card: "FFFFFF",
  headerBg: "1E40AF",
  headerText: "FFFFFF",
  questionText: "1E293B",
  optionText: "334155",
  correctBg: "DCFCE7",
  correctText: "166534",
  correctBorder: "22C55E",
  defaultBorder: "CBD5E1",
  solutionBg: "FEF3C7",
  solutionText: "92400E",
  metaText: "64748B",
  accent: "3B82F6",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, metadata } = body as {
      questions: Question[];
      metadata: Metadata;
    };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions provided" },
        { status: 400 },
      );
    }

    const pptx = new PPTX.default();
    // Standard widescreen layout
    pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
    pptx.layout = "WIDE";

    // ── Title slide ──────────────────────────────────────────────
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: COLORS.bg };
    addWatermark(titleSlide);

    // EasyLearning branding
    titleSlide.addText("EasyLearning", {
      x: 0.3,
      y: 0.15,
      w: 3,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: COLORS.accent,
      fontFace: "Calibri",
    });
    addLogo(titleSlide);

    // Chapter title
    titleSlide.addText(metadata?.chapter || "MCQ Practice", {
      x: 0.5,
      y: 0.15,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: COLORS.questionText,
      fontFace: "Calibri",
      align: "center",
    });

    // Info cards
    const infoItems = [
      { label: "Subject", value: metadata?.subject || "—" },
      metadata?.exam
        ? { label: "Exam", value: metadata.exam }
        : { label: "Standard", value: `Class ${metadata?.standard || "—"}` },
      { label: "Questions", value: String(questions.length) },
      metadata?.examYearRange
        ? { label: "Years", value: metadata.examYearRange }
        : { label: "Difficulty", value: metadata?.difficultyFilters || "Mixed" },
    ];
    infoItems.forEach((item, i) => {
      const x = 0.5 + i * 2.3;
      titleSlide.addShape("rect", {
        x,
        y: 0.9,
        w: 2.0,
        h: 1.2,
        fill: { color: COLORS.card },
        line: { color: COLORS.accent, width: 2 },
      });
      titleSlide.addText(item.label, {
        x,
        y: 0.95,
        w: 2.0,
        h: 0.4,
        fontSize: 11,
        color: COLORS.metaText,
        fontFace: "Calibri",
        align: "center",
      });
      titleSlide.addText(item.value, {
        x,
        y: 1.4,
        w: 2.0,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: COLORS.questionText,
        fontFace: "Calibri",
        align: "center",
      });
    });

    titleSlide.addText("Prepared by EasyLearning Tools", {
      x: 0,
      y: 5.1,
      w: 10,
      h: 0.4,
      fontSize: 11,
      color: COLORS.metaText,
      fontFace: "Calibri",
      align: "center",
      italic: true,
    });

    const SLIDE_BOTTOM = 5.6; // slide height is 5.625 — leave a hair of margin
    const SECTION_GAP = 0.15;
    const CONTENT_LEFT = 0.2;
    const CONTENT_RIGHT = 9.8; // 10 - 0.2 right margin

    // ── Two slides per question: [1] Question  [2] Answer + Explanation ──
    questions.forEach((q, idx) => {
      const infoParts = [`Q${idx + 1}`];
      if (metadata?.chapter) infoParts.push(metadata.chapter);
      if (metadata?.subject) infoParts.push(metadata.subject);
      if (metadata?.standard) infoParts.push(`Class ${metadata.standard}`);
      const infoText = infoParts.join("  •  ");

      const validOptions = q.options || [];

      const hasSolution =
        q.solution &&
        q.solution.trim() &&
        q.solution !== "Ans: Self Explanatory";
      const solutionText = hasSolution
        ? q.solution!.replace(/^Ans:\s*/i, "").trim()
        : "";
      const showSolutionBox = !!(
        solutionText && solutionText !== "Self Explanatory"
      );
      const showCorrectLabel =
        !showSolutionBox && validOptions.some((o) => o.is_correct);

      // ── Question box (identical geometry on both slides) ────────────
      const questionBoxY = 0.45;
      const questionBoxW = CONTENT_RIGHT - CONTENT_LEFT;
      const questionTextW = questionBoxW - 0.3;
      const qLen = (q.question_text || "").length;
      const questionFontSize = qLen > 300 ? 12 : qLen > 180 ? 13 : 14;
      const questionLines = estimateLines(
        q.question_text,
        questionTextW - 0.2,
        questionFontSize,
        true,
      );
      const questionBoxH = clamp(
        questionLines * lineHeightIn(questionFontSize) + 0.3,
        0.9,
        2.3,
      );
      const contentY = questionBoxY + questionBoxH + SECTION_GAP;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addQuestionBox = (s: any) => {
        s.addShape("rect", {
          x: CONTENT_LEFT,
          y: questionBoxY,
          w: questionBoxW,
          h: questionBoxH,
          fill: { color: COLORS.card },
          line: { color: COLORS.accent, width: 1.5 },
        });
        s.addText(q.question_text, {
          x: 0.35,
          y: questionBoxY + 0.05,
          w: questionTextW,
          h: questionBoxH - 0.1,
          fontSize: questionFontSize,
          bold: true,
          color: COLORS.questionText,
          fontFace: "Calibri",
          wrap: true,
          valign: "middle",
        });
      };

      const longestOptLen = validOptions.reduce(
        (max, o) => Math.max(max, (o.option_text || "").length),
        0,
      );

      // ── Options — GRID (2-column) ────────────────────────────────────
      // Used on the question slide always, and on the answer slide when
      // there's no explanation to show alongside (nothing to split with).
      const gridColW = 4.7;
      const gridTextW = gridColW - 0.6;
      const gridFontSize =
        longestOptLen > 110 ? 10 : longestOptLen > 70 ? 11 : 12;
      const gridLines = validOptions.reduce(
        (max, o) =>
          Math.max(max, estimateLines(o.option_text, gridTextW, gridFontSize)),
        1,
      );
      const gridGap = 0.12;
      const gridRows = Math.max(1, Math.ceil(validOptions.length / 2));
      let gridRowH = clamp(
        gridLines * lineHeightIn(gridFontSize) + 0.22,
        0.65,
        1.7,
      );
      // Leave room below the grid for the "Correct Answer" strip, if shown.
      const gridReserve = showCorrectLabel ? 0.9 + SECTION_GAP : 0;
      const gridMaxBottom = SLIDE_BOTTOM - gridReserve;
      const gridProjectedBottom =
        contentY + gridRows * gridRowH + (gridRows - 1) * gridGap;
      if (gridProjectedBottom > gridMaxBottom) {
        const scale = clamp(
          (gridMaxBottom - contentY - (gridRows - 1) * gridGap) /
            (gridRows * gridRowH),
          0.45,
          1,
        );
        gridRowH *= scale;
      }
      const gridEndY =
        contentY + gridRows * gridRowH + (gridRows - 1) * gridGap;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addOptionsGrid = (s: any, showAnswer: boolean) => {
        validOptions.forEach((opt, oIdx) => {
          const col = oIdx % 2;
          const row = Math.floor(oIdx / 2);
          const x = CONTENT_LEFT + col * 4.9;
          const y = contentY + row * (gridRowH + gridGap);
          const isCorrect = showAnswer && opt.is_correct;
          const label = OPTION_LABELS[oIdx] || String(oIdx + 1);

          s.addShape("rect", {
            x,
            y,
            w: gridColW,
            h: gridRowH,
            fill: { color: isCorrect ? COLORS.correctBg : COLORS.card },
            line: {
              color: isCorrect ? COLORS.correctBorder : COLORS.defaultBorder,
              width: isCorrect ? 2 : 1,
            },
          });
          s.addText(
            [
              {
                text: `${label}.  `,
                options: {
                  bold: true,
                  fontSize: gridFontSize,
                  color: isCorrect ? COLORS.correctText : COLORS.accent,
                  fontFace: "Calibri",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              },
              {
                text: opt.option_text,
                options: {
                  bold: isCorrect,
                  fontSize: gridFontSize,
                  color: isCorrect ? COLORS.correctText : COLORS.optionText,
                  fontFace: "Calibri",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              },
            ],
            {
              x: x + 0.2,
              y,
              w: gridColW - 0.3,
              h: gridRowH,
              wrap: true,
              valign: "middle",
            },
          );
        });
      };

      // ── Options — LIST (single column, left half) ────────────────────
      // Paired with the explanation panel on the answer slide.
      const listX = CONTENT_LEFT;
      const listW = 4.5;
      const panelGap = 0.2;
      const panelX = listX + listW + panelGap;
      const panelW = CONTENT_RIGHT - panelX;
      const listTextW = listW - 0.6;
      const listFontSize =
        longestOptLen > 110 ? 10 : longestOptLen > 70 ? 11 : 12;
      const listLines = validOptions.reduce(
        (max, o) =>
          Math.max(max, estimateLines(o.option_text, listTextW, listFontSize)),
        1,
      );
      const listGap = 0.12;
      const listCount = Math.max(1, validOptions.length);
      let listRowH = clamp(
        listLines * lineHeightIn(listFontSize) + 0.22,
        0.55,
        1.1,
      );
      const listProjectedBottom =
        contentY + listCount * listRowH + (listCount - 1) * listGap;
      if (listProjectedBottom > SLIDE_BOTTOM) {
        const scale = clamp(
          (SLIDE_BOTTOM - contentY - (listCount - 1) * listGap) /
            (listCount * listRowH),
          0.4,
          1,
        );
        listRowH *= scale;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addOptionsList = (s: any) => {
        validOptions.forEach((opt, oIdx) => {
          const y = contentY + oIdx * (listRowH + listGap);
          const isCorrect = opt.is_correct;
          const label = OPTION_LABELS[oIdx] || String(oIdx + 1);

          s.addShape("rect", {
            x: listX,
            y,
            w: listW,
            h: listRowH,
            fill: { color: isCorrect ? COLORS.correctBg : COLORS.card },
            line: {
              color: isCorrect ? COLORS.correctBorder : COLORS.defaultBorder,
              width: isCorrect ? 2 : 1,
            },
          });
          s.addText(
            [
              {
                text: `${label}.  `,
                options: {
                  bold: true,
                  fontSize: listFontSize,
                  color: isCorrect ? COLORS.correctText : COLORS.accent,
                  fontFace: "Calibri",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              },
              {
                text: opt.option_text,
                options: {
                  bold: isCorrect,
                  fontSize: listFontSize,
                  color: isCorrect ? COLORS.correctText : COLORS.optionText,
                  fontFace: "Calibri",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
              },
            ],
            {
              x: listX + 0.2,
              y,
              w: listW - 0.3,
              h: listRowH,
              wrap: true,
              valign: "middle",
            },
          );
        });
      };

      // ── Explanation panel (right half, tall) ──────────────────────────
      const panelY = contentY;
      const panelH = SLIDE_BOTTOM - panelY;
      const panelTextW = panelW - 0.3;
      let panelFontSize = 11;
      if (showSolutionBox) {
        for (const fs of [11, 10, 9, 8, 7]) {
          panelFontSize = fs;
          const neededLines =
            estimateLines(solutionText, panelTextW, fs) + 1; // +1 for header
          const neededH = neededLines * lineHeightIn(fs) * 1.15 + 0.4;
          if (neededH <= panelH || fs === 7) break;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addExplanationPanel = (s: any) => {
        s.addShape("rect", {
          x: panelX,
          y: panelY,
          w: panelW,
          h: panelH,
          fill: { color: COLORS.solutionBg },
          line: { color: "F59E0B", width: 1 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const runs: any[] = [
          {
            text: "Explanation:",
            options: {
              bold: true,
              fontSize: panelFontSize,
              color: COLORS.solutionText,
              fontFace: "Calibri",
              breakLine: true,
            },
          },
        ];
        solutionText.split("\n").forEach((line) => {
          const trimmed = line.trim();
          const isConclusion =
            /\bcorrect\b/i.test(trimmed) && /\b(option|answer)\b/i.test(trimmed);
          const isEquation =
            !isConclusion && /=/.test(trimmed) && trimmed.length < 90;
          runs.push({
            text: trimmed || " ",
            options: {
              bold: isConclusion || isEquation,
              color: isConclusion ? COLORS.correctText : COLORS.solutionText,
              fontSize: panelFontSize,
              fontFace: "Calibri",
              breakLine: true,
            },
          });
        });

        s.addText(runs, {
          x: panelX + 0.15,
          y: panelY + 0.1,
          w: panelTextW,
          h: panelH - 0.2,
          valign: "top",
          wrap: true,
          lineSpacingMultiple: 1.15,
        });
      };

      // ── SLIDE 1 : Question (no answer reveal) ───────────────────
      const qSlide = pptx.addSlide();
      qSlide.background = { color: COLORS.bg };
      addWatermark(qSlide);

      qSlide.addText(infoText, {
        x: 0.2,
        y: 0.05,
        w: q.examTitle ? EXAM_BADGE_X - 0.1 - 0.2 : 9.6,
        h: 0.35,
        fontSize: 10,
        color: COLORS.metaText,
        fontFace: "Calibri",
        valign: "middle",
      });
      addExamBadge(qSlide, q);
      addLogo(qSlide);
      addQuestionBox(qSlide);
      addOptionsGrid(qSlide, false /* no answer highlight */);

      // ── SLIDE 2 : Answer + Explanation ────────────────────────────
      const aSlide = pptx.addSlide();
      aSlide.background = { color: COLORS.bg };
      addWatermark(aSlide);

      // "Answer" badge in top-left
      aSlide.addShape("rect", {
        x: 0.2,
        y: 0.05,
        w: 1.1,
        h: 0.3,
        fill: { color: COLORS.correctBorder },
        line: { color: COLORS.correctBorder, width: 0 },
      });
      aSlide.addText("ANSWER", {
        x: 0.2,
        y: 0.05,
        w: 1.1,
        h: 0.3,
        fontSize: 9,
        bold: true,
        color: "FFFFFF",
        fontFace: "Calibri",
        align: "center",
        valign: "middle",
      });

      aSlide.addText(infoText, {
        x: 1.4,
        y: 0.05,
        w: q.examTitle ? EXAM_BADGE_X - 0.1 - 1.4 : 8.4,
        h: 0.35,
        fontSize: 10,
        color: COLORS.metaText,
        fontFace: "Calibri",
        valign: "middle",
      });
      addExamBadge(aSlide, q);
      addLogo(aSlide);
      addQuestionBox(aSlide);

      if (showSolutionBox) {
        // Options in a single left-hand column, explanation panel alongside.
        addOptionsList(aSlide);
        addExplanationPanel(aSlide);
      } else {
        addOptionsGrid(aSlide, true /* highlight correct answer */);
        if (showCorrectLabel) {
          const correctOpt = validOptions.find((o) => o.is_correct)!;
          const correctIdx = validOptions.indexOf(correctOpt);
          const correctLabel =
            OPTION_LABELS[correctIdx] || String(correctIdx + 1);
          const labelText = `Correct Answer: ${correctLabel}. ${correctOpt.option_text}`;
          const stripY = gridEndY + SECTION_GAP;
          const labelBoxH = clamp(
            estimateLines(labelText, 9.3, 11, true) * lineHeightIn(11) + 0.3,
            0.6,
            SLIDE_BOTTOM - stripY,
          );
          aSlide.addShape("rect", {
            x: 0.2,
            y: stripY,
            w: 9.6,
            h: labelBoxH,
            fill: { color: COLORS.correctBg },
            line: { color: COLORS.correctBorder, width: 1 },
          });
          aSlide.addText(labelText, {
            x: 0.35,
            y: stripY,
            w: 9.3,
            h: labelBoxH,
            fontSize: 11,
            bold: true,
            color: COLORS.correctText,
            fontFace: "Calibri",
            valign: "middle",
            wrap: true,
          });
        }
      }
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const chapter = metadata?.chapter?.replace(/[^a-zA-Z0-9]/g, "_") || "MCQ";
    const filename = `${chapter}_${questions.length}Q_EasyLearning.pptx`;

    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PowerPoint generation error:", error);
    return NextResponse.json(
      { error: `Failed to generate PowerPoint: ${error}` },
      { status: 500 },
    );
  }
}
