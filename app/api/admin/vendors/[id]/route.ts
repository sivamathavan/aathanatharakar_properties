import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: vendor.userId },
        data: {
          name: ownerName,
          email: email.toLowerCase().trim(),
          phone: mobile,
        },
      });

      return tx.vendorProfile.update({
        where: { id: params.id },
        data: {
          businessName,
          ownerName,
          mobile,
          email: email.toLowerCase().trim(),
          category,
          serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
          yearsInBusiness: Number(yearsInBusiness) || 0,
          priceRangeMin: priceRangeMin ? Number(priceRangeMin) : null,
          priceRangeMax: priceRangeMax ? Number(priceRangeMax) : null,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[VENDOR_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: vendor.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VENDOR_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
