import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { agentsCol } from "@/lib/firestore";
import { UserRole } from "@/types";

const schema = z.object({
  uiLang: z.enum(["en", "ta"]).optional(),
  // Recorded when the agent first copies or sends their link (onboarding + funnel).
  shared: z.literal(true).optional(),
});

export async function PUT(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse("Invalid request.", { status: 400 });
  const ref = agentsCol().doc(user.uid);
  const update: Record<string, unknown> = {};
  if (parsed.data.uiLang) update.uiLang = parsed.data.uiLang;
  if (parsed.data.shared) {
    const snap = await ref.get();
    if (snap.exists && !snap.data()!.firstSharedAt) update.firstSharedAt = new Date();
  }
  if (Object.keys(update).length) await ref.update(update);
  return NextResponse.json({ ok: true });
}
