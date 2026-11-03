import { BRAND } from "@/lib/brand";
import nodemailer from 'nodemailer';

// Any transactional email service with SMTP (ZeptoMail, Amazon SES, ...).
// SMTP_HOST/PORT/USER/PASSWORD come from the service's SMTP page; MAIL_FROM is
// the sender on your own domain, e.g. "PropPage <hello@your-domain>".
const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465, // 465 is TLS from the start; 587 upgrades with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/** Escape text typed by visitors before putting it in an email body. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Email = { to: string; subject: string; html: string };

/** Sends one email. Never throws; returns whether the mail server accepted it. */
export const sendEmail = async ({ to, subject, html }: Email): Promise<boolean> => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP is not configured. Skipping email send.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"${BRAND.name}" <${process.env.SMTP_USER}>`,
      replyTo: BRAND.supportEmail || undefined,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

/**
 * For API routes: waits for the email so it is sent before the response goes
 * out (the server may pause work left running after it), but never longer than
 * `ms`, so a slow mail server can't hold up the person who clicked.
 */
export function sendEmailWithin(email: Email, ms = 4000): Promise<boolean> {
  return Promise.race([sendEmail(email), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms))]);
}
