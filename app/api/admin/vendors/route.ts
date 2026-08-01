import { NextResponse } from "next/server";
import { verifyIdToken as verifyAuth } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getAllVendorProfiles, getUserByEmail, usersCol, vendorProfilesCol } from "@/lib/firestore";
import { UserRole, AccountStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await getAllVendorProfiles();
  return NextResponse.json(vendors);
}

export async function POST(req: Request) {
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

    if (!businessName || !ownerName || !mobile || !email || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Standardize phone format for Firebase E.164 validation
    const digitsOnly = mobile.replace(/\D/g, "");
    const formattedPhone = mobile.startsWith("+") ? mobile : `+91${digitsOnly}`;

    // Create Firebase Auth user
    const firebaseUser = await adminAuth.createUser({
      email: normalizedEmail,
      displayName: ownerName,
      phoneNumber: formattedPhone.length >= 10 ? formattedPhone : undefined,
      password: "TempPassword123!", // standard default, can reset later
    });

    const uid = firebaseUser.uid;

    // Use Firestore Batch to insert user & vendor profile documents
    const batch = adminDb.batch();
    const userRef = usersCol().doc(uid);
    const vendorRef = vendorProfilesCol().doc(uid);

    batch.set(userRef, {
      name: ownerName,
      email: normalizedEmail,
      phone: mobile,
      role: UserRole.VENDOR,
      accountStatus: AccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const vendorProfile = {
      id: uid,
      userId: uid,
      businessName,
      ownerName,
      mobile,
      email: normalizedEmail,
      category,
      description: `Allied service provider - ${businessName}`,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      yearsInBusiness: Number(yearsInBusiness) || 0,
      priceRangeMin: priceRangeMin ? Number(priceRangeMin) : null,
      priceRangeMax: priceRangeMax ? Number(priceRangeMax) : null,
      isVerified: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    batch.set(vendorRef, vendorProfile);

    await batch.commit();

    // Set custom user claims for Firestore security rules
    await adminAuth.setCustomUserClaims(uid, { role: UserRole.VENDOR });

    return NextResponse.json(vendorProfile);
  } catch (error: any) {
    console.error("[VENDOR_CREATE_ERROR]", error);
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "A user with this email already exists in auth system" }, { status: 400 });
    }
    if (error.code === "auth/phone-number-already-exists") {
      return NextResponse.json({ error: "A user with this mobile number already exists in auth system" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
