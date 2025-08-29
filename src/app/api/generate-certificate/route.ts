// app/api/generate-certificate/route.ts
import puppeteer from "puppeteer";
import { CertificateData } from "@/types/certificates";
import { formatDate } from "@/utils/certificateUtils";
import { NextRequest, NextResponse } from "next/server";
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
function generateCertificateHTML(data: CertificateData): string {
  const { student, event } = data;
  const getMedalEmoji = () => {
    if (student.medalType === "gold") return "🥇";
    if (student.medalType === "silver") return "🥈";
    if (student.medalType === "bronze") return "🥉";
    return "⭐";
  };
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Certificate</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body, html {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: white;
        }
        
        .certificate {
          position: relative;
          width: 1600px;
          height: 1131px;
          background-color: #ffffff;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        
        .certificate-border {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          bottom: 14px;
          border-radius: 22px;
          background: #f8fbff;
        }
        
        .certificate-inner-border {
          position: absolute;
          top: 32px;
          left: 32px;
          right: 32px;
          bottom: 32px;
          border-radius: 16px;
          border: 3px solid rgba(11,130,182,0.12);
        }
        
        .ribbon {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, rgba(14,165,233,0.18), rgba(255,255,255,0));
          border-bottom: 1px solid #dfeefe;
        }
        
        .logo-container {
          position: absolute;
          top: 48px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .logo {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .brand-info {
          display: flex;
          flex-direction: column;
        }
        
        .brand-name {
          font-size: 31px;
          font-weight: bold;
          color: #1e40af;
          letter-spacing: -0.025em;
          line-height: 1;
        }
        
        .brand-tagline {
          font-size: 15px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .content {
          position: absolute;
          left: 80px;
          right: 80px;
          top: 180px;
          bottom: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }
        
        .title {
          text-align: center;
        }
        
        .certificate-title {
          font-size: 67px;
          font-family: Georgia, serif;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
          line-height: 1;
        }
        
        .event-name {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: #1d4ed8;
        }
        
        .awarded-to {
          text-align: center;
        }
        
        .awarded-label {
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .student-name {
          font-size: 63px;
          font-weight: bold;
          color: #1f2937;
          line-height: 1;
        }
        
        .medal-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fef3c7, #f59e0b);
          border: 4px solid #d97706;
          text-align: center;
        }
        
        .medal-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .medal-emoji {
          font-size: 48px;
          line-height: 1;
        }
        
        .medal-rank {
          font-size: 16px;
          font-weight: bold;
          color: #92400e;
          letter-spacing: 1px;
        }
        
        .metadata {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .metadata-item {
          padding: 12px 20px;
          border-radius: 24px;
          border: 1px solid #e2ecf7;
          background-color: #f7fbff;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }
        
        .footer-image {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          max-height: 200px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-border"></div>
        <div class="certificate-inner-border"></div>
        <div class="ribbon"></div>
        
        <div class="logo-container">
          <div class="logo">
            <img src="https://easylearning.live/wp-content/uploads/2024/07/cropped-icon-2.png" alt="EasyLearning Logo" />
          </div>
          <div class="brand-info">
            <div class="brand-name">EasyLearning</div>
            <div class="brand-tagline">Making Learning Easy</div>
          </div>
        </div>
        
        <div class="content">
          <div class="title">
            <h1 class="certificate-title">Certificate of Achievement</h1>
            <div class="event-name">${event.name.toUpperCase()}</div>
          </div>
          
          <div class="awarded-to">
            <div class="awarded-label">THIS IS PROUDLY AWARDED TO</div>
            <div class="student-name">${student.name}</div>
          </div>
          
          <div class="medal-badge">
            <div class="medal-content">
              <div class="medal-emoji">${getMedalEmoji()}</div>
              <div class="medal-rank">RANK ${student.rank}</div>
            </div>
          </div>
          
          <div class="metadata">
            <div class="metadata-item">
              <span>🏆</span>
              <span>Rank ${student.rank}</span>
            </div>
            <div class="metadata-item">
              <span>📝</span>
              <span>${student.testsAttempted} Tests Attempted</span>
            </div>
            <div class="metadata-item">
              <span>📅</span>
              <span>${formatDate(event.date)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer-image">
         <img src="https://easylearning.live/wp-content/uploads/2024/01/EasyLearning-Teachers.png" alt="EasyLearning Teachers"/>
        </div>
      </div>
    </body>
    </html>
  `;
}
async function generatePDF(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 1600, height: 1131 });
    const pdfBuffer = await page.pdf({
      width: "1600px",
      height: "1131px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}
async function generatePNG(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 1600, height: 1131 });
    const screenshot = await page.screenshot({
      type: "png",
      omitBackground: false,
    });
    return Buffer.from(screenshot);
  } finally {
    if (browser) await browser.close();
  }
}
