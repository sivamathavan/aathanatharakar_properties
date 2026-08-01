import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { getPropertyById, updateProperty, deleteProperty } from "@/lib/firestore";
import { UserRole, PropertyStatus } from "@/types";

const ALLOWED_STATUSES: PropertyStatus[] = [
  PropertyStatus.PENDING,
  PropertyStatus.ACTIVE,
  PropertyStatus.SOLD,
  PropertyStatus.RENTED,
  PropertyStatus.REJECTED,
  PropertyStatus.INACTIVE,
];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status, isFeatured } = body;

    const data: any = {};
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return new NextResponse("Invalid status", { status: 400 });
      }
      data.status = status;
    }
    if (typeof isFeatured === "boolean") {
      data.isFeatured = isFeatured;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("No changes provided", { status: 400 });
    }

    const currentProp = await getPropertyById(params.id);
    if (!currentProp) {
      return new NextResponse("Property not found", { status: 404 });
    }

    await updateProperty(params.id, data);

    return NextResponse.json({
      id: params.id,
      status: data.status !== undefined ? data.status : currentProp.status,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : currentProp.isFeatured,
      title: currentProp.title,
    });
  } catch (error) {
    console.error("[ADMIN_PROPERTY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyIdToken(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const target = await getPropertyById(params.id);

    if (!target) {
      return new NextResponse("Property not found", { status: 404 });
    }

    await deleteProperty(params.id);

    return NextResponse.json({ success: true, message: "Property deleted permanently" });
  } catch (error) {
    console.error("[ADMIN_PROPERTY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
