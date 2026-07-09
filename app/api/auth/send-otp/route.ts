import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { hashOtp } from "@/lib/auth";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const WINDOW_MS = 60 * 1000;
const IP_LIMIT = 10;
const EMAIL_LIMIT = 3;

const emailSchema = z.object({
  email: z.string().email("A valid email is required").trim().toLowerCase(),
});

// Same generic response regardless of whether an account exists, to prevent
// user enumeration.
const GENERIC_OK = NextResponse.json({
  success: true,
  message: "If an account exists for that email, a login code has been sent.",
});

// Helper to simulate the time delay of sending an email, preventing timing attacks.
const simulateDelay = () => new Promise(res => setTimeout(res, 800 + Math.random() * 400));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = emailSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues?.[0]?.message || "Invalid input";
      return new NextResponse(errorMessage, { status: 400 });
    }

    const normalized = result.data.email;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Distributed Rate Limit
    const isIpLimited = await checkRateLimit(`ip:${ip}`, IP_LIMIT, WINDOW_MS);
    const isEmailLimited = await checkRateLimit(`email:${normalized}`, EMAIL_LIMIT, WINDOW_MS);

    if (isIpLimited || isEmailLimited) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Phase 5: Remove User Enumeration
    if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "REJECTED") {
      // Simulate delay to prevent timing attacks, log internally, but return GENERIC_OK
      await simulateDelay();
      return GENERIC_OK;
    }

    // Phase 2: Fix OTP Randomness (crypto.randomInt instead of Math.random)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate prior tokens to ensure single-use semantics.
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalized },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: normalized,
        token: hashOtp(otp),
        expires,
      },
    });

    // Dev fallback — log when SMTP not configured.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      // Intentionally NOT logging OTP to comply with: "Never log OTP values" (Rule 23).
      console.log(`[DEV_FALLBACK] OTP generated for ${normalized}`);
      return GENERIC_OK;
    }

    try {
      await sendEmail({
        to: normalized,
        subject: `Your Aadana Tharakar Login Code`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #E8E0D0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0D1B2A; padding: 20px; text-align: center;">
              <h1 style="color: #E5C158; margin: 0; font-size: 24px;">Aadana Tharakar</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff; text-align: center;">
              <p style="color: #4B5563; font-size: 16px; margin-bottom: 20px;">Use the code below to log in to your account. This code is valid for 10 minutes.</p>
              <div style="background-color: #FDF6EC; padding: 15px 30px; border-radius: 6px; display: inline-block; border: 2px dashed #E5C158;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0D1B2A;">${otp}</span>
              </div>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });
    } catch (mailErr: any) {
      // Phase 6: Safely log mail failure, do NOT leak error publicly.
      console.error("[SEND_OTP_MAIL_ERROR]", mailErr.message);
    }

    return GENERIC_OK;
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return new NextResponse("Failed to process request", { status: 500 });
  }
}
