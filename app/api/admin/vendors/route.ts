import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await prisma.vendorProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      mobile: true,
      email: true,
      category: true,
      serviceAreas: true,
      yearsInBusiness: true,
      projectsDone: true,
      priceRangeMin: true,
      priceRangeMax: true,
      isVerified: true,
      isFeatured: true,
      rating: true,
      createdAt: true,
    },
  });

  return NextResponse.json(vendors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
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

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const newVendor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: normalizedEmail,
          phone: mobile,
          role: "VENDOR",
          accountStatus: "ACTIVE",
          vendorProfile: {
            create: {
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
            },
          },
        },
        include: {
          vendorProfile: true,
        },
      });
      return user.vendorProfile;
    });

    return NextResponse.json(newVendor);
  } catch (error) {
    console.error("[VENDOR_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
