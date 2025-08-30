import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { parse } from "node-html-parser";

// Define types for our data structures
interface Question {
  question: string;
  type: string;
  options: [string, string][]; // Each option is [text, status]
  solution: string;
  marks: number;
  images?: Array<{ id: string; data: string; type: string }>; // Added images support
}

interface ImageData {
  id: string;
  data: string;
  type: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { mcqText, filename } = (await request.json()) as {
      mcqText: string;
      filename?: string;
    };

    if (!mcqText || mcqText.trim() === "") {
      return NextResponse.json(
        { error: "No MCQ text provided" },
        { status: 400 }
      );
    }

    // Check if content is HTML (contains HTML tags)
    const isHtmlContent = /<[a-z][\s\S]*>/i.test(mcqText);
    let questions: Question[] = [];
    let allImages: ImageData[] = [];

    if (isHtmlContent) {
      // Process HTML content from database
      const result = parseHtmlContent(mcqText);
      questions = result.questions;
      allImages = result.images;
    } else {
      // Process manual MCQ text
      questions = parseManualMCQ(mcqText);
    }

    // Create DOCX
    const zip = new JSZip();

    // Add images to the DOCX if any
    if (allImages.length > 0) {
      const mediaFolder = zip.folder("word/media");
      if (mediaFolder) {
        for (const image of allImages) {
          mediaFolder.file(`${image.id}.${image.type}`, image.data, {
            base64: true,
          });
        }
      }
    }

    // Create document.xml
    const documentXml = createDocumentXml(questions, allImages);
    zip.file("word/document.xml", documentXml);

    // Create styles.xml
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/><w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault><w:pPr/></w:pPrDefault>
  </w:docDefaults>
</w:styles>`;
    zip.file("word/styles.xml", stylesXml);

    // Create content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  ${
    allImages.length > 0
      ? '<Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/>'
      : ""
  }
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);

    // Create .rels files
    const relsRoot = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    zip.file("_rels/.rels", relsRoot);

    // Create document.xml.rels with image relationships if needed
    let relsDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;

    // Add image relationships
    let relId = 2;
    for (let i = 0; i < allImages.length; i++) {
      relsDoc += `<Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${allImages[i].id}.${allImages[i].type}"/>`;
      relId++;
    }

    relsDoc += "</Relationships>";
    zip.file("word/_rels/document.xml.rels", relsDoc);

    // Generate the DOCX file
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    // Set headers for download
    const safeFilename =
      (
        filename || "MCQs_" + new Date().toISOString().replace(/[:.]/g, "-")
      ).replace(/[^a-zA-Z0-9_\-]/g, "_") + ".docx";

    // Convert Buffer to ArrayBuffer for NextResponse
    const arrayBuffer: ArrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX file" },
      { status: 500 }
    );
  }
}

