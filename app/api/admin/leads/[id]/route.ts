import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status, assignedToId, note } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    if (Object.keys(updateData).length > 0) {
      await prisma.lead.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    if (note && note.trim() !== "") {
      await prisma.leadNote.create({
        data: {
          leadId: params.id,
          note: note.trim(),
        }
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        property: true,
        assignedTo: true,
        notes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[ADMIN_LEAD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
