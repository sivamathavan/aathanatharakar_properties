import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { requireRole } from "@/lib/auth";
import { agentSlugsCol, agentsCol, getAgentById, propertiesCol } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { RESERVED_SLUGS } from "@/lib/plans";
import { validSlugChoice } from "@/lib/agent-brand";
import { UserRole } from "@/types";

const clean = (v: string) => v.trim().toLowerCase();

async function problem(slug: string, uid: string): Promise<string | null> {
  const invalid = validSlugChoice(slug);
  if (invalid) return invalid;
  if (RESERVED_SLUGS.has(slug)) return "That name is reserved. Try another.";
  const taken = await agentSlugsCol().doc(slug).get();
  if (taken.exists && taken.data()!.uid !== uid) return "Someone already has that link. Try another.";
  return null;
}

// Is this link name free? Used while the agent types.
export async function GET(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  const slug = clean(new URL(req.url).searchParams.get("slug") || "");
  const error = await problem(slug, user.uid);
  return NextResponse.json({ slug, ok: !error, error });
}

// Choose the link name once. The old link keeps working and redirects here.
export async function POST(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    const parsed = z.object({ slug: z.string().max(60) }).safeParse(await req.json());
    if (!parsed.success) return new NextResponse("Enter a link name.", { status: 400 });
    const slug = clean(parsed.data.slug);
    const error = await problem(slug, user.uid);
    if (error) return new NextResponse(error, { status: 400 });

    const agent = await getAgentById(user.uid);
    if (!agent) return new NextResponse("Agent profile not found.", { status: 404 });
    if (agent.slugChangedAt) return new NextResponse("You have already chosen your link name.", { status: 409 });
    if (agent.slug === slug) return NextResponse.json({ slug });

    const now = new Date();
    await adminDb.runTransaction(async (tx) => {
      const ref = agentSlugsCol().doc(slug);
      const snap = await tx.get(ref);
      if (snap.exists && snap.data()!.uid !== user.uid) throw new Error("SLUG_TAKEN");
      tx.set(ref, { uid: user.uid, createdAt: now });
      // The old slug doc stays and still points at this agent, so old links resolve and redirect.
      tx.set(agentSlugsCol().doc(agent.slug), { uid: user.uid, retiredAt: now, redirectTo: slug }, { merge: true });
      tx.update(agentsCol().doc(user.uid), {
        slug,
        slugChangedAt: now,
        previousSlugs: [...(agent.previousSlugs || []), agent.slug],
        updatedAt: now,
      });
    });

    const listings = await propertiesCol().where("postedById", "==", user.uid).select().get();
    for (let i = 0; i < listings.docs.length; i += 400) {
      const batch = adminDb.batch();
      listings.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { agentSlug: slug }));
      await batch.commit();
    }
    refreshListingCaches(slug);
    revalidatePath(`/a/${agent.slug}`);
    return NextResponse.json({ slug });
  } catch (error: any) {
    if (error?.message === "SLUG_TAKEN") return new NextResponse("Someone just took that link. Try another.", { status: 409 });
    console.error("[AGENT_SLUG_POST]", error);
    return new NextResponse("Could not change your link.", { status: 500 });
  }
}
