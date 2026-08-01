import { NextResponse } from "next/server";
import { verifyIdToken as verifyAuth } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { usersCol, agentProfilesCol } from "@/lib/firestore";
import { UserRole } from "@/types";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fullName,
      mobile,
      email,
      reraNumber,
      officeAddress,
      operatingCities,
      experience,
      bio,
    } = body;

    // In our Firestore schema, agentProfile document ID is same as userId
    const agentRef = agentProfilesCol().doc(params.id);
    const agentSnap = await agentRef.get();

    if (!agentSnap.exists) {
      return NextResponse.json({ error: "Co-Broker not found" }, { status: 404 });
    }

    const agentData = agentSnap.data()!;
    const userId = agentData.userId;

    const userRef = usersCol().doc(userId);

    const batch = adminDb.batch();

    // 1. Update User Document
    batch.update(userRef, {
      name: fullName,
      email: email.toLowerCase().trim(),
      phone: mobile,
      updatedAt: new Date(),
    });

    // 2. Update Agent Profile Document
    const updatedProfile = {
      fullName,
      mobile,
      reraNumber: reraNumber || null,
      officeAddress,
      operatingCities: Array.isArray(operatingCities) ? operatingCities : [],
      experience: Number(experience) || 0,
      bio: bio || null,
      updatedAt: new Date(),
    };

    batch.update(agentRef, updatedProfile);

    await batch.commit();

    // Also update email in Firebase Auth to keep synced
    await adminAuth.updateUser(userId, {
      email: email.toLowerCase().trim(),
      displayName: fullName,
      phoneNumber: mobile.startsWith("+") ? mobile : undefined, // skip if not matching E.164
    }).catch((err) => console.error("Firebase auth user sync failed: ", err));

    return NextResponse.json({ id: params.id, ...agentData, ...updatedProfile });
  } catch (error) {
    console.error("[CO_BROKER_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agentRef = agentProfilesCol().doc(params.id);
    const agentSnap = await agentRef.get();

    if (!agentSnap.exists) {
      return NextResponse.json({ error: "Co-Broker not found" }, { status: 404 });
    }

    const { userId } = agentSnap.data()!;

    const batch = adminDb.batch();
    batch.delete(usersCol().doc(userId));
    batch.delete(agentRef);

    await batch.commit();

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(userId).catch((err) => console.error("Firebase auth deletion failed: ", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CO_BROKER_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
