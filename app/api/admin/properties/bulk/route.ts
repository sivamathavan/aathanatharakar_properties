import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PropertyStatus, UserRole } from "@prisma/client";

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
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
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

    const result = await prisma.property.updateMany({
      where: { id: { in: safeIds } },
      data: { status },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
