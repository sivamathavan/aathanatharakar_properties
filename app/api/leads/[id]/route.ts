import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { createLeadNote, getLeadById, getLeadNotes, updateLead } from "@/lib/firestore";
import { LeadDoc, LeadStatus, UserRole } from "@/types";

// An ISO date-time, or null to clear it.
const when = z.union([z.string().datetime({ offset: true }), z.null()]).optional();

const schema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  note: z.string().trim().max(2000).optional(),
  nextFollowUpAt: when,
  siteVisitDate: when,
  contacted: z.literal(true).optional(), // tapped Call or WhatsApp
});

async function loadOwnLead(req: Request, id: string) {
  const user = await getRequestUser(req);
  if (!user) return { error: new NextResponse("Please sign in again.", { status: 401 }) };
  const lead = await getLeadById(id);
  // Admins manage enquiries on their own listings; agents' client lists stay private to them.
  if (!lead || lead.ownerId !== user.uid && !(user.role === UserRole.ADMIN && lead.ownerType === "ADMIN")) {
    return { error: new NextResponse("Enquiry not found.", { status: 404 }) };
  }
  return { lead };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const loaded = await loadOwnLead(req, params.id);
  if ("error" in loaded) return loaded.error;
  return NextResponse.json({ ...loaded.lead, notes: await getLeadNotes(params.id) });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const loaded = await loadOwnLead(req, params.id);
    if ("error" in loaded) return loaded.error;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });

    const input = parsed.data;
    const update: Partial<LeadDoc> = {};
    if (input.status) update.status = input.status;
    if (input.nextFollowUpAt !== undefined) update.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
    if (input.siteVisitDate !== undefined) {
      update.siteVisitDate = input.siteVisitDate ? new Date(input.siteVisitDate) : null;
      // Booking a visit moves a fresh enquiry along.
      if (input.siteVisitDate && !input.status && ["NEW", "CONTACTED"].includes(loaded.lead.status)) update.status = LeadStatus.SITE_VISIT;
    }
    if (input.contacted) {
      update.lastContactedAt = new Date();
      if (!input.status && loaded.lead.status === LeadStatus.NEW) update.status = LeadStatus.CONTACTED;
    }
    if (Object.keys(update).length) await updateLead(params.id, update);
    if (input.note) await createLeadNote({ leadId: params.id, note: input.note });

    const lead = await getLeadById(params.id);
    return NextResponse.json({ ...lead, notes: await getLeadNotes(params.id) });
  } catch (error) {
    console.error("[LEAD_PATCH]", error);
    return new NextResponse("Could not update the enquiry.", { status: 500 });
  }
}
