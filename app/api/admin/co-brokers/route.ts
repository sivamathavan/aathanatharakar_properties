import { NextResponse } from "next/server";
import { verifyIdToken as verifyAuth } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { agentProfilesCol, getUserByEmail, usersCol } from "@/lib/firestore";
import { UserRole, AccountStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profilesSnap = await agentProfilesCol().orderBy("createdAt", "desc").get();
  const profiles = profilesSnap.docs.map((doc) => {
    const data = doc.data()!;
    const converted: any = { id: doc.id };
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof (value as any).toDate === "function") {
        converted[key] = (value as any).toDate();
      } else {
        converted[key] = value;
      }
    }
    return converted;
  });

  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
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

    if (!fullName || !mobile || !email || !officeAddress) {
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
      displayName: fullName,
      phoneNumber: formattedPhone.length >= 10 ? formattedPhone : undefined,
      password: "TempPassword123!", // standard default
    });

    const uid = firebaseUser.uid;

    const batch = adminDb.batch();
    const userRef = usersCol().doc(uid);
    const agentRef = agentProfilesCol().doc(uid);

    batch.set(userRef, {
      name: fullName,
      email: normalizedEmail,
      phone: mobile,
      role: UserRole.AGENT,
      accountStatus: AccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agentProfile = {
      id: uid,
      userId: uid,
      fullName,
      mobile,
      reraNumber: reraNumber || null,
      officeAddress,
      operatingCities: Array.isArray(operatingCities) ? operatingCities : [],
      experience: Number(experience) || 0,
      bio: bio || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    batch.set(agentRef, agentProfile);

    await batch.commit();

    // Set custom role claims
    await adminAuth.setCustomUserClaims(uid, { role: UserRole.AGENT });

    return NextResponse.json(agentProfile);
  } catch (error: any) {
    console.error("[CO_BROKER_CREATE_ERROR]", error);
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "A user with this email already exists in auth system" }, { status: 400 });
    }
    if (error.code === "auth/phone-number-already-exists") {
      return NextResponse.json({ error: "A user with this mobile number already exists in auth system" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
