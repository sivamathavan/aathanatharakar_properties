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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status, isFeatured } = body;

    const data: any = {};
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return new NextResponse("Invalid status", { status: 400 });
      }
      data.status = status;
    }
    if (typeof isFeatured === "boolean") {
      data.isFeatured = isFeatured;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("No changes provided", { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        status: true,
        isFeatured: true,
        title: true,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error("[ADMIN_PROPERTY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
