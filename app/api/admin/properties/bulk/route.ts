import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { propertiesCol, writeAudit } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { PropertyStatus, UserRole } from "@/types";

const schema = z.object({
  propertyIds: z.array(z.string().min(1).max(60)).min(1).max(400),
  status: z.nativeEnum(PropertyStatus),
});

export async function PATCH(req: Request) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse("Invalid request", { status: 400 });
    const batch = adminDb.batch();
    parsed.data.propertyIds.forEach((id) =>
      batch.update(propertiesCol().doc(id), { status: parsed.data.status, updatedAt: new Date() })
    );
    await batch.commit();
    await writeAudit(admin.uid, "property.bulkStatus", parsed.data.propertyIds.join(","), { status: parsed.data.status });
    refreshListingCaches();
    return NextResponse.json({ success: true, count: parsed.data.propertyIds.length });
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
