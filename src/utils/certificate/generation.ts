// src/utils/certificate/generation.ts
import puppeteer from "puppeteer";
import { CertificateData } from "@/types/certificates";

export function generateCertificateHTML(data: CertificateData): string {
  const { student, event, certificateType } = data;
  const getMedalEmoji = () => {
    if (student.medalType === "gold") return "&#x1F947;";
    if (student.medalType === "silver") return "&#x1F948;";
    if (student.medalType === "bronze") return "&#x1F949;";
    return "&#x2B50;";
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
          z-index: 10; /* Ensure border is on top */
        }
        
        .ribbon {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, rgba(14,165,233,0.18), rgba(255,255,255,0));
          border-bottom: 1px solid #dfeefe;
          z-index: 5;
        }
        
        .logo-container {
          position: absolute;
          top: 48px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 6;
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
          gap: 40px;
          z-index: 6;
        }
        
        .title {
          text-align: center;
        }
        
        .certificate-title {
          font-size: 67px;
          font-family: Georgia, serif;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 16px;
          line-height: 1;
        }
        
        .event-name {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #0c4a6e;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.1);
          padding: 8px 16px;
          border-radius: 8px;
          background-color: rgba(14, 165, 233, 0.1);
          display: inline-block;
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
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #fff, #f3e9d0 40%, #dfc074 60%, #b78b2c 100%);
          border: 6px solid #f5e6bd;
          text-align: center;
        }
        
        .medal-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .medal-emoji {
          font-size: 60px;
          line-height: 1;
        }
        
        .medal-rank {
          font-size: 18px;
          font-weight: bold;
          color: #4e3a0a;
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
          bottom: 32px; /* Changed from 40px to touch the inner border */
          left: 50%;
          transform: translateX(-50%);
          width: 85%; /* Increased width */
          max-height: 280px; /* Increased height */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4; /* Below the inner border */
        }
        
        .footer-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
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
            <h1 class="certificate-title">${certificateType}</h1>
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
            ${
              student.testsAttempted
                ? `<div class="metadata-item">
              <span>&#x1F4DD;</span>
              <span>${student.testsAttempted} Tests Attempted</span>
            </div>`
                : ""
            }
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

export async function generatePDF(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/snap/bin/chromium",
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

export async function generatePNG(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/snap/bin/chromium",
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
