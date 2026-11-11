import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { getAgentById } from "@/lib/firestore";
import { clientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { escapeHtml, sendEmailWithin } from "@/lib/mail";
import { effectiveStatus } from "@/lib/plans";
import { BRAND } from "@/lib/brand";
import { cleanPage, createSupportMessage } from "@/lib/support";
import { UserRole } from "@/types";

const HOUR = 60 * 60 * 1000;

const schema = z.object({
  message: z.string().trim().min(10, "Write a little more so we can help (at least 10 letters).").max(1500, "Keep your message under 1500 letters."),
  name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email, or leave it empty."),
  page: z.string().max(300).optional().nullable(),
  topic: z.string().max(40).regex(/^[a-z-]*$/).optional().nullable(),
  website: z.string().optional(), // honeypot: real people never fill this
});

/**
 * "Send us a message" from the help panel. Works before the owner sets a support
 * WhatsApp or email, for signed-in agents (their account details are attached by
 * the server) and for visitors (name and phone needed for a reply). Lands in
 * Admin → Support. Never attaches listings or owner details.
 */
export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    const agent = user?.role === UserRole.AGENT ? await getAgentById(user.uid) : null;

    const limited = agent
      ? await checkRateLimit(`support:uid:${user!.uid}`, 10, 24 * HOUR)
      : await checkRateLimit(`support:ip:${clientIp(req)}`, 5, HOUR);
    if (limited) return new NextResponse("Too many messages. Please try again later.", { status: 429 });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;
    if (input.website) return NextResponse.json({ ok: true }, { status: 201 }); // bot: pretend it worked

    let name = input.name;
    let phone = input.phone;
    let email = input.email;
    if (agent) {
      name = agent.displayName;
      phone = agent.phone;
      email = user!.email || agent.email || email;
    } else if (user) {
      // The admin trying the form: their own account, no phone needed.
      name = name || "Admin";
      email = user.email || email;
    } else {
      if (name.length < 2) return new NextResponse("Enter your name.", { status: 400 });
      if (phone.replace(/[^0-9]/g, "").length < 10) return new NextResponse("Enter a valid 10-digit phone number so we can reply.", { status: 400 });
    }

    const id = await createSupportMessage({
      message: input.message,
      name,
      phone,
      email: email || null,
      agentId: agent?.id || null,
      agentSlug: agent?.slug || null,
      planStatus: agent ? effectiveStatus(agent.plan) : null,
      page: cleanPage(input.page),
      topic: input.topic || null,
    });

    if (process.env.ADMIN_EMAIL) {
      await sendEmailWithin({
        to: process.env.ADMIN_EMAIL,
        subject: `Support message from ${name}${agent ? "" : " (visitor)"}`,
        html: `
          <p><strong>${escapeHtml(name)}</strong>${agent ? ` · ${escapeHtml(agent.slug)} · ${escapeHtml(effectiveStatus(agent.plan))}` : " · not signed in"}</p>
          <p>Phone: ${escapeHtml(phone) || "—"}${email ? ` · Email: ${escapeHtml(email)}` : ""}</p>
          <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
          <p>Reply from Admin → Support in ${escapeHtml(BRAND.name)}.</p>
        `,
      });
    }
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[SUPPORT_POST]", error);
    return new NextResponse("Could not send your message. Please try again.", { status: 500 });
  }
}
