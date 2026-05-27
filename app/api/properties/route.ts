import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PropertyStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only property listers and agents can create properties
    if (session.user.role !== "PROPERTY_LISTER" && session.user.role !== "AGENT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    
    // Ensure all required Prisma fields are correctly structured and types are correct
    const { price, title, description, type, listingType, area, bedrooms, bathrooms, address, city, locality, amenities, priceUnit } = body;

    const property = await prisma.property.create({
      data: {
        title,
        description,
        type,
        listingType,
        price: BigInt(Math.round(Number(price))),
        priceUnit: priceUnit || "TOTAL",
        area: parseFloat(area),
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        address,
        city,
        locality,
        district: body.district || city || "Tamil Nadu",
        pincode: body.pincode || null,
        amenities: Array.isArray(amenities) ? amenities : [],
        postedById: session.user.id,
        status: PropertyStatus.PENDING, // Always pending until admin approves
        media: {
          create: Array.isArray(body.media) ? body.media.map((m: any, index: number) => ({
            url: m.url,
            type: m.type || "IMAGE",
            publicId: m.url.split('/').pop() || "unknown", // Simple fallback
            order: index
          })) : []
        }
      },
      include: { media: true }
    });

    // We need to convert BigInt to string/number for JSON response
    const sanitizedProperty = {
      ...property,
      price: property.price.toString(),
    };

    return NextResponse.json(sanitizedProperty);
  } catch (error) {
    console.error("[PROPERTIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
