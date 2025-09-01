// app/api/generate-certificate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CertificateData } from "@/types/certificates";
import {
  generateCertificateHTML,
  generatePDF,
  generatePNG,
} from "@/utils/certificate/generation";

export async function POST(req: NextRequest) {
  try {
    const { data, format } = (await req.json()) as {
      data: CertificateData;
      format: "png" | "pdf";
    };

    if (!data || !format) {
      return NextResponse.json(
        { error: "Missing data or format" },
        { status: 400 }
      );
    }

    const html = generateCertificateHTML(data);
    const fileName = `certificate-${data.student.name
      .replace(/\s+/g, "-")
      .toLowerCase()}`;

    if (format === "png") {
      const pngBuffer = await generatePNG(html);
      const arrayBuffer = pngBuffer.buffer.slice(
        pngBuffer.byteOffset,
        pngBuffer.byteOffset + pngBuffer.byteLength
      );
      return new NextResponse(arrayBuffer as ArrayBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${fileName}.png"`,
        },
      });
    } else {
      const pdfBuffer = await generatePDF(html);
      const arrayBuffer = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      );
      return new NextResponse(arrayBuffer as ArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      {
        error: "Failed to generate certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

