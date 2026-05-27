import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, amount, status, notes, propertyId } = body;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return new NextResponse("Commission amount must be greater than 0", { status: 400 });
    }

    const commission = await prisma.commission.create({
      data: {
        type,
        amount: BigInt(Math.round(amt)),
        status: status || "EXPECTED",
        notes: notes || null,
        propertyId: propertyId || null,
        createdBy: session.user.id,
      }
    });

    const serialized = {
      ...commission,
      amount: commission.amount.toString()
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[ADMIN_COMMISSION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const commissions = await prisma.commission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        property: true,
      }
    });

    const serializedCommissions = commissions.map(c => ({
      ...c,
      amount: c.amount.toString(),
    }));

    return NextResponse.json(serializedCommissions);
  } catch (error) {
    console.error("[ADMIN_COMMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
