import { NextRequest, NextResponse } from "next/server";
import { propertiesCol } from "@/lib/firestore";
import { PropertyDoc, PropertyStatus, MediaDoc } from "@/types";
import { adminDb } from "@/lib/firebase-admin";

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

    // Fetch documents in batch using Firebase Admin getAll
    const refs = ids.map((id) => propertiesCol().doc(id));
    const docSnaps = await adminDb.getAll(...refs);

    const activeDocs = docSnaps.filter((d) => d.exists && d.data()?.status === PropertyStatus.ACTIVE);

    const serializedProperties: PropertyDoc[] = [];

    for (const d of activeDocs) {
      const data = d.data()!;
      // Convert Timestamp fields
      const converted: any = { id: d.id };
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof (value as any).toDate === "function") {
          converted[key] = (value as any).toDate();
        } else {
          converted[key] = value;
        }
      }

      // Fetch media subcollection
      const mediaSnap = await propertiesCol().doc(d.id).collection("media").orderBy("order").get();
      converted.media = mediaSnap.docs.map((m) => {
        const mData = m.data()!;
        const mConv: any = { id: m.id };
        for (const [k, v] of Object.entries(mData)) {
          if (v && typeof (v as any).toDate === "function") {
            mConv[k] = (v as any).toDate();
          } else {
            mConv[k] = v;
          }
        }
        return mConv as MediaDoc;
      });

      serializedProperties.push(converted as PropertyDoc);
    }

    return NextResponse.json({ properties: serializedProperties });
  } catch (error) {
    console.error("Batch properties fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
