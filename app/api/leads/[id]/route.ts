import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { createLeadNote, getLeadById, getLeadNotes, updateLead } from "@/lib/firestore";
import { LeadStatus, UserRole } from "@/types";

const schema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  note: z.string().trim().max(2000).optional(),
});

async function loadOwnLead(req: Request, id: string) {
  const user = await getRequestUser(req);
  if (!user) return { error: new NextResponse("Please sign in again.", { status: 401 }) };
  const lead = await getLeadById(id);
  // Admins manage their own (DK) enquiries; agents' client lists stay private to them.
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

    if (parsed.data.status) await updateLead(params.id, { status: parsed.data.status });
    if (parsed.data.note) await createLeadNote({ leadId: params.id, note: parsed.data.note });

    const lead = await getLeadById(params.id);
    return NextResponse.json({ ...lead, notes: await getLeadNotes(params.id) });
  } catch (error) {
    console.error("[LEAD_PATCH]", error);
    return new NextResponse("Could not update the enquiry.", { status: 500 });
  }
}
