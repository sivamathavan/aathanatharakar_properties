import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { media: true },
    });

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    // Convert BigInt for JSON
    return NextResponse.json({
      ...property,
      price: property.price.toString()
    });
  } catch (error) {
    console.error("[PROPERTY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure user owns property or is admin
    const property = await prisma.property.findUnique({
      where: { id: params.id }
    });

    if (!property) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (property.postedById !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { price, title, description, type, listingType, area, bedrooms, bathrooms, address, city, locality, amenities, priceUnit, media } = body;

    const updatedProperty = await prisma.property.update({
      where: { id: params.id },
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
      },
    });

    // Update Media if provided
    if (media && Array.isArray(media)) {
      // Delete existing media
      await prisma.propertyMedia.deleteMany({
        where: { propertyId: params.id }
      });
      // Re-create
      if (media.length > 0) {
        await prisma.propertyMedia.createMany({
          data: media.map((m: any, index: number) => ({
            propertyId: params.id,
            url: m.url,
            type: m.type || "IMAGE",
            publicId: m.url.split('/').pop() || "unknown",
            order: index
          }))
        });
      }
    }

    return NextResponse.json({
      ...updatedProperty,
      price: updatedProperty.price.toString()
    });
  } catch (error) {
    console.error("[PROPERTY_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
