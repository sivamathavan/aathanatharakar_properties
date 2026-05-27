import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsString = searchParams.get("ids");
    
    if (!idsString) {
      return NextResponse.json({ properties: [] });
    }

    const ids = idsString.split(",").filter(Boolean);
    
    if (ids.length === 0) {
      return NextResponse.json({ properties: [] });
    }

    const properties = await prisma.property.findMany({
      where: {
        id: { in: ids },
        status: "ACTIVE"
      },
      include: { media: true },
    });

    // Need to serialize BigInts
    const serializedProperties = properties.map(p => ({
      ...p,
      price: Number(p.price)
    }));

    return NextResponse.json({ properties: serializedProperties });
  } catch (error) {
    console.error("Batch properties fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
