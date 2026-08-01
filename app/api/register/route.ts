import { NextResponse } from "next/server";
import { getUserByEmail, createUser, usersCol, agentProfilesCol, vendorProfilesCol } from "@/lib/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/mail";
import { UserRole, AccountStatus } from "@/types";

const ALLOWED_ROLES: UserRole[] = [
  UserRole.PROPERTY_LISTER,
  UserRole.AGENT,
  UserRole.VENDOR,
];

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s: string) => /^[0-9+\-\s()]{7,20}$/.test(s);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, name, email, phone, role, agentDetails, vendorDetails } = body;

    if (!uid || !name || !email || !phone || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!isValidEmail(email)) {
      return new NextResponse("Invalid email address", { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return new NextResponse("Invalid phone number", { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = String(name).trim().slice(0, 120);
    const trimmedPhone = String(phone).trim().slice(0, 20);

    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.accountStatus === AccountStatus.SUSPENDED) {
        return new NextResponse(
          "This account has been suspended. Please contact support.",
          { status: 403 }
        );
      }
      return new NextResponse("Email already registered", { status: 400 });
    }

    const initialStatus = AccountStatus.ACTIVE;

    // Use a batch to create the User and their Profile in Firestore
    const batch = adminDb.batch();
    const userRef = usersCol().doc(uid);

    const userData = {
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      role,
      accountStatus: initialStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    batch.set(userRef, userData);

    if (role === UserRole.AGENT && agentDetails) {
      const agentRef = agentProfilesCol().doc(uid);
      batch.set(agentRef, {
        userId: uid,
        fullName: trimmedName,
        mobile: trimmedPhone,
        reraNumber: agentDetails.reraNumber || null,
        officeAddress:
          agentDetails.officeAddress ||
          agentDetails.agencyName ||
          "Not Provided",
        operatingCities: Array.isArray(agentDetails.operatingCities)
          ? agentDetails.operatingCities
          : [],
        experience: parseInt(String(agentDetails.experienceYears ?? "0")) || 0,
        bio: agentDetails.bio || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (role === UserRole.VENDOR && vendorDetails) {
      const vendorRef = vendorProfilesCol().doc(uid);
      batch.set(vendorRef, {
        userId: uid,
        businessName: vendorDetails.businessName || trimmedName,
        ownerName: trimmedName,
        mobile: trimmedPhone,
        email: normalizedEmail,
        category: vendorDetails.category || "CIVIL_CONTRACTOR",
        description: vendorDetails.description || "",
        serviceAreas: Array.isArray(vendorDetails.operatingCities)
          ? vendorDetails.operatingCities
          : [],
        yearsInBusiness: parseInt(String(vendorDetails.experienceYears ?? "0")) || 0,
        websiteUrl: vendorDetails.websiteUrl || null,
        isVerified: false,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await batch.commit();

    // Set custom claims (roles) on the Firebase Auth user object
    await adminAuth.setCustomUserClaims(uid, { role });

    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to: process.env.ADMIN_EMAIL as string,
        subject: `New ${role} Registration: ${trimmedName}`,
        html: `
          <h3>New User Registration</h3>
          <p><strong>Name:</strong> ${trimmedName}</p>
          <p><strong>Email:</strong> ${normalizedEmail}</p>
          <p><strong>Phone:</strong> ${trimmedPhone}</p>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Status:</strong> ${initialStatus}</p>
          <p>Please log in to the admin dashboard to review this account.</p>
        `,
      }).catch(console.error);
    }

    return NextResponse.json({
      id: uid,
      email: normalizedEmail,
      role,
      accountStatus: initialStatus,
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
