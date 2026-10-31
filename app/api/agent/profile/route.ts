import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { agentsCol, getAgentById, getPlansConfig } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { UserRole } from "@/types";

const text = (max: number) => z.string().trim().max(max).transform((v) => v || null);

const schema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(80),
  agencyName: text(80),
  whatsapp: z.string().trim().refine((v) => v.replace(/[^0-9]/g, "").length >= 10, "Enter a valid WhatsApp number"),
  city: z.string().trim().min(2).max(60),
  bio: text(600),
  reraNumber: text(60),
  photoUrl: z.string().trim().max(1000),
  logoUrl: z.string().trim().max(1000),
});

function ownImage(url: string, uid: string) {
  return url === "" || url.includes(encodeURIComponent(`agents/${uid}/`));
}

export async function PUT(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;
    if (!ownImage(input.photoUrl, user.uid) || !ownImage(input.logoUrl, user.uid)) {
      return new NextResponse("Upload photos from this page only.", { status: 400 });
    }
    const agent = await getAgentById(user.uid);
    if (!agent) return new NextResponse("Agent profile not found.", { status: 404 });
    const canBrand = (await getPlansConfig()).plans[agent.plan.id].branding;

    await agentsCol().doc(user.uid).update({
      displayName: input.displayName,
      agencyName: input.agencyName,
      whatsapp: input.whatsapp.replace(/[^0-9+]/g, ""),
      city: input.city,
      bio: input.bio,
      reraNumber: input.reraNumber,
      photoUrl: input.photoUrl || null,
      logoUrl: canBrand ? input.logoUrl || null : agent.logoUrl || null,
      updatedAt: new Date(),
    });
    refreshListingCaches(agent.slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AGENT_PROFILE_PUT]", error);
    return new NextResponse("Could not save.", { status: 500 });
  }
}