// Function to parse HTML content from database
function parseHtmlContent(html: string): {
  questions: Question[];
  images: ImageData[];
} {
  const root = parse(html);
  const questions: Question[] = [];
  const images: ImageData[] = [];

  // Extract all images
  const imgElements = root.querySelectorAll("img");
  imgElements.forEach((img, index) => {
    const src = img.getAttribute("src");
    if (src) {
      // Generate a unique ID for the image
      const imageId = `image${index + 1}`;
      let imageType = "png"; // Default type
      let imageData = "";

      if (src.startsWith("data:")) {
        // It's a base64 encoded image
        const [header, data] = src.split(",");
        if (header && data) {
          const mimeType = header.split(";")[0].split(":")[1];
          if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
            imageType = "jpg";
          } else if (mimeType === "image/png") {
            imageType = "png";
          }
          imageData = data;
        }
      } else {
        // It's a URL - in a real implementation, you would fetch the image
        // For now, we'll just store the URL and use a placeholder
        imageType = "png";
        imageData =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="; // Transparent placeholder
      }

      images.push({
        id: imageId,
        data: imageData,
        type: imageType,
      });

      // Replace the img element with a placeholder text
      img.replaceWith(`[Image: ${imageId}]`);
    }
  });

  // Process MathJax elements
  const mathElements = root.querySelectorAll("mjx-container");
  mathElements.forEach((math) => {
    // Try to extract the mathematical content
    const mathText = math.textContent.trim();
    if (mathText) {
      math.replaceWith(`[Math: ${mathText}]`);
    } else {
      math.replaceWith("[Mathematical Expression]");
    }
  });

  // Remove other HTML elements but keep text content
  const cleanText = root.textContent
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, "\n\n"); // Preserve paragraph breaks

  // Split into questions (assuming each question is separated by double line breaks)
  const questionBlocks = cleanText
    .split("\n\n")
    .filter((block) => block.trim());

  for (const block of questionBlocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) continue;

    const q: Question = {
      question: "",
      type: "multiple_choice",
      options: [],
      solution: "",
      marks: 1,
    };

    // Extract question (first line or until we find "Options:")
    let questionText = "";
    let optionsStart = -1;

    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].toLowerCase().includes("option") ||
        lines[i].match(/^[A-Z][).]/) ||
        lines[i].match(/^\d+[).]/)
      ) {
        optionsStart = i;
        break;
      }
      questionText += lines[i] + " ";
    }

    q.question = questionText.trim();

    // Extract options
    if (optionsStart >= 0) {
      for (let i = optionsStart; i < lines.length; i++) {
        const line = lines[i];
        // Skip if it's solution or marks
        if (
          line.toLowerCase().includes("solution") ||
          line.toLowerCase().includes("answer") ||
          line.toLowerCase().includes("marks")
        ) {
          break;
        }

        // Clean option text (remove A), B), etc.)
        const optionText = line.replace(/^[A-Z][).]\s*/, "");
        q.options.push([optionText, "incorrect"]);
      }
    }

    // Extract solution
    const solutionIndex = lines.findIndex(
      (line) =>
        line.toLowerCase().includes("solution") ||
        line.toLowerCase().includes("answer")
    );

    if (solutionIndex >= 0) {
      q.solution = lines.slice(solutionIndex).join("\n");

      // Try to find the correct answer
      const answerMatch = q.solution.match(/(?:Answer|Correct):\s*([A-Z])/i);
      if (answerMatch) {
        const correctLetter = answerMatch[1].toUpperCase();
        const correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
        if (correctIndex >= 0 && correctIndex < q.options.length) {
          q.options[correctIndex][1] = "correct";
        }
      }
    }

    // Extract marks
    const marksMatch = cleanText.match(/Marks:\s*(\d+)/i);
    if (marksMatch) {
      q.marks = parseInt(marksMatch[1]) || 1;
    }

    questions.push(q);
  }

  return { questions, images };
}

// Function to parse manual MCQ text (original functionality)
function parseManualMCQ(mcqText: string): Question[] {
  const blocks = mcqText.trim().split(/\n\s*\n+/);
  const questions: Question[] = [];

  for (const block of blocks) {
    const lines: string[] = block
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line);

    if (!lines.length) continue;

    const q: Question = {
      question: "",
      type: "multiple_choice",
      options: [],
      solution: "",
      marks: 1,
    };

    let answer = "";

    for (const line of lines) {
      if (line.toUpperCase().startsWith("[Q]"))
        q.question = line.substring(3).trim();
      else if (line.toUpperCase().startsWith("[O]"))
        q.options.push([line.substring(3).trim(), "incorrect"]);
      else if (line.toUpperCase().startsWith("[A]"))
        answer = line.substring(3).trim();
      else if (line.toUpperCase().startsWith("[S]"))
        q.solution = line.substring(3).trim();
      else if (line.toUpperCase().startsWith("[M]"))
        q.marks = parseInt(line.substring(3).trim()) || 1;
    }

    // Process options with correctness status
    const opts: [string, string][] = [];
    for (const opt of q.options) {
      const optionText = Array.isArray(opt) ? opt[0] : String(opt);
      const status = optionText === answer ? "correct" : "incorrect";
      opts.push([optionText, status]);
    }
    q.options = opts;

    if (!q.solution) {
      q.solution = answer
        ? `Correct answer: ${answer}`
        : "Solution not provided.";
    }

    questions.push(q);
  }

  return questions;
}

