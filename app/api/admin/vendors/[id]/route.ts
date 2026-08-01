import { NextResponse } from "next/server";
import { verifyIdToken as verifyAuth } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { vendorProfilesCol, usersCol } from "@/lib/firestore";
import { UserRole } from "@/types";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      businessName,
      ownerName,
      mobile,
      email,
      category,
      serviceAreas,
      yearsInBusiness,
      priceRangeMin,
      priceRangeMax,
    } = body;

    const vendorRef = vendorProfilesCol().doc(params.id);
    const vendorSnap = await vendorRef.get();

    if (!vendorSnap.exists) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const vendorData = vendorSnap.data()!;
    const userId = vendorData.userId;

    const userRef = usersCol().doc(userId);

    const batch = adminDb.batch();

    // 1. Update User Document
    batch.update(userRef, {
      name: ownerName,
      email: email.toLowerCase().trim(),
      phone: mobile,
      updatedAt: new Date(),
    });

    // 2. Update Vendor Profile Document
    const updatedProfile = {
      businessName,
      ownerName,
      mobile,
      email: email.toLowerCase().trim(),
      category,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      yearsInBusiness: Number(yearsInBusiness) || 0,
      priceRangeMin: priceRangeMin ? Number(priceRangeMin) : null,
      priceRangeMax: priceRangeMax ? Number(priceRangeMax) : null,
      updatedAt: new Date(),
    };

    batch.update(vendorRef, updatedProfile);

    await batch.commit();

    // Update email in Firebase Auth
    await adminAuth.updateUser(userId, {
      email: email.toLowerCase().trim(),
      displayName: ownerName,
      phoneNumber: mobile.startsWith("+") ? mobile : undefined,
    }).catch((err) => console.error("Firebase auth user sync failed: ", err));

    return NextResponse.json({ id: params.id, ...vendorData, ...updatedProfile });
  } catch (error) {
    console.error("[VENDOR_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendorRef = vendorProfilesCol().doc(params.id);
    const vendorSnap = await vendorRef.get();

    if (!vendorSnap.exists) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const { userId } = vendorSnap.data()!;

    const batch = adminDb.batch();
    batch.delete(usersCol().doc(userId));
    batch.delete(vendorRef);

    await batch.commit();

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(userId).catch((err) => console.error("Firebase auth deletion failed: ", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VENDOR_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
