import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.agentProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      mobile: true,
      reraNumber: true,
      officeAddress: true,
      operatingCities: true,
      experience: true,
      bio: true,
      createdAt: true,
    },
  });

  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
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

    if (!fullName || !mobile || !email || !officeAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const newBroker = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: normalizedEmail,
          phone: mobile,
          role: "AGENT",
          accountStatus: "ACTIVE",
          agentProfile: {
            create: {
              fullName,
              mobile,
              reraNumber: reraNumber || null,
              officeAddress,
              operatingCities: Array.isArray(operatingCities) ? operatingCities : [],
              experience: Number(experience) || 0,
              bio: bio || null,
            },
          },
        },
        include: {
          agentProfile: true,
        },
      });
      return user.agentProfile;
    });

    return NextResponse.json(newBroker);
  } catch (error) {
    console.error("[CO_BROKER_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
