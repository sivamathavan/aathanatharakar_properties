import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getPropertyById, updateProperty, writeAudit } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { PropertyDoc, PropertyStatus, UserRole } from "@/types";

const schema = z.object({
  status: z.nativeEnum(PropertyStatus).optional(),
  isFeatured: z.boolean().optional(),
  onMarketplace: z.boolean().optional(),
});

// Moderation: publish, hide, feature, or take any listing off the main site.
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return new NextResponse("No changes provided", { status: 400 });
    }
    const property = await getPropertyById(params.id);
    if (!property) return new NextResponse("Property not found", { status: 404 });

    await updateProperty(params.id, parsed.data as Partial<PropertyDoc>);
    await writeAudit(admin.uid, "property.moderate", params.id, parsed.data);
    refreshListingCaches(property.agentSlug, params.id);
    return NextResponse.json({ ...property, ...parsed.data });
  } catch (error) {
    console.error("[ADMIN_PROPERTY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export { DELETE } from "@/app/api/properties/[id]/route";
