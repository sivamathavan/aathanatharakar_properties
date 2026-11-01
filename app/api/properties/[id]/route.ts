import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";
import {
  countOwnerProperties,
  deleteProperty,
  getAgentById,
  getPlansConfig,
  getPropertyById,
  getPropertyPrivate,
  updateProperty,
  writeAudit,
} from "@/lib/firestore";
import { isPlanLive } from "@/lib/plans";
import { mediaBelongsTo, privateFields, propertyInputSchema, publicFields, refreshListingCaches } from "@/lib/property-input";
import { PropertyDoc, PropertyStatus, UserRole } from "@/types";

type Params = { params: { id: string } };

async function loadForEdit(req: Request, id: string) {
  const user = await getRequestUser(req);
  if (!user) return { error: new NextResponse("Please sign in again.", { status: 401 }) };
  const property = await getPropertyById(id);
  if (!property) return { error: new NextResponse("Listing not found.", { status: 404 }) };
  if (user.role !== UserRole.ADMIN && property.postedById !== user.uid) {
    return { error: new NextResponse("You can only change your own listings.", { status: 403 }) };
  }
  return { user, property };
}

// Public read of an ACTIVE listing; the owner and admin also get private details.
export async function GET(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  const property = await getPropertyById(params.id);
  if (!property) return new NextResponse("Listing not found.", { status: 404 });
  const canEdit = !!user && (user.role === UserRole.ADMIN || property.postedById === user.uid);
  if (!canEdit) {
    if (property.status !== PropertyStatus.ACTIVE) return new NextResponse("Listing not found.", { status: 404 });
    return NextResponse.json(property);
  }
  return NextResponse.json({ ...property, private: await getPropertyPrivate(params.id) });
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const loaded = await loadForEdit(req, params.id);
    if ("error" in loaded) return loaded.error;
    const { user, property } = loaded;

    const parsed = propertyInputSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;

    if (user.role === UserRole.AGENT) {
      const agent = await getAgentById(user.uid);
      if (!agent || !isPlanLive(agent.plan)) {
        return new NextResponse("Your plan has ended. Renew it in Plan & Billing to edit listings.", { status: 402 });
      }
      const limits = (await getPlansConfig()).plans[agent.plan.id];
      if (input.media.length > limits.photoLimit) {
        return new NextResponse(`Your plan allows ${limits.photoLimit} photos per listing.`, { status: 400 });
      }
      if (input.media.some((m) => m.type === "VIDEO") || !mediaBelongsTo(input.media, user.uid)) {
        return new NextResponse("Upload photos from this form only.", { status: 400 });
      }
    }

    await updateProperty(params.id, publicFields(input), privateFields(input));
    if (user.role === UserRole.ADMIN) await writeAudit(user.uid, "property.update", params.id);
    refreshListingCaches(property.agentSlug, params.id);
    return NextResponse.json({ id: params.id });
  } catch (error) {
    console.error("[PROPERTY_PUT]", error);
    return new NextResponse("Could not save the listing. Please try again.", { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum([PropertyStatus.ACTIVE, PropertyStatus.INACTIVE, PropertyStatus.SOLD, PropertyStatus.RENTED]),
  // Only with SOLD / RENTED. The price and buyer stay private.
  soldAt: z.string().datetime({ offset: true }).optional(),
  soldPrice: z.coerce.number().min(0).max(1e11).optional().nullable(),
  soldTo: z.string().trim().max(120).optional().nullable(),
});

const CLOSED = [PropertyStatus.SOLD, PropertyStatus.RENTED];

// Quick status change from the listings table (publish, hide, mark sold).
export async function PATCH(req: Request, { params }: Params) {
  try {
    const loaded = await loadForEdit(req, params.id);
    if ("error" in loaded) return loaded.error;
    const { user, property } = loaded;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse("Invalid status.", { status: 400 });

    const next = parsed.data.status;
    if (user.role === UserRole.AGENT && !CLOSED.includes(next)) {
      const agent = await getAgentById(user.uid);
      if (next === PropertyStatus.ACTIVE && (!agent || !isPlanLive(agent.plan))) {
        return new NextResponse("Your plan has ended. Renew it to publish listings.", { status: 402 });
      }
      // A sold listing coming back takes a plan slot again.
      if (agent && CLOSED.includes(property.status)) {
        const limits = (await getPlansConfig()).plans[agent.plan.id];
        if ((await countOwnerProperties(user.uid)) >= limits.listingLimit) {
          return new NextResponse(`Your ${limits.name} plan allows ${limits.listingLimit} listings. Hide or delete one first.`, { status: 402 });
        }
      }
    }
    const closing = CLOSED.includes(next);
    await updateProperty(
      params.id,
      { status: next, soldAt: closing ? (parsed.data.soldAt ? new Date(parsed.data.soldAt) : new Date()) : null } as Partial<PropertyDoc>,
      closing ? { soldPrice: parsed.data.soldPrice ?? null, soldTo: parsed.data.soldTo || null } : undefined
    );
    refreshListingCaches(property.agentSlug, params.id);
    return NextResponse.json({ id: params.id, status: parsed.data.status });
  } catch (error) {
    console.error("[PROPERTY_PATCH]", error);
    return new NextResponse("Could not update the listing.", { status: 500 });
  }
}

// Delete for good (frees a slot in the agent's plan) and remove its photos.
export async function DELETE(req: Request, { params }: Params) {
  try {
    const loaded = await loadForEdit(req, params.id);
    if ("error" in loaded) return loaded.error;
    const { user, property } = loaded;

    await deleteProperty(params.id);
    const bucket = adminStorage.bucket();
    // Title documents for this listing go too.
    await bucket.deleteFiles({ prefix: `agent-docs/${property.postedById}/${params.id}/` }).catch(() => {});
    await Promise.all(
      (property.media || [])
        .filter((m) => m.path && mediaBelongsTo([m], property.postedById))
        .map((m) => bucket.file(m.path!).delete().catch(() => {}))
    );
    if (user.role === UserRole.ADMIN) await writeAudit(user.uid, "property.delete", params.id, { title: property.title });
    refreshListingCaches(property.agentSlug, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROPERTY_DELETE]", error);
    return new NextResponse("Could not delete the listing.", { status: 500 });
  }
}
