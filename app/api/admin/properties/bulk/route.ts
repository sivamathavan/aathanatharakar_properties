import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { propertyIds, status } = body;

    if (!Array.isArray(propertyIds) || propertyIds.length === 0 || !status) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    await prisma.property.updateMany({
      where: {
        id: { in: propertyIds }
      },
      data: { status }
    });

    return NextResponse.json({ success: true, count: propertyIds.length });
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
