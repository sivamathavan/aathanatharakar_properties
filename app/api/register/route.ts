import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountStatus, UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, role, agentDetails, vendorDetails } = body;

    if (!name || !email || !phone || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Email already registered", { status: 400 });
    }

    // Create user. For PROPERTY_LISTER, status is ACTIVE. For others, PENDING.
    const initialStatus = role === UserRole.PROPERTY_LISTER 
      ? AccountStatus.ACTIVE 
      : AccountStatus.PENDING;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        accountStatus: initialStatus,
        agentProfile: role === UserRole.AGENT && agentDetails ? {
          create: {
            fullName: name,
            mobile: phone,
            reraNumber: agentDetails.reraNumber || null,
            officeAddress: agentDetails.officeAddress || "Not Provided",
            operatingCities: agentDetails.operatingCities || [],
            experience: parseInt(agentDetails.experienceYears) || 0,
            bio: agentDetails.bio || null,
          }
        } : undefined,
        vendorProfile: role === UserRole.VENDOR && vendorDetails ? {
          create: {
            businessName: vendorDetails.businessName,
            ownerName: name,
            mobile: phone,
            email: email,
            category: vendorDetails.category,
            description: vendorDetails.description || "",
            serviceAreas: vendorDetails.operatingCities || [],
            yearsInBusiness: parseInt(vendorDetails.experienceYears) || 0,
            websiteUrl: vendorDetails.websiteUrl || null,
          }
        } : undefined,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
