import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PropertyStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const propertySchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(5000),
  type: z.enum([
    "APARTMENT", "VILLA", "HOUSE", "PLOT", 
    "COMMERCIAL", "WAREHOUSE", "FARM_LAND", "PG_HOSTEL"
  ]),
  listingType: z.enum(["BUY", "SELL", "RENT", "LEASE"]),
  price: z.coerce.number().min(0),
  priceUnit: z.enum(["TOTAL", "PER_SQFT", "PER_MONTH", "PER_YEAR"]).default("TOTAL"),
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

function safePublicId(m: any): string {
  if (m?.publicId) return String(m.publicId);
  if (typeof m?.url === "string") {
    const match = m.url.match(/\/upload\/(?:[^/]+\/)?(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (match) return match[1];
  }
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (
      session.user.role !== UserRole.PROPERTY_LISTER &&
      session.user.role !== UserRole.AGENT &&
      session.user.role !== UserRole.ADMIN
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.issues[0].message, { status: 400 });
    }

    const data = result.data;

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type as any,
        listingType: data.listingType as any,
        price: BigInt(Math.round(data.price)),
        priceUnit: data.priceUnit as any,
        area: data.area,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        address: data.address,
        city: data.city,
        locality: data.locality,
        district: data.district || data.city,
        pincode: data.pincode || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        amenities: data.amenities,
        postedById: session.user.id,
        status: PropertyStatus.PENDING,
        media: {
          create: data.media.map((m, index) => ({
            url: m.url,
            type: m.type as any,
            publicId: safePublicId(m),
            thumbnailUrl: m.thumbnailUrl || null,
            order: index,
          })),
        },
      },
      include: { media: true },
    });

    return NextResponse.json({
      ...property,
      price: property.price.toString(),
    });
  } catch (error) {
    console.error("[PROPERTIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
