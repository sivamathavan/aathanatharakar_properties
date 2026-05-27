import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return new NextResponse("No account found with this email", { status: 404 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert the verification token (replace if exists for this email)
    // Prisma requires a unique identifier, and we need to delete old ones first.
    // Actually, VerificationToken uses `identifier` which is not unique on its own.
    // Let's delete any existing tokens for this email to prevent spam.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // Send email via Nodemailer
    if (process.env.NODE_ENV !== 'production' || process.env.SMTP_USER === 'yourgmail@gmail.com') {
      console.log(`\n======================================================`);
      console.log(`OTP Code for ${email}: ${otp}`);
      console.log(`======================================================\n`);
    } else {
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
        to: email,
        subject: `Your Login Code: ${otp}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #E8E0D0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #132360; padding: 20px; text-align: center;">
              <h1 style="color: #FACC15; margin: 0; font-size: 24px;">Aadana Tharakar</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff; text-align: center;">
              <p style="color: #4B5563; font-size: 16px; margin-bottom: 20px;">Use the code below to log in to your account. This code is valid for 10 minutes.</p>
              <div style="background-color: #FDF6EC; padding: 15px 30px; border-radius: 6px; display: inline-block; border: 2px dashed #E85D24;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #132360;">${otp}</span>
              </div>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return new NextResponse("Failed to send OTP", { status: 500 });
  }
}
