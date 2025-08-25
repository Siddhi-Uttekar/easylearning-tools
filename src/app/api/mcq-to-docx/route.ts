import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

// Define types for our data structures
interface Question {
  question: string;
  type: string;
  options: [string, string][]; // Each option is [text, status]
  solution: string;
  marks: number;
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

    // Parse MCQ text
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

    // Create DOCX
    const zip = new JSZip();

    // Create document.xml
    const documentXml = createDocumentXml(questions);
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
</Types>`;
    zip.file("[Content_Types].xml", contentTypes);

    // Create .rels files
    const relsRoot = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    zip.file("_rels/.rels", relsRoot);

    const relsDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
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

function createDocumentXml(questions: Question[]): string {
  let bodyXml = "";

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
      "left"
    )}</w:tr>`;

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
        "left"
      )}${tc(q.options[i][1], 1, false, "left")}</w:tr>`;
    }

    rows += `<w:tr>${tc("Solution", 1, true)}${tc(
      q.solution,
      2,
      false,
      "left"
    )}</w:tr>`;

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

function tc(
  text: string,
  gridSpan: number = 1,
  bold: boolean = false,
  align: string = "left"
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

  return `<w:tc>
    <w:tcPr>${span}${borders}${margins}</w:tcPr>
    <w:p>
      <w:pPr>${jc}</w:pPr>
      <w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
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
