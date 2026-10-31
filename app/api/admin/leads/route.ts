import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAdminLeads } from "@/lib/firestore";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

// Enquiries on the admin's own listings (the main site).
export async function GET(req: Request) {
  if (!(await requireRole(req, UserRole.ADMIN))) return new NextResponse("Unauthorized", { status: 401 });
  try {
    return NextResponse.json(await getAdminLeads());
  } catch (error) {
    console.error("[ADMIN_LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
