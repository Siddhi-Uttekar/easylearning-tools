import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

interface Question {
  question_id: number;
  question_text: string;
  solution: string;
  difficulty_level: string;
  chapter_name: string;
  subject: string;
  standard: number;
  options: Array<{
    option_id: number;
    option_text: string;
    is_correct: boolean;
  }>;
}

interface PPTRequest {
  questions: Question[];
  metadata: {
    chapter: string;
    subject: string;
    standard: string;
    username: string;
    difficultyFilters: string;
    totalCount: number;
  };
}

// Enhanced function to extract images and clean HTML content including MathJax
function extractImagesAndCleanContent(html: string | null | undefined): {
  cleanedText: string;
  images: Array<{ src: string; alt?: string }>;
} {
  if (!html || typeof html !== "string") {
    return { cleanedText: "Content not available", images: [] };
  }

  // Extract images before cleaning
  const images: Array<{ src: string; alt?: string }> = [];
  const imgRegex =
    /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*(?:alt\s*=\s*["']([^"']*)["'])?[^>]*>/gi;
  let imgMatch;

  while ((imgMatch = imgRegex.exec(html)) !== null) {
    images.push({
      src: imgMatch[1],
      alt: imgMatch[2] || undefined,
    });
  }

  let cleaned = html;

  // Handle MathJax containers - extract data-c attributes which contain Unicode representations
  cleaned = cleaned.replace(
    /<mjx-container[^>]*>.*?<\/mjx-container>/g,
    (match) => {
      // Try to extract mathematical content from data-c attributes
      const dataCMatches = match.match(/data-c="([^"]+)"/g);
      if (dataCMatches) {
        const unicodeChars = dataCMatches
          .map((m) => {
            const code = m.match(/data-c="([^"]+)"/)?.[1];
            if (code) {
              // Convert Unicode code point to character
              const charCode = parseInt(code, 16);
              if (charCode && charCode > 0x20 && charCode < 0x10ffff) {
                return String.fromCodePoint(charCode);
              }
            }
            return "";
          })
          .join("");

        if (unicodeChars.trim()) {
          return unicodeChars; // Remove the [Math: ] wrapper
        }
      }

      // Fallback: try to extract any readable text content
      const textContent = match.replace(/<[^>]*>/g, "").trim();
      if (textContent && textContent.length > 0) {
        return textContent; // Remove the [Math: ] wrapper
      }

      return "Mathematical Expression"; // Clean fallback without brackets
    }
  );

  // Handle SVG mathematical expressions
  cleaned = cleaned.replace(
    /<svg[^>]*role="img"[^>]*>.*?<\/svg>/g,
    "Mathematical Expression"
  );

  // Handle MathML expressions
  cleaned = cleaned.replace(
    /<math[^>]*>.*?<\/math>/g,
    "Mathematical Expression"
  );

  // Handle common LaTeX patterns first (before removing other content)
  cleaned = cleaned
    .replace(/\$\$([^$]+)\$\$/g, "$1") // Remove double dollar signs
    .replace(/\$([^$]+)\$/g, "$1") // Remove single dollar signs
    .replace(/\\hat\{([^}]+)\}/g, "$1̂") // Convert \hat{i} to î
    .replace(/\\overset\{\\to\s*\}\{\\mathop\{([^}]+)\}\\,\}/g, "$1⃗") // Convert vector notation
    .replace(/\\mathop\{([^}]+)\}/g, "$1") // Remove mathop
    .replace(/\\,/g, " ") // Convert \, to space
    .replace(/&there4;/g, "∴") // Convert therefore symbol
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)") // Convert square root
    .replace(/\{\{([^}]+)\}\}/g, "$1") // Remove double braces
    .replace(/\^2/g, "²") // Convert superscript 2
    .replace(/\^3/g, "³") // Convert superscript 3
    .replace(
      /\^([0-9])/g,
      (_, p1) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number.parseInt(p1)] || "^" + p1
    ) // Convert other superscripts
    .replace(/_{([^}]+)}/g, "₍$1₎") // Convert subscripts
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)") // Convert fractions
    .replace(/\\times/g, "×") // Convert multiplication
    .replace(/\\cdot/g, "·") // Convert dot multiplication
    .replace(/\\pm/g, "±") // Convert plus-minus
    // Greek letters
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\omega/g, "ω")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\mu/g, "μ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\phi/g, "φ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\chi/g, "χ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\tau/g, "τ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\zeta/g, "ζ")
    .replace(/\\eta/g, "η")
    .replace(/\\kappa/g, "κ")
    .replace(/\\nu/g, "ν")
    .replace(/\\xi/g, "ξ")
    .replace(/\\upsilon/g, "υ")
    // Mathematical operators
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\equiv/g, "≡")
    .replace(/\\propto/g, "∝")
    .replace(/\\infty/g, "∞")
    .replace(/\\partial/g, "∂")
    .replace(/\\nabla/g, "∇")
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "∑")
    .replace(/\\prod/g, "∏")
    // Remove remaining LaTeX commands
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\{([^}]*)\}/g, "$1");

  // Clean HTML tags (but preserve img info separately)
  cleaned = cleaned
    .replace(/<img[^>]*>/gi, "") // Remove img tags completely since we handle them separately
    .replace(/<br\s*\/?>/gi, "\n") // Convert breaks to newlines
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<div[^>]*>/gi, "") // Remove div tags
    .replace(/<\/div>/gi, "")
    .replace(/<span[^>]*>/gi, "") // Remove span tags
    .replace(/<\/span>/gi, "")
    .replace(/<[^>]*>/g, "") // Remove all remaining HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');

  // Remove any remaining HTML entities
  cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, "");

  // Remove control characters
  cleaned = cleaned
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\uFFFE\uFFFF]/g, "")
    .replace(/[\u0000-\u0008\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize whitespace but preserve line breaks
  cleaned = cleaned
    .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
    .replace(/\n\s*\n\s*/g, "\n\n") // Replace multiple newlines with double newline
    .replace(/^\s+|\s+$/g, ""); // Trim start and end

  // Improved logic - don't return "Content not available" if we have ANY meaningful content
  if (!cleaned || cleaned.length === 0 || /^[\s\n]*$/.test(cleaned)) {
    // Only return "Content not available" if truly empty or only whitespace

    // Last attempt: check if original HTML had any text content at all
    const rawTextCheck = html
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, "") // Remove HTML entities
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
      .trim();

    if (rawTextCheck && rawTextCheck.length > 0) {
      // If original had some text content, use it
      cleaned =
        rawTextCheck.length > 100
          ? rawTextCheck.substring(0, 100) + "..."
          : rawTextCheck;
    } else {
      return { cleanedText: "Content not available", images };
    }
  }

  // Limit length but be more generous
  if (cleaned.length > 1500) {
    cleaned = cleaned.substring(0, 1500) + "...";
  }

  // Final check - if it's just placeholder text, provide something more meaningful
  if (cleaned === "Mathematical Expression") {
    // Check if we have images to supplement
    if (images.length > 0) {
      cleaned = `Mathematical content with ${images.length} image(s)`;
    } else {
      cleaned = "Mathematical expression";
    }
  }

  return { cleanedText: cleaned, images };
}

