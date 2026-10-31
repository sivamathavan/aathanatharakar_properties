import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { listTrackerProperties } from "@/lib/crm/properties";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({ data: await listTrackerProperties([admin.uid]) });
}
