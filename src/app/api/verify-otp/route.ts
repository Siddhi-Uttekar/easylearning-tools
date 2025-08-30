// verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import prisma from "@/lib/prisma"; // Import Prisma client

const rateLimiter = new RateLimiterMemory({
  keyPrefix: "otp_verify",
  points: 5,
  duration: 60 * 15,
});


export async function POST(request: NextRequest) {
  try {
    const ip =
      (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      await rateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
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

    // Find OTP record in database
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone: formattedPhone,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Verify OTP (in production, compare with hashed value)
    if (otpRecord.otpHash !== otp) {
      // Update attempt count
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      if (otpRecord.attempts >= 5) {
        return NextResponse.json(
          { error: "Too many incorrect attempts. Please request a new OTP." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    // Optional: Create or update user record

    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
