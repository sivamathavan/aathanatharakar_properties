import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { media: true },
    });

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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true, postedById: true },
    });

    if (!property) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (
      property.postedById !== session.user.id &&
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
      media,
    } = body;

    const priceNum = Number(price);
    const areaNum = Number(area);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return new NextResponse("Invalid price", { status: 400 });
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      return new NextResponse("Invalid area", { status: 400 });
    }

    const updatedProperty = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id: params.id },
        data: {
          title: String(title).trim().slice(0, 240),
          description: String(description).trim().slice(0, 5000),
          type,
          listingType,
          price: BigInt(Math.round(priceNum)),
          priceUnit: priceUnit || "TOTAL",
          area: areaNum,
          bedrooms: bedrooms ? parseInt(String(bedrooms)) : null,
          bathrooms: bathrooms ? parseInt(String(bathrooms)) : null,
          address: String(address).trim().slice(0, 500),
          city: String(city).trim().slice(0, 80),
          locality: String(locality).trim().slice(0, 120),
          district: body.district || city || "Tamil Nadu",
          pincode: body.pincode || null,
          amenities: Array.isArray(amenities) ? amenities.slice(0, 30) : [],
          // Re-set to PENDING after edit so admin re-approves changes.
          status:
            session.user.role === UserRole.ADMIN
              ? undefined
              : ("PENDING" as any),
        },
      });

      if (Array.isArray(media)) {
        await tx.propertyMedia.deleteMany({ where: { propertyId: params.id } });
        if (media.length > 0) {
          await tx.propertyMedia.createMany({
            data: media.slice(0, 20).map((m: any, index: number) => ({
              propertyId: params.id,
              url: String(m.url),
              type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
              publicId: safePublicId(m),
              thumbnailUrl: m.thumbnailUrl || null,
              order: index,
            })),
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      ...updatedProperty,
      price: updatedProperty.price.toString(),
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true, postedById: true },
    });
    if (!property) return new NextResponse("Not Found", { status: 404 });

    if (
      property.postedById !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Soft-disable rather than hard delete to preserve history.
    await prisma.property.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROPERTY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
