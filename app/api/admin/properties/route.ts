import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: { postedBy: true },
    });

    const serializedProperties = properties.map(p => ({
      ...p,
      price: p.price.toString(),
    }));

    return NextResponse.json(serializedProperties);
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
