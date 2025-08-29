import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const sendCertificateViaAisensy = async (
  phone: string,
  studentName: string,
  pdfUrl: string
) => {
  // Skip actual sending in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `🎓 DEMO Certificate for ${studentName} (${phone}) at: ${pdfUrl}`
    );
    return { success: "true" };
  }

  const AISENSY_API_URL = process.env.AISENSY_API_URL!;
  const AISENSY_API_KEY = process.env.AISENSY_API_KEY!;
  // IMPORTANT: You need to create a campaign in Aisensy for sending certificates
  // and set the name in the environment variable below.
  const AISENSY_CERTIFICATE_CAMPAIGN =
    process.env.AISENSY_CERTIFICATE_CAMPAIGN || "Certificate Delivery";

  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName: AISENSY_CERTIFICATE_CAMPAIGN,
    destination: phone,
    userName: studentName,
    templateParams: [studentName],
    media: {
      url: pdfUrl,
      filename: `certificate-${studentName
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf`,
    },
  };

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Aisensy API error:", error);
    throw new Error("Failed to send certificate via Aisensy");
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const phoneNumber = formData.get("phoneNumber") as string;
    const studentName = formData.get("studentName") as string;
    const certificateFile = formData.get("certificate") as File;

    if (!phoneNumber || !studentName || !certificateFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Upload the certificate to Vercel Blob
    const { url: certificateUrl } = await put(
      `certificates/${certificateFile.name}`,
      certificateFile,
      {
        access: "public",
        contentType: "application/pdf",
      }
    );

    // 2. Send the certificate via Aisensy
    const aisensyResponse = await sendCertificateViaAisensy(
      phoneNumber,
      studentName,
      certificateUrl
    );

    if (aisensyResponse.success === "true") {
      return NextResponse.json({
        message: "Certificate sent successfully",
        url: certificateUrl,
      });
    } else {
      console.error("Aisensy API error:", aisensyResponse);
      return NextResponse.json(
        { error: "Failed to send WhatsApp message via Aisensy" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      {
        error: "Failed to send WhatsApp message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
