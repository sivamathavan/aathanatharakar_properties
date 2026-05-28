import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { hashOtp } from "@/lib/auth";

// Per-IP / per-email in-memory rate limit. Serverless-instance-scoped only
// (best effort) — pair with Vercel firewall / Upstash in production.
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const emailBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const IP_LIMIT = 10;
const EMAIL_LIMIT = 3;

function limited(map: Map<string, { count: number; resetAt: number }>, key: string, limit: number) {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || bucket.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Same generic response regardless of whether an account exists, to prevent
// user enumeration. (Bot abuse is bounded by the rate-limit above.)
const GENERIC_OK = NextResponse.json({
  success: true,
  message: "If an account exists for that email, a login code has been sent.",
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return new NextResponse("A valid email is required", { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (limited(ipBuckets, ip, IP_LIMIT) || limited(emailBuckets, normalized, EMAIL_LIMIT)) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Silently bail (no enumeration) if user missing or suspended/rejected.
    if (!user) return GENERIC_OK;
    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "REJECTED") {
      return GENERIC_OK;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
      console.log(`\n======================================================`);
      console.log(`OTP Code for ${normalized}: ${otp}`);
      console.log(`======================================================\n`);
      return GENERIC_OK;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Aadana Tharakar" <${process.env.SMTP_USER}>`,
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
    } catch (mailErr) {
      console.error("[SEND_OTP_MAIL_ERROR]", mailErr);
      // Still return generic OK so we don't leak email validity by error message.
    }

    return GENERIC_OK;
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return new NextResponse("Failed to send code", { status: 500 });
  }
}
