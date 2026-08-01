import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { createCommission, getAllCommissions, getPropertyById } from "@/lib/firestore";
import { UserRole, CommissionStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, amount, status, notes, propertyId } = body;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return new NextResponse("Commission amount must be greater than 0", { status: 400 });
    }

    const commission = await createCommission({
      type,
      amount: Math.round(amt),
      status: status || CommissionStatus.EXPECTED,
      notes: notes || null,
      propertyId: propertyId || null,
      createdBy: authUser.uid,
    });

    return NextResponse.json({
      ...commission,
      amount: commission.amount.toString(),
    });
  } catch (error) {
    console.error("[ADMIN_COMMISSION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const commissions = await getAllCommissions();

    // Enrich with property details
    const enriched = await Promise.all(
      commissions.map(async (c) => {
        const property = c.propertyId ? await getPropertyById(c.propertyId) : null;
        return {
          ...c,
          property,
          amount: c.amount.toString(),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[ADMIN_COMMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