// Function to add images to slide
async function addImagesToSlide(
  slide: any,
  images: Array<{ src: string; alt?: string }>,
  startX: number,
  startY: number,
  maxWidth: number = 2,
  maxHeight: number = 1.5
) {
  for (let i = 0; i < images.length && i < 2; i++) {
    // Limit to 2 images per slide
    const image = images[i];
    try {
      // Check if it's a data URL or external URL
      if (image.src.startsWith("data:") || image.src.startsWith("http")) {
        slide.addImage({
          data: image.src,
          x: startX + i * (maxWidth + 0.2),
          y: startY,
          w: maxWidth,
          h: maxHeight,
          sizing: { type: "contain", w: maxWidth, h: maxHeight },
        });
      }
    } catch (error) {
      console.warn(`Failed to add image ${i + 1}:`, error);
      // Add placeholder text for failed images
      slide.addText(`[Image ${i + 1}: ${image.alt || "Failed to load"}]`, {
        x: startX + i * (maxWidth + 0.2),
        y: startY,
        w: maxWidth,
        h: 0.5,
        fontSize: 10,
        color: "999999",
        align: "center",
        fontFace: "Arial",
        italic: true,
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PPTRequest = await request.json();
    const { questions, metadata } = body;

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions provided" },
        { status: 400 }
      );
    }

    // Create new presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = "Easy Learning";
    pptx.company = "Easy Learning Platform";
    pptx.title = `${metadata.chapter} - Quiz Questions`;
    pptx.subject = `${metadata.subject} Class ${metadata.standard}`;

    // Define theme colors
    const themeColors = {
      primary: "1F2937", // Dark gray
      secondary: "3B82F6", // Blue
      accent: "10B981", // Green
      text: "374151", // Gray-700
      background: "F9FAFB", // Gray-50
      watermark: "E5E7EB", // Gray-200
      easy: "10B981", // Green
      medium: "F59E0B", // Yellow
      hard: "EF4444", // Red
    };

    // Create title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: themeColors.background };

    // Add Easy Learning watermark
    titleSlide.addText("Easy Learning", {
      x: 0.2,
      y: 0.2,
      w: 2.5,
      h: 0.6,
      fontSize: 18,
      color: themeColors.watermark,
      fontFace: "Arial Black",
      transparency: 70,
    });

    // Title slide content
    titleSlide.addText("Quiz Questions", {
      x: 1,
      y: 1.8,
      w: 8,
      h: 1.5,
      fontSize: 48,
      bold: true,
      color: themeColors.primary,
      align: "center",
      fontFace: "Arial",
    });

    titleSlide.addText(
      `Subject: ${metadata.subject} | Class: ${metadata.standard}`,
      {
        x: 1,
        y: 3.5,
        w: 8,
        h: 0.8,
        fontSize: 24,
        color: themeColors.secondary,
        align: "center",
        fontFace: "Arial",
      }
    );

    titleSlide.addText(`Chapter: ${metadata.chapter}`, {
      x: 1,
      y: 4.3,
      w: 8,
      h: 0.8,
      fontSize: 20,
      color: themeColors.text,
      align: "center",
      fontFace: "Arial",
    });

    titleSlide.addText(`Total Questions: ${questions.length}`, {
      x: 1,
      y: 5.1,
      w: 8,
      h: 0.6,
      fontSize: 18,
      color: themeColors.accent,
      align: "center",
      fontFace: "Arial",
    });

    // Add generation info with current date
    titleSlide.addText(`Generated on: 2025-07-15 08:11:13 UTC`, {
      x: 1,
      y: 5.9,
      w: 8,
      h: 0.4,
      fontSize: 12,
      color: themeColors.text,
      align: "center",
      fontFace: "Arial",
    });

    titleSlide.addText(`Created by: PrashantPatil0707`, {
      x: 1,
      y: 6.3,
      w: 8,
      h: 0.4,
      fontSize: 12,
      color: themeColors.text,
      align: "center",
      fontFace: "Arial",
    });

    // Add difficulty stats
    const stats = {
      easy: questions.filter((q) => q.difficulty_level === "easy").length,
      medium: questions.filter((q) => q.difficulty_level === "medium").length,
      hard: questions.filter((q) => q.difficulty_level === "hard").length,
    };

    titleSlide.addText(
      `Difficulty Distribution: Easy (${stats.easy}) • Medium (${stats.medium}) • Hard (${stats.hard})`,
      {
        x: 1,
        y: 6.9,
        w: 8,
        h: 0.6,
        fontSize: 14,
        color: themeColors.text,
        align: "center",
        fontFace: "Arial",
      }
    );

    // Add filters applied
    if (metadata.difficultyFilters && metadata.difficultyFilters !== "EMH") {
      titleSlide.addText(
        `Difficulty Filters Applied: ${metadata.difficultyFilters}`,
        {
          x: 1,
          y: 7.4,
          w: 8,
          h: 0.4,
          fontSize: 12,
          color: themeColors.secondary,
          align: "center",
          fontFace: "Arial",
          italic: true,
        }
      );
    }

    // Process each question - SEPARATE SLIDES BUT BETTER SPACING
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];

      try {
        // ————— QUESTION SLIDE —————
        const questionSlide = pptx.addSlide();
        questionSlide.background = { color: themeColors.background };

        // 1. Watermark
        questionSlide.addText("Easy Learning", {
          x: 0.2,
          y: 0.2,
          w: 2,
          h: 0.4,
          fontSize: 12,
          color: themeColors.watermark,
          fontFace: "Arial Black",
          transparency: 75,
        });

        // 2. Header ("Question X of Y")
        questionSlide.addText(`Question ${index + 1} of ${questions.length}`, {
          x: 0.5,
          y: 0.3,
          w: 6,
          h: 0.5,
          fontSize: 14,
          color: themeColors.text,
          fontFace: "Arial",
        });

        // 3. Difficulty badge
        const difficultyColor =
          question.difficulty_level === "easy"
            ? themeColors.easy
            : question.difficulty_level === "medium"
            ? themeColors.medium
            : themeColors.hard;

        questionSlide.addShape("roundRect", {
          x: 8.2,
          y: 0.25,
          w: 1.3,
          h: 0.4,
          fill: { color: difficultyColor },
          line: { color: difficultyColor, width: 1 },
        });
        questionSlide.addText(question.difficulty_level.toUpperCase(), {
          x: 8.2,
          y: 0.25,
          w: 1.3,
          h: 0.4,
          fontSize: 10,
          color: "FFFFFF",
          align: "center",
          fontFace: "Arial",
          bold: true,
        });

        // 4. Extract & render question text + images
        const questionData = extractImagesAndCleanContent(
          question.question_text
        );
        questionSlide.addText(questionData.cleanedText, {
          x: 0.5,
          y: 0.9,
          w: 6.5,
          h: 2.5,
          fontSize: 16,
          color: themeColors.primary,
          fontFace: "Arial",
          valign: "top",
        });
        if (questionData.images.length > 0) {
          await addImagesToSlide(
            questionSlide,
            questionData.images,
            7.2,
            0.9,
            2,
            1.5
          );
        }

        // 5. Render options in a tighter layout
        if (Array.isArray(question.options)) {
          const optionStartY = 2.5;
          for (let i = 0; i < question.options.length; i++) {
            const opt = question.options[i];
            const optData = extractImagesAndCleanContent(opt.option_text);
            const y = optionStartY + i * 0.7;

            // Letter
            questionSlide.addText(`${String.fromCharCode(65 + i)}.`, {
              x: 0.5,
              y,
              w: 0.4,
              h: 0.6,
              fontSize: 14,
              color: themeColors.text,
              fontFace: "Arial",
            });

            // Text
            questionSlide.addText(optData.cleanedText, {
              x: 1,
              y,
              w: 6.5,
              h: 0.6,
              fontSize: 12,
              color: themeColors.text,
              fontFace: "Arial",
            });

            // Any images
            if (optData.images.length > 0) {
              await addImagesToSlide(
                questionSlide,
                optData.images,
                7.8,
                y,
                1.2,
                0.8
              );
            }
          }
        }

        // ————— ANSWER SLIDE —————
        const answerSlide = pptx.addSlide();
        answerSlide.background = { color: themeColors.background };

        // 1. Watermark
        answerSlide.addText("Easy Learning", {
          x: 0.2,
          y: 0.2,
          w: 2,
          h: 0.4,
          fontSize: 12,
          color: themeColors.watermark,
          fontFace: "Arial Black",
          transparency: 75,
        });

        // 2. Header ("Answer X of Y")
        answerSlide.addText(`Answer ${index + 1} of ${questions.length}`, {
          x: 0.5,
          y: 0.3,
          w: 6,
          h: 0.5,
          fontSize: 14,
          color: themeColors.text,
          fontFace: "Arial",
        });

        // 3. Difficulty badge
        answerSlide.addShape("roundRect", {
          x: 8.2,
          y: 0.25,
          w: 1.3,
          h: 0.4,
          fill: { color: difficultyColor },
          line: { color: difficultyColor, width: 1 },
        });
        answerSlide.addText(question.difficulty_level.toUpperCase(), {
          x: 8.2,
          y: 0.25,
          w: 1.3,
          h: 0.4,
          fontSize: 10,
          color: "FFFFFF",
          align: "center",
          fontFace: "Arial",
          bold: true,
        });

        // 4. "Question:" reminder + summary
        answerSlide.addText("Question:", {
          x: 0.5,
          y: 0.7,
          w: 1.5,
          h: 0.4,
          fontSize: 12,
          color: themeColors.text,
          fontFace: "Arial",
          bold: true,
        });
        const summary =
          questionData.cleanedText.length > 100
            ? questionData.cleanedText.slice(0, 100) + "..."
            : questionData.cleanedText;
        answerSlide.addText(summary, {
          x: 0.5,
          y: 1,
          w: 9,
          h: 0.8,
          fontSize: 11,
          color: themeColors.text,
          fontFace: "Arial",
          italic: true,
        });

        // 5. Correct answer display
        const correctOpt = question.options?.find((o) => o.is_correct);
        const correctIdx =
          question.options?.findIndex((o) => o.is_correct) ?? -1;
        const letter =
          correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : "A";
        const correctData = extractImagesAndCleanContent(
          correctOpt?.option_text
        );

        answerSlide.addText("✓ Correct Answer:", {
          x: 0.5,
          y: 1.8,
          w: 2.5,
          h: 0.6,
          fontSize: 18,
          color: themeColors.accent,
          fontFace: "Arial",
          bold: true,
        });
        answerSlide.addText(`${letter}. ${correctData.cleanedText}`, {
          x: 0.5,
          y: 2.2,
          w: 6.5,
          h: 1,
          fontSize: 16,
          color: themeColors.accent,
          fontFace: "Arial",
          bold: true,
        });
        if (correctData.images.length) {
          await addImagesToSlide(
            answerSlide,
            correctData.images,
            7.2,
            2.2,
            2,
            1.2
          );
        }

        // 6. Solution section
        const solData = extractImagesAndCleanContent(question.solution);
        if (
          solData.cleanedText &&
          solData.cleanedText !== "Content not available"
        ) {
          answerSlide.addText("💡 Solution:", {
            x: 0.5,
            y: 3,
            w: 2,
            h: 0.6,
            fontSize: 16,
            color: themeColors.primary,
            fontFace: "Arial",
            bold: true,
          });
          answerSlide.addText(solData.cleanedText, {
            x: 0.5,
            y: 3.7,
            w: 6.5,
            h: 2.8,
            fontSize: 14,
            color: themeColors.text,
            fontFace: "Arial",
            valign: "top",
          });
          if (solData.images.length) {
            await addImagesToSlide(
              answerSlide,
              solData.images,
              7.2,
              3.9,
              2,
              1.5
            );
          }
        }
      } catch (questionError) {
        console.error(`Error processing question ${index + 1}:`, questionError);

        // Error slide
        const errorSlide = pptx.addSlide();
        errorSlide.background = { color: themeColors.background };

        errorSlide.addText("Easy Learning", {
          x: 0.2,
          y: 0.2,
          w: 2,
          h: 0.4,
          fontSize: 12,
          color: themeColors.watermark,
          fontFace: "Arial Black",
          transparency: 75,
        });

        errorSlide.addText(`Error Processing Question ${index + 1}`, {
          x: 1,
          y: 3,
          w: 8,
          h: 1,
          fontSize: 24,
          color: themeColors.hard,
          align: "center",
          fontFace: "Arial",
          bold: true,
        });

        errorSlide.addText("Please check the question data and try again.", {
          x: 1,
          y: 4,
          w: 8,
          h: 0.8,
          fontSize: 16,
          color: themeColors.text,
          align: "center",
          fontFace: "Arial",
        });
      }
    }

    // Generate the presentation buffer
    const pptxBuffer = await pptx.write({ outputType: "arraybuffer" });

    // Create response with proper headers
    const contentLength =
      pptxBuffer instanceof ArrayBuffer
        ? pptxBuffer.byteLength.toString()
        : pptxBuffer instanceof Uint8Array
        ? pptxBuffer.byteLength.toString()
        : pptxBuffer instanceof Blob
        ? pptxBuffer.size.toString()
        : pptxBuffer.length?.toString() || "0";

    const response = new NextResponse(pptxBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${metadata.chapter}_${questions.length}Q_${metadata.difficultyFilters}_EasyLearning.pptx"`,
        "Content-Length": contentLength,
      },
    });

    return response;
  } catch (error) {
    console.error("PPT Generation Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PowerPoint presentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
