import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { propertiesCol } from "@/lib/firestore";
import { UserRole, PropertyStatus } from "@/types";
import { adminDb } from "@/lib/firebase-admin";

const ALLOWED_STATUSES: PropertyStatus[] = [
  PropertyStatus.PENDING,
  PropertyStatus.ACTIVE,
  PropertyStatus.SOLD,
  PropertyStatus.RENTED,
  PropertyStatus.REJECTED,
  PropertyStatus.INACTIVE,
];

export async function PATCH(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { propertyIds, status } = body;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return new NextResponse("Invalid property list", { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const safeIds = propertyIds.filter(
      (id) => typeof id === "string" && id.length < 60
    );

    const batch = adminDb.batch();
    safeIds.forEach((id) => {
      const docRef = propertiesCol().doc(id);
      batch.update(docRef, { status, updatedAt: new Date() });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: safeIds.length });
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
