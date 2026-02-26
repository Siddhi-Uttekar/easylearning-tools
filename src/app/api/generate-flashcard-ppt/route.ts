import { NextRequest, NextResponse } from "next/server";
import * as PPTX from "pptxgenjs";
import path from "path";

interface FlashcardItem {
  front: string;
  back: string;
}

interface Metadata {
  chapter?: string;
  subject?: string;
  standard?: string;
  title?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addLogo = (slide: any, W: number, _H: number) => {
  const logoPath = path.join(process.cwd(), "public/icon.png");
  try {
    // top-right corner, circular avatar style matching the reference
    slide.addImage({ path: logoPath, x: W - 0.75, y: 0.12, w: 0.58, h: 0.58 });
  } catch {
    // skip if logo missing
  }
};

// ── Portrait card dimensions (inches) ────────────────────────────────────────
const W = 4.5;    // width  (inches)
const H = 10.0;   // height (inches)

const BORDER_COLOR = "5BA4CF";   // light-medium blue border (matches reference)
const BORDER_WIDTH = 6;          // pt
const BG = "FFFFFF";
const TEXT_DARK = "1A1A1A";
const SOLUTION_BORDER = "4A90C4"; // blue outline of the Solution button

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addBorder = (slide: any) => {
  // Draw a rounded-ish rect as a border by adding a rect with no fill
  slide.addShape("rect", {
    x: 0.08,
    y: 0.08,
    w: W - 0.16,
    h: H - 0.16,
    fill: { type: "none" },
    line: { color: BORDER_COLOR, width: BORDER_WIDTH },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flashcards, metadata } = body as {
      flashcards: FlashcardItem[];
      metadata?: Metadata;
    };

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards provided" },
        { status: 400 },
      );
    }

    const pptx = new PPTX.default();
    // Portrait layout matching reference screenshots
    pptx.defineLayout({ name: "PORTRAIT_CARD", width: W, height: H });
    pptx.layout = "PORTRAIT_CARD";

    const presentationTitle =
      metadata?.title || metadata?.chapter || "Flashcards";

    // ── Title slide ──────────────────────────────────────────────
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: BG };
    addBorder(titleSlide);
    addLogo(titleSlide, W, H);

    titleSlide.addText(presentationTitle, {
      x: 0.4,
      y: H * 0.28,
      w: W - 0.8,
      h: 2.0,
      fontSize: 36,
      bold: false,
      color: TEXT_DARK,
      fontFace: "Georgia",
      align: "center",
      valign: "middle",
      wrap: true,
    });

    const infoLines: string[] = [];
    if (metadata?.subject) infoLines.push(metadata.subject);
    if (metadata?.standard) infoLines.push(`Class ${metadata.standard}`);
    infoLines.push(`${flashcards.length} Cards`);

    titleSlide.addText(infoLines.join("  •  "), {
      x: 0.4,
      y: H * 0.58,
      w: W - 0.8,
      h: 0.5,
      fontSize: 14,
      color: "64748B",
      fontFace: "Georgia",
      align: "center",
    });

    titleSlide.addText("EasyLearning Tools", {
      x: 0.4,
      y: H - 0.65,
      w: W - 0.8,
      h: 0.4,
      fontSize: 10,
      color: "94A3B8",
      fontFace: "Georgia",
      align: "center",
      italic: true,
    });

    // ── Two slides per flashcard: FRONT then BACK ──────────────
    flashcards.forEach((card, idx) => {
      const cardNum = `${idx + 1} / ${flashcards.length}`;

      // ── FRONT (question) ─────────────────────────────────────
      const frontSlide = pptx.addSlide();
      frontSlide.background = { color: BG };
      addBorder(frontSlide);
      addLogo(frontSlide, W, H);

      // card counter top-left
      frontSlide.addText(cardNum, {
        x: 0.25,
        y: 0.2,
        w: 1.2,
        h: 0.32,
        fontSize: 11,
        color: "94A3B8",
        fontFace: "Georgia",
      });

      // Question text – large serif, centered in upper ~55% of slide
      frontSlide.addText(card.front, {
        x: 0.35,
        y: H * 0.2,
        w: W - 0.7,
        h: H * 0.44,
        fontSize: 30,
        bold: false,
        color: TEXT_DARK,
        fontFace: "Georgia",
        align: "center",
        valign: "middle",
        wrap: true,
      });

      // "Solution" button – white fill, blue border, centered
      const btnW = 2.4;
      const btnH = 0.62;
      const btnX = (W - btnW) / 2;
      const btnY = H * 0.70;

      frontSlide.addShape("rect", {
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        fill: { color: BG },
        line: { color: SOLUTION_BORDER, width: 2 },
      });
      frontSlide.addText("Solution", {
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        fontSize: 18,
        color: TEXT_DARK,
        fontFace: "Georgia",
        align: "center",
        valign: "middle",
      });

      // ── BACK (answer) ─────────────────────────────────────────
      const backSlide = pptx.addSlide();
      backSlide.background = { color: BG };
      addBorder(backSlide);
      addLogo(backSlide, W, H);

      // card counter
      backSlide.addText(cardNum, {
        x: 0.25,
        y: 0.2,
        w: 1.2,
        h: 0.32,
        fontSize: 11,
        color: "94A3B8",
        fontFace: "Georgia",
      });

      // Answer text – large serif, fills upper ~60%
      backSlide.addText(card.back, {
        x: 0.3,
        y: H * 0.06,
        w: W - 0.6,
        h: H * 0.60,
        fontSize: 26,
        bold: false,
        color: TEXT_DARK,
        fontFace: "Georgia",
        align: "center",
        valign: "middle",
        wrap: true,
      });
    });

    // ── End slide ─────────────────────────────────────────────
    const endSlide = pptx.addSlide();
    endSlide.background = { color: BG };
    addBorder(endSlide);
    addLogo(endSlide, W, H);

    endSlide.addText("End of Flashcards", {
      x: 0.35,
      y: H * 0.35,
      w: W - 0.7,
      h: 1.2,
      fontSize: 30,
      bold: false,
      color: TEXT_DARK,
      fontFace: "Georgia",
      align: "center",
      valign: "middle",
    });
    endSlide.addText(`${flashcards.length} cards  •  ${presentationTitle}`, {
      x: 0.35,
      y: H * 0.55,
      w: W - 0.7,
      h: 0.5,
      fontSize: 14,
      color: "64748B",
      fontFace: "Georgia",
      align: "center",
    });
    endSlide.addText("EasyLearning Tools", {
      x: 0.35,
      y: H - 0.65,
      w: W - 0.7,
      h: 0.4,
      fontSize: 10,
      color: "94A3B8",
      fontFace: "Georgia",
      align: "center",
      italic: true,
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const safeName =
      presentationTitle.replace(/[^a-zA-Z0-9]/g, "_") || "Flashcards";
    const filename = `${safeName}_${flashcards.length}cards_EasyLearning.pptx`;

    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Flashcard PPT generation error:", error);
    return NextResponse.json(
      { error: `Failed to generate PowerPoint: ${error}` },
      { status: 500 },
    );
  }
}

