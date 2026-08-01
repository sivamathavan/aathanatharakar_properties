import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { getLeadById, updateLead, createLeadNote, getLeadNotes, getUserById, getPropertyById } from "@/lib/firestore";
import { UserRole } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status, assignedToId, note } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    if (Object.keys(updateData).length > 0) {
      await updateLead(params.id, updateData);
    }

    if (note && note.trim() !== "") {
      await createLeadNote({
        leadId: params.id,
        note: note.trim(),
      });
    }

    const lead = await getLeadById(params.id);
    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    const [property, assignedTo, notes] = await Promise.all([
      lead.propertyId ? getPropertyById(lead.propertyId) : null,
      lead.assignedToId ? getUserById(lead.assignedToId) : null,
      getLeadNotes(params.id),
    ]);

    return NextResponse.json({
      ...lead,
      property,
      assignedTo,
      notes,
    });
  } catch (error) {
    console.error("[ADMIN_LEAD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
