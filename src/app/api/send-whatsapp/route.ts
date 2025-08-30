// app/api/send-whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CertificateData } from "@/types/certificates";
import {
  generateCertificateHTML,
  generatePDF,
} from "@/utils/certificateGenerator";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON body:", text);
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }
    const { data, destination } = body as {
      data: CertificateData;
      destination: string;
    };

    if (!data || !destination) {
      return NextResponse.json(
        { error: "Missing data or destination" },
        { status: 400 }
      );
    }

    // Generate Certificate as PDF
    const html = generateCertificateHTML(data);
    const pdfBuffer = await generatePDF(html);

    // Upload to custom PHP script
    const fileName = `certificate-${data.student.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.pdf`;
    const formData = new FormData();
    const imageBlob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    formData.append("file", imageBlob, fileName);

    const uploadResponse = await fetch(
      "https://easylearning.live/certificates/CSV/index.php",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("PHP Upload Error:", errorText);
      throw new Error(
        `Failed to upload certificate to custom server. Status: ${uploadResponse.status}`
      );
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      throw new Error(`Custom server returned an error: ${uploadResult.error}`);
    }

    const certificateUrl = uploadResult.link;

    // Send WhatsApp message
    const apiKey = process.env.AISENSY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AISensy API key is not configured" },
        { status: 500 }
      );
    }

    const payload = {
      apiKey: apiKey,
      campaignName: "Certificate Distribution",
      destination: destination,
      userName: "EasyLearning 7428121291",
      templateParams: [
        data.student.name,
        String(data.student.rank),
        data.event.name,
        certificateUrl,
      ],
      media: {
        url: certificateUrl,
        filename: fileName,
      },
      source: "new-landing-page form",
    };

    const response = await fetch(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.json();

    if (response.ok && responseData.success) {
      return NextResponse.json({
        success: true,
        data: responseData,
        certificateUrl,
      });
    } else {
      console.error("Aisensy API error:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send message",
          details: responseData,
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error in send-whatsapp:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
