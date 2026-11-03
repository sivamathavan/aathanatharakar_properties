import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { createLead, findLeadByPhone, getPropertyById } from "@/lib/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import { LeadSource, LeadStatus, UserRole } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the client's name").max(120),
  phone: z.string().trim().max(20).refine((v) => v.replace(/[^0-9]/g, "").length >= 10, "Enter a valid phone number"),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.enum([LeadSource.DIRECT, LeadSource.WHATSAPP, LeadSource.REFERRAL]),
  propertyId: z.string().max(128).optional().nullable(),
  nextFollowUpAt: z.union([z.string().datetime({ offset: true }), z.null()]).optional(),
  // Set after the agent saw "already in your enquiries" and chose to add anyway.
  allowDuplicate: z.boolean().optional(),
});

// A client the agent met by phone, WhatsApp, walk-in or referral, added by hand.
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    if (await checkRateLimit(`lead-add:${user.uid}`, 200, 24 * 60 * 60 * 1000)) {
      return new NextResponse("Too many clients added today. Try again tomorrow.", { status: 429 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;

    if (!input.allowDuplicate) {
      const existing = await findLeadByPhone(user.uid, input.phone);
      if (existing) return NextResponse.json({ duplicate: { id: existing.id, name: existing.name } }, { status: 409 });
    }

    let property = null;
    if (input.propertyId) {
      property = await getPropertyById(input.propertyId);
      if (!property || property.postedById !== user.uid) return new NextResponse("Listing not found.", { status: 404 });
    }
    const lead = await createLead({
      propertyId: property?.id || null,
      propertyTitle: property?.title || null,
      ownerId: user.uid,
      ownerType: user.role === UserRole.ADMIN ? "ADMIN" : "AGENT",
      name: input.name,
      phone: input.phone,
      email: null,
      message: input.message,
      status: LeadStatus.NEW,
      source: input.source,
      nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null,
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("[LEAD_POST]", error);
    return new NextResponse("Could not add the client.", { status: 500 });
  }
}
