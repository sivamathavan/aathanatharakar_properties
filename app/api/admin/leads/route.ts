import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { getAllLeads, getPropertyById, getUserById, getLeadNotes } from "@/lib/firestore";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const leads = await getAllLeads();

    // Enrich leads with related properties, users and notes in parallel
    const enriched = await Promise.all(
      leads.map(async (l) => {
        const [property, assignedTo, notes] = await Promise.all([
          l.propertyId ? getPropertyById(l.propertyId) : null,
          l.assignedToId ? getUserById(l.assignedToId) : null,
          getLeadNotes(l.id),
        ]);
        return {
          ...l,
          property,
          assignedTo,
          notes,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[ADMIN_LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
