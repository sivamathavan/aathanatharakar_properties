import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        property: true,
        assignedTo: true,
        notes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[ADMIN_LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
