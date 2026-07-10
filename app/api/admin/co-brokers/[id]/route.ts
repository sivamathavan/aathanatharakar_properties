import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      fullName,
      mobile,
      email,
      reraNumber,
      officeAddress,
      operatingCities,
      experience,
      bio,
    } = body;

    const broker = await prisma.agentProfile.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!broker) {
      return NextResponse.json({ error: "Co-Broker not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: broker.userId },
        data: {
          name: fullName,
          email: email.toLowerCase().trim(),
          phone: mobile,
        },
      });

      return tx.agentProfile.update({
        where: { id: params.id },
        data: {
          fullName,
          mobile,
          reraNumber: reraNumber || null,
          officeAddress,
          operatingCities: Array.isArray(operatingCities) ? operatingCities : [],
          experience: Number(experience) || 0,
          bio: bio || null,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CO_BROKER_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const broker = await prisma.agentProfile.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!broker) {
      return NextResponse.json({ error: "Co-Broker not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: broker.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CO_BROKER_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
