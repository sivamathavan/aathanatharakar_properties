import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { vendorProfile: true }
    });

    if (!user || !user.vendorProfile) {
      return new NextResponse("Vendor profile not found", { status: 404 });
    }

    const { media } = await req.json();

    if (!media || !Array.isArray(media)) {
      return new NextResponse("Invalid media array", { status: 400 });
    }

    // Delete existing media for this vendor
    await prisma.vendorMedia.deleteMany({
      where: { vendorId: user.vendorProfile.id }
    });

    // Create new media
    if (media.length > 0) {
      await prisma.vendorMedia.createMany({
        data: media.map((m: any, index: number) => ({
          vendorId: user.vendorProfile!.id,
          url: m.url,
          type: m.type || "IMAGE",
          publicId: m.url.split('/').pop() || "unknown",
          order: index
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VENDOR_PORTFOLIO_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
