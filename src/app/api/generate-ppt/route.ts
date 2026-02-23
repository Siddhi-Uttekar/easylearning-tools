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
}

interface Metadata {
  chapter?: string;
  subject?: string;
  standard?: string;
  username?: string;
  difficultyFilters?: string;
  totalCount?: number;
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
      x: 9.0,
      y: 0,
      w: 0.6,
      h: 0.6,
    });
  } catch {
    // Logo file may not exist; skip silently
  }
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
      { label: "Standard", value: `Class ${metadata?.standard || "—"}` },
      { label: "Questions", value: String(questions.length) },
      { label: "Difficulty", value: metadata?.difficultyFilters || "Mixed" },
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

    // ── One slide per question ────────────────────────────────────
    questions.forEach((q, idx) => {
      const slide = pptx.addSlide();
      slide.background = { color: COLORS.bg };
      addWatermark(slide);

      // Q info line (plain dark text, no bar)
      slide.addText(
        `Q${idx + 1}  •  ${metadata?.chapter || ""}  •  ${metadata?.subject || ""}  •  Class ${metadata?.standard || ""}`,
        {
          x: 0.2,
          y: 0.05,
          w: 9.6,
          h: 0.35,
          fontSize: 10,
          color: COLORS.metaText,
          fontFace: "Calibri",
          valign: "middle",
        },
      );
      addLogo(slide);

      // Question text box
      slide.addShape("rect", {
        x: 0.2,
        y: 0.45,
        w: 9.6,
        h: 1.5,
        fill: { color: COLORS.card },
        line: { color: COLORS.accent, width: 1.5 },
      });
      slide.addText(q.question_text, {
        x: 0.35,
        y: 0.5,
        w: 9.3,
        h: 1.4,
        fontSize: 14,
        bold: true,
        color: COLORS.questionText,
        fontFace: "Calibri",
        wrap: true,
        valign: "middle",
      });

      // Options — 2 columns, 2 rows
      const validOptions = q.options || [];
      validOptions.forEach((opt, oIdx) => {
        const col = oIdx % 2;
        const row = Math.floor(oIdx / 2);
        const x = 0.2 + col * 4.9;
        const y = 2.1 + row * 1.05;
        const w = 4.7;
        const h = 0.85;
        const isCorrect = opt.is_correct;
        const label = OPTION_LABELS[oIdx] || String(oIdx + 1);

        // Option card
        slide.addShape("rect", {
          x,
          y,
          w,
          h,
          fill: { color: isCorrect ? COLORS.correctBg : COLORS.card },
          line: {
            color: isCorrect ? COLORS.correctBorder : COLORS.defaultBorder,
            width: isCorrect ? 2 : 1,
          },
        });

        // Label + option text as inline fragments (no circle)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slide.addText(
          [
            {
              text: `${label}.  `,
              options: {
                bold: true,
                fontSize: 13,
                color: isCorrect ? COLORS.correctText : COLORS.accent,
                fontFace: "Calibri",
              } as any,
            },
            {
              text: opt.option_text,
              options: {
                bold: isCorrect,
                fontSize: 12,
                color: isCorrect ? COLORS.correctText : COLORS.optionText,
                fontFace: "Calibri",
              } as any,
            },
          ],
          {
            x: x + 0.2,
            y,
            w: w - 0.3,
            h,
            wrap: true,
            valign: "middle",
          },
        );
      });

      // Solution / explanation (if available)
      if (
        q.solution &&
        q.solution.trim() &&
        q.solution !== "Ans: Self Explanatory"
      ) {
        const solutionText = q.solution.replace(/^Ans:\s*/i, "").trim();
        if (solutionText.length > 0 && solutionText !== "Self Explanatory") {
          slide.addShape("rect", {
            x: 0.2,
            y: 4.25,
            w: 9.6,
            h: 1.2,
            fill: { color: COLORS.solutionBg },
            line: { color: "F59E0B", width: 1 },
          });
          slide.addText("Explanation: ", {
            x: 0.35,
            y: 4.27,
            w: 1.3,
            h: 0.35,
            fontSize: 10,
            bold: true,
            color: COLORS.solutionText,
            fontFace: "Calibri",
          });
          slide.addText(solutionText, {
            x: 0.35,
            y: 4.6,
            w: 9.3,
            h: 0.75,
            fontSize: 10,
            color: COLORS.solutionText,
            fontFace: "Calibri",
            wrap: true,
            valign: "top",
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
