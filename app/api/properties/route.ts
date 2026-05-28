import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PropertyStatus, UserRole } from "@prisma/client";

const ALLOWED_PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "HOUSE",
  "PLOT",
  "COMMERCIAL",
  "WAREHOUSE",
  "FARM_LAND",
  "PG_HOSTEL",
];
const ALLOWED_LISTING_TYPES = ["BUY", "SELL", "RENT", "LEASE"];
const ALLOWED_PRICE_UNITS = ["TOTAL", "PER_SQFT", "PER_MONTH", "PER_YEAR"];

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
    const {
      price,
      title,
      description,
      type,
      listingType,
      area,
      bedrooms,
      bathrooms,
      address,
      city,
      locality,
      amenities,
      priceUnit,
      latitude,
      longitude,
    } = body;

    // Basic validation
    if (
      !title?.toString().trim() ||
      !description?.toString().trim() ||
      !type ||
      !listingType ||
      !address?.toString().trim() ||
      !city?.toString().trim() ||
      !locality?.toString().trim() ||
      price === undefined ||
      area === undefined
    ) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    if (!ALLOWED_PROPERTY_TYPES.includes(type)) {
      return new NextResponse("Invalid property type", { status: 400 });
    }
    if (!ALLOWED_LISTING_TYPES.includes(listingType)) {
      return new NextResponse("Invalid listing type", { status: 400 });
    }
    const finalPriceUnit = priceUnit || "TOTAL";
    if (!ALLOWED_PRICE_UNITS.includes(finalPriceUnit)) {
      return new NextResponse("Invalid price unit", { status: 400 });
    }

    const priceNum = Number(price);
    const areaNum = Number(area);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return new NextResponse("Invalid price", { status: 400 });
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      return new NextResponse("Invalid area", { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title: String(title).trim().slice(0, 240),
        description: String(description).trim().slice(0, 5000),
        type,
        listingType,
        price: BigInt(Math.round(priceNum)),
        priceUnit: finalPriceUnit,
        area: areaNum,
        bedrooms: bedrooms ? parseInt(String(bedrooms)) : null,
        bathrooms: bathrooms ? parseInt(String(bathrooms)) : null,
        address: String(address).trim().slice(0, 500),
        city: String(city).trim().slice(0, 80),
        locality: String(locality).trim().slice(0, 120),
        district: body.district || city || "Tamil Nadu",
        pincode: body.pincode || null,
        latitude: latitude ? parseFloat(String(latitude)) : null,
        longitude: longitude ? parseFloat(String(longitude)) : null,
        amenities: Array.isArray(amenities) ? amenities.slice(0, 30) : [],
        postedById: session.user.id,
        status: PropertyStatus.PENDING,
        media: {
          create: Array.isArray(body.media)
            ? body.media.slice(0, 20).map((m: any, index: number) => ({
                url: String(m.url),
                type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
                publicId: safePublicId(m),
                thumbnailUrl: m.thumbnailUrl || null,
                order: index,
              }))
            : [],
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
