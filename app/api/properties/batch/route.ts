import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { docToTyped, propertiesCol } from "@/lib/firestore";
import { PropertyDoc, PropertyStatus } from "@/types";

export const dynamic = "force-dynamic";

// Saved listings (ids kept in the visitor's browser).
export async function GET(req: NextRequest) {
  try {
    const ids = (req.nextUrl.searchParams.get("ids") || "")
      .split(",")
      .filter((id) => id && id.length < 60)
      .slice(0, 50);
    if (ids.length === 0) return NextResponse.json({ properties: [] });
    const snaps = await adminDb.getAll(...ids.map((id) => propertiesCol().doc(id)));
    const properties = snaps
      .map((d) => docToTyped<PropertyDoc>(d))
      .filter((p): p is PropertyDoc => !!p && p.status === PropertyStatus.ACTIVE)
      .map((p) => ({ ...p, media: p.media || [] }));
    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Batch properties fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