// Modified createDocumentXml to handle images
function createDocumentXml(questions: Question[], images: ImageData[]): string {
  let bodyXml = "";
  let imageRelId = 2; // Start after styles relationship

  for (const q of questions) {
    // Table properties
    const tblPr = `<w:tblPr>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      </w:tblBorders>
    </w:tblPr>`;

    // Column widths
    const tblGrid = `<w:tblGrid>
      <w:gridCol w:w="1800"/><w:gridCol w:w="5400"/><w:gridCol w:w="1800"/>
    </w:tblGrid>`;

    // Table rows
    let rows = `<w:tr>${tc("Question", 1, true)}${tc(
      q.question,
      2,
      false,
      "left",
      images,
      imageRelId
    )}</w:tr>`;

    // Update imageRelId if any images were added
    const imageCount = (q.question.match(/\[Image: image\d+\]/g) || []).length;
    imageRelId += imageCount;

    rows += `<w:tr>${tc("Type", 1, true)}${tc(
      q.type,
      2,
      false,
      "left"
    )}</w:tr>`;

    for (let i = 0; i < q.options.length; i++) {
      rows += `<w:tr>${tc("Option " + (i + 1), 1, true)}${tc(
        q.options[i][0],
        1,
        false,
        "left",
        images,
        imageRelId
      )}${tc(q.options[i][1], 1, false, "left")}</w:tr>`;

      // Update imageRelId if any images were added
      const optionImageCount = (
        q.options[i][0].match(/\[Image: image\d+\]/g) || []
      ).length;
      imageRelId += optionImageCount;
    }

    rows += `<w:tr>${tc("Solution", 1, true)}${tc(
      q.solution,
      2,
      false,
      "left",
      images,
      imageRelId
    )}</w:tr>`;

    // Update imageRelId if any images were added
    const solutionImageCount = (q.solution.match(/\[Image: image\d+\]/g) || [])
      .length;
    imageRelId += solutionImageCount;

    rows += `<w:tr>${tc("Marks", 1, true)}${tc(
      String(q.marks),
      2,
      false,
      "left"
    )}</w:tr>`;

    // Table with spacer paragraph
    const table = `<w:tbl>${tblPr}${tblGrid}${rows}</w:tbl>`;
    const spacer = `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr></w:p>`;
    bodyXml += table + spacer;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

// Modified tc function to handle images
function tc(
  text: string,
  gridSpan: number = 1,
  bold: boolean = false,
  align: string = "left",
  images: ImageData[] = [],
  startRelId: number = 2
): string {
  const span = gridSpan > 1 ? `<w:gridSpan w:val="${gridSpan}"/>` : "";
  const jc = align !== "left" ? `<w:jc w:val="${align}"/>` : "";
  const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  const margins =
    '<w:tcMar><w:top w:w="120"/><w:left w:w="120"/><w:bottom w:w="120"/><w:right w:w="120"/></w:tcMar>';
  const borders = `<w:tcBorders>
    <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
    <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
    <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
  </w:tcBorders>`;

  // Process text to include images
  let processedText = escapeXml(text);
  let currentRelId = startRelId;

  // Replace image placeholders with actual image references
  const imageRegex = /\[Image: (image\d+)\]/g;
  let match;
  let imageElements = "";

  while ((match = imageRegex.exec(text)) !== null) {
    const imageId = match[1];
    const image = images.find((img) => img.id === imageId);

    if (image) {
      // Remove the placeholder from the text
      processedText = processedText.replace(match[0], "");

      // Add image element
      imageElements += `<w:r>
        <w:rPr/>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="914400" cy="685800"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${currentRelId}" name="${imageId}"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="${imageId}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId${currentRelId}"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="914400" cy="685800"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>`;

      currentRelId++;
    }
  }

  return `<w:tc>
    <w:tcPr>${span}${borders}${margins}</w:tcPr>
    <w:p>
      <w:pPr>${jc}</w:pPr>
      <w:r>${rPr}<w:t xml:space="preserve">${processedText}</w:t></w:r>
      ${imageElements}
    </w:p>
  </w:tc>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
