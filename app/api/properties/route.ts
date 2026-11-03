import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { agentsCol, countOwnerProperties, createProperty, getAgentById, getPlansConfig, writeAudit } from "@/lib/firestore";
import { hasPlanTime } from "@/lib/plans";
import { mediaBelongsTo, privateFields, propertyInputSchema, publicFields, refreshListingCaches } from "@/lib/property-input";
import { PropertyStatus, UserRole } from "@/types";

// Create a listing. Agents are held to their plan's listing and photo limits.
export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return new NextResponse("Please sign in again.", { status: 401 });

    const parsed = propertyInputSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;

    if (user.role === UserRole.AGENT) {
      const agent = await getAgentById(user.uid);
      if (!agent) return new NextResponse("Agent profile not found.", { status: 404 });
      if (!hasPlanTime(agent.plan)) {
        return new NextResponse("Your plan has ended. Renew it in Plan & Billing to add listings.", { status: 402 });
      }
      const plans = await getPlansConfig();
      const limits = plans.plans[agent.plan.id];
      if ((await countOwnerProperties(user.uid)) >= limits.listingLimit) {
        return new NextResponse(
          `Your ${limits.name} plan allows ${limits.listingLimit} listings. Delete one or upgrade your plan.`,
          { status: 402 }
        );
      }
      if (input.media.length > limits.photoLimit) {
        return new NextResponse(`Your plan allows ${limits.photoLimit} photos per listing.`, { status: 400 });
      }
      if (input.media.some((m) => m.type === "VIDEO") || !mediaBelongsTo(input.media, user.uid)) {
        return new NextResponse("Upload photos from this form only.", { status: 400 });
      }

      const id = await createProperty(
        {
          ...publicFields(input),
          status: PropertyStatus.ACTIVE,
          postedById: user.uid,
          ownerType: "AGENT",
          agentSlug: agent.slug,
          onMarketplace: false,
          boostUntil: null,
        },
        privateFields(input)
      );
      if (!agent.firstListingAt) await agentsCol().doc(user.uid).update({ firstListingAt: new Date() });
      refreshListingCaches(agent.slug, id);
      return NextResponse.json({ id }, { status: 201 });
    }

    // Admin: the listing goes on the main site straight away.
    const id = await createProperty(
      {
        ...publicFields(input),
        status: PropertyStatus.ACTIVE,
        postedById: user.uid,
        ownerType: "ADMIN",
        agentSlug: null,
        onMarketplace: true,
        boostUntil: null,
      },
      privateFields(input)
    );
    await writeAudit(user.uid, "property.create", id, { title: input.title });
    refreshListingCaches(null, id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[PROPERTY_POST]", error);
    return new NextResponse("Could not save the listing. Please try again.", { status: 500 });
  }
}
