import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { propertiesCol, getUserById, getPropertyById } from "@/lib/firestore";
import { UserRole, PropertyDoc, MediaDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const propertiesSnap = await propertiesCol().orderBy("createdAt", "desc").get();
    
    const enrichedProperties = await Promise.all(
      propertiesSnap.docs.map(async (doc) => {
        const data = doc.data()!;
        const property: any = { id: doc.id };
        
        // Convert Firestore Timestamps
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof (value as any).toDate === "function") {
            property[key] = (value as any).toDate();
          } else {
            property[key] = value;
          }
        }

        // Fetch subcollection media
        const mediaSnap = await doc.ref.collection("media").orderBy("order").get();
        property.media = mediaSnap.docs.map((m) => {
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

        // Enrich postedBy user
        let postedBy = null;
        if (property.postedById) {
          postedBy = await getUserById(property.postedById);
        }

        return {
          ...property,
          postedBy,
          price: property.price.toString(),
        };
      })
    );

    return NextResponse.json(enrichedProperties);
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
