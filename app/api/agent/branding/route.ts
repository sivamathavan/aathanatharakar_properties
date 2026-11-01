import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { agentsCol, getAgentById, getPlansConfig } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { AGENT_LANGUAGES, BRAND_PRESETS, ownAgentImage } from "@/lib/agent-brand";
import { UserRole } from "@/types";

const text = (max: number) => z.string().trim().max(max).transform((v) => v || null);

// Social links must be plain https links; anything else is dropped as empty.
const link = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/[^\s<>"]+$/.test(v), "Social links must start with https://");

const schema = z.object({
  brandColor: z.enum(BRAND_PRESETS.map((p) => p.id) as [string, ...string[]]),
  tagline: text(80),
  officeAddress: text(200),
  languages: z.array(z.enum(AGENT_LANGUAGES)).max(AGENT_LANGUAGES.length),
  social: z.object({ website: link, facebook: link, instagram: link, youtube: link }),
  coverUrl: z.string().trim().max(1000),
  hideFooter: z.boolean(),
  showSold: z.boolean(),
});

// Page look: colour, tagline, office, languages, social links. Cover photo and
// hiding the footer are Pro extras; other plans keep their saved values.
export async function PUT(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;
    if (!ownAgentImage(input.coverUrl, user.uid)) return new NextResponse("Upload photos from this page only.", { status: 400 });

    const agent = await getAgentById(user.uid);
    if (!agent) return new NextResponse("Agent profile not found.", { status: 404 });
    const pro = (await getPlansConfig()).plans[agent.plan.id].branding;
    const social = Object.fromEntries(Object.entries(input.social).filter(([, v]) => v));

    await agentsCol().doc(user.uid).update({
      brandColor: input.brandColor,
      tagline: input.tagline,
      officeAddress: input.officeAddress,
      languages: input.languages,
      social,
      showSold: input.showSold,
      coverUrl: pro ? input.coverUrl || null : agent.coverUrl || null,
      hideFooter: pro ? input.hideFooter : !!agent.hideFooter,
      updatedAt: new Date(),
    });
    refreshListingCaches(agent.slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AGENT_BRANDING_PUT]", error);
    return new NextResponse("Could not save.", { status: 500 });
  }
}
