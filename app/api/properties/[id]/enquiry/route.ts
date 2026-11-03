import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead, getAgentById, getPropertyById } from "@/lib/firestore";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { escapeHtml, sendEmailWithin } from "@/lib/mail";
import { isPlanLive } from "@/lib/plans";
import { recordStat } from "@/lib/stats";
import { LeadSource, LeadStatus, PropertyStatus } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v.replace(/[^0-9]/g, "").length >= 10, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.enum(["WEB", "AGENT_PAGE"]).optional().default("WEB"),
  website: z.string().optional(), // honeypot: real people never fill this
});

// A visitor's enquiry goes to whoever owns the listing: the agent for agent
// listings, the site team for the admin's own listings.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const ip = clientIp(req);
    if (await checkRateLimit(`enquiry:${ip}`, 5, 10 * 60 * 1000)) {
      return new NextResponse("Too many enquiries. Please try again in a few minutes.", { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const { name, phone, email, message, source, website } = parsed.data;
    if (website) return NextResponse.json({ ok: true }); // bot: pretend it worked

    const property = await getPropertyById(params.id);
    if (!property || property.status !== PropertyStatus.ACTIVE) {
      return new NextResponse("This listing is no longer available.", { status: 404 });
    }

    const agent = property.ownerType === "AGENT" ? await getAgentById(property.postedById) : null;
    if (property.ownerType === "AGENT" && (!agent || !isPlanLive(agent.plan))) {
      return new NextResponse("This listing is no longer available.", { status: 404 });
    }

    const lead = await createLead({
      propertyId: property.id,
      propertyTitle: property.title,
      ownerId: property.postedById,
      ownerType: property.ownerType || "ADMIN",
      name,
      phone,
      email,
      message,
      status: LeadStatus.NEW,
      source: source === "AGENT_PAGE" ? LeadSource.AGENT_PAGE : LeadSource.WEB,
    });
    if (agent) await recordStat(agent.id, "enquiry", property.id).catch(() => {});

    const to = agent ? agent.email : process.env.ADMIN_EMAIL;
    if (to) {
      await sendEmailWithin({
        to,
        subject: `New enquiry: ${property.title}`,
        html: `
          <h2>New enquiry</h2>
          <p><strong>${escapeHtml(property.title)}</strong> — ${escapeHtml(property.locality)}, ${escapeHtml(property.city)}</p>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(name)}</li>
            <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
            ${email ? `<li><strong>Email:</strong> ${escapeHtml(email)}</li>` : ""}
          </ul>
          ${message ? `<p><em>${escapeHtml(message)}</em></p>` : ""}
          <p>See all enquiries in your dashboard.</p>
        `,
      });
    }

    return NextResponse.json({ id: lead.id });
  } catch (error) {
    console.error("[PROPERTY_ENQUIRY_POST]", error);
    return new NextResponse("Could not send your enquiry. Please try again.", { status: 500 });
  }
}
