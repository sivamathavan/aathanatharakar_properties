import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus, UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/mail";

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
    const { name, email, phone, role, agentDetails, vendorDetails } = body;

    if (!name || !email || !phone || !role) {
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

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.accountStatus === AccountStatus.SUSPENDED) {
        return new NextResponse(
          "This account has been suspended. Please contact support.",
          { status: 403 }
        );
      }
      return new NextResponse("Email already registered", { status: 400 });
    }

    // New accounts are active immediately to allow registration and OTP verification
    const initialStatus = AccountStatus.ACTIVE;

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          phone: trimmedPhone,
          role,
          accountStatus: initialStatus,
          agentProfile:
            role === UserRole.AGENT && agentDetails
              ? {
                  create: {
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
                    experience:
                      parseInt(String(agentDetails.experienceYears ?? "0")) ||
                      0,
                    bio: agentDetails.bio || null,
                  },
                }
              : undefined,
          vendorProfile:
            role === UserRole.VENDOR && vendorDetails
              ? {
                  create: {
                    businessName: vendorDetails.businessName || trimmedName,
                    ownerName: trimmedName,
                    mobile: trimmedPhone,
                    email: normalizedEmail,
                    category: vendorDetails.category || "CIVIL_CONTRACTOR",
                    description: vendorDetails.description || "",
                    serviceAreas: Array.isArray(vendorDetails.operatingCities)
                      ? vendorDetails.operatingCities
                      : [],
                    yearsInBusiness:
                      parseInt(String(vendorDetails.experienceYears ?? "0")) ||
                      0,
                    websiteUrl: vendorDetails.websiteUrl || null,
                  },
                }
              : undefined,
        },
      });
    });

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

    // Only return non-sensitive fields
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
