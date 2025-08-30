import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { Redis } from "@upstash/redis";
import prisma from "@/lib/prisma";

const rateLimiter = new RateLimiterMemory({
  keyPrefix: "otp_send",
  points: 3,
  duration: 60 * 15,
});

// Only initialize Redis in production
const redis =
  process.env.NODE_ENV === "production"
    ? new Redis({
        url: process.env.UPSTASH_REDIS_URL!,
        token: process.env.UPSTASH_REDIS_TOKEN!,
      })
    : null;

const sendOTPViaAisensy = async (phone: string, otp: string) => {
  // Skip actual SMS sending in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log(`🔑 DEMO OTP for ${phone}: ${otp}`);
    return { success: "true" };
  }

  const AISENSY_API_URL = process.env.AISENSY_API_URL!;
  const AISENSY_API_KEY = process.env.AISENSY_API_KEY!;
  
  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName: "Verify OTP",
    destination: phone,
    userName: "EasyLearning",
    templateParams: [otp],
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: otp,
          },
        ],
      },
    ],
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
    throw new Error("Failed to send OTP via Aisensy");
  }
};

export async function POST(request: NextRequest) {
  try {
    const ip =
      (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await rateLimiter.consume(ip);
    } catch {
      // Only use Redis in production
      if (process.env.NODE_ENV === "production" && redis) {
        const redisKey = `otp_send:${ip}`;
        const points = (await redis.get(redisKey)) as string | null;
        if (points && parseInt(points, 10) >= 3) {
          return NextResponse.json(
            { error: "Too many OTP requests. Please try again later." },
            { status: 429 }
          );
        }
        await redis.incr(redisKey);
        await redis.expire(redisKey, 900);
      } else {
        return NextResponse.json(
          { error: "Too many OTP requests. Please try again later." },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const phone = body.phone;
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const cleanedPhone = phone.replace(/\D/g, "");
    let formattedPhone = cleanedPhone;
    if (cleanedPhone.length === 10) {
      formattedPhone = `+91${cleanedPhone}`;
    } else if (cleanedPhone.length > 10 && !cleanedPhone.startsWith("+")) {
      formattedPhone = `+${cleanedPhone}`;
    }

    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Only use Redis in production
    if (process.env.NODE_ENV === "production" && redis) {
      const recentOTPKey = `recent_otp:${formattedPhone}`;
      const recentOTP = await redis.get(recentOTPKey);
      if (recentOTP) {
        return NextResponse.json(
          {
            error:
              "OTP already sent recently. Please wait before requesting another.",
          },
          { status: 429 }
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000);

    // Save OTP to database using Prisma
    await prisma.otp.create({
      data: {
        phone: formattedPhone,
        otpHash: otp, // In production, hash this value before storing
        expiresAt,
      },
    });

    // Only use Redis in production
    if (process.env.NODE_ENV === "production" && redis) {
      await redis.set(`recent_otp:${formattedPhone}`, "1", { ex: 120 });
    }

    // In development, show the OTP in the response
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        success: true,
        message: "OTP created for demo (not sent via SMS)",
        phone: formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"),
        demoOTP: otp, // Only include in non-production
      });
    }

    const aisensyResponse = await sendOTPViaAisensy(formattedPhone, otp);

    if (aisensyResponse.success === "true") {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        phone: formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"),
      });
    } else {
      console.error("Aisensy API error:", aisensyResponse);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
