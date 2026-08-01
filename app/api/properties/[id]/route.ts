import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { getPropertyById, updateProperty } from "@/lib/firestore";
import { UserRole, PropertyStatus, PropertyType, ListingType, PriceUnit, MediaDoc } from "@/types";
import { adminDb } from "@/lib/firebase-admin";
import { z } from "zod";

function safePublicId(m: any): string {
  if (m?.publicId) return String(m.publicId);
  if (typeof m?.url === "string") {
    const match = m.url.match(/\/upload\/(?:[^/]+\/)?(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (match) return match[1];
  }
  return "unknown";
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const property = await getPropertyById(params.id);

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    return NextResponse.json({
      ...property,
      price: property.price.toString(),
    });
  } catch (error) {
    console.error("[PROPERTY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

const propertySchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(5000),
  type: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),
  price: z.coerce.number().min(0),
  priceUnit: z.nativeEnum(PriceUnit).default(PriceUnit.TOTAL),
  area: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  address: z.string().trim().min(1).max(500),
  locality: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().max(80).optional(),
  pincode: z.string().trim().max(20).optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  amenities: z.array(z.string()).max(30).optional().default([]),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["IMAGE", "VIDEO"]),
    publicId: z.string().optional(),
    thumbnailUrl: z.string().url().optional().nullable(),
  })).max(20).optional().default([])
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyIdToken(req);

    if (!authUser || !authUser.uid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const property = await getPropertyById(params.id);

    if (!property) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Forbidden - Only admins can edit properties in broker mode", { status: 403 });
    }

    const body = await req.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.issues[0].message, { status: 400 });
    }

    const data = result.data;

    // Use a transaction or batch to update property and subcollection media
    const batch = adminDb.batch();
    const propRef = adminDb.collection("properties").doc(params.id);

    const updateFields: any = {
      title: data.title,
      description: data.description,
      type: data.type,
      listingType: data.listingType,
      price: Math.round(data.price),
      priceUnit: data.priceUnit,
      area: data.area,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      address: data.address,
      city: data.city,
      locality: data.locality,
      district: data.district || data.city,
      pincode: data.pincode || null,
      amenities: data.amenities,
      updatedAt: new Date(),
    };

    batch.update(propRef, updateFields);

    if (Array.isArray(data.media)) {
      // 1. Delete all existing media documents in subcollection
      const mediaCol = propRef.collection("media");
      const existingMediaSnap = await mediaCol.get();
      existingMediaSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. Add new media docs
      data.media.forEach((m, index) => {
        const newMediaRef = mediaCol.doc();
        batch.set(newMediaRef, {
          url: m.url,
          type: m.type,
          publicId: safePublicId(m),
          thumbnailUrl: m.thumbnailUrl || null,
          order: index,
          createdAt: new Date(),
        });
      });
    }

    await batch.commit();

    return NextResponse.json({
      ...property,
      ...updateFields,
      price: updateFields.price.toString(),
    });
  } catch (error) {
    console.error("[PROPERTY_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || !authUser.uid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const property = await getPropertyById(params.id);
    if (!property) return new NextResponse("Not Found", { status: 404 });

    if (authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Forbidden - Only admins can delete properties in broker mode", { status: 403 });
    }

    // Soft-disable rather than hard delete to preserve history.
    await updateProperty(params.id, { status: PropertyStatus.INACTIVE });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROPERTY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
