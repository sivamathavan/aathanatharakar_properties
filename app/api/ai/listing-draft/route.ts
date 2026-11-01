import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getRequestUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { getAgentById, getPlansConfig } from "@/lib/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import { isPlanLive } from "@/lib/plans";
import { callClaudeForDraft, DraftError, fakeDraft, listingModel, normalizeDraft } from "@/lib/ai/listing-draft";
import { UserRole } from "@/types";

const schema = z.object({
  text: z.string().trim().min(10, "Say or paste a little more about the property.").max(4000, "That's too long. Keep it under 4,000 characters."),
  writeIn: z.enum(["en", "ta"]).optional().default("en"),
});

const usageRef = (uid: string) => {
  const now = new Date();
  const month = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return adminDb.collection("aiUsage").doc(`${uid}_${month}`);
};

// The local stand-in only runs against the emulators, never in production.
const useFake = () => process.env.LISTING_AI_FAKE === "1" && process.env.NEXT_PUBLIC_USE_EMULATORS === "true";

/**
 * Speech or pasted text → property form fields. Each use counts against the
 * agent's monthly allowance, reserved before the AI call and released if it fails.
 */
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });

  if (await checkRateLimit(`ai-draft:${user.uid}`, 20, 60 * 60 * 1000)) {
    return new NextResponse("That's a lot of voice listings in an hour. Please wait a little.", { status: 429 });
  }

  let limit = Infinity;
  if (user.role === UserRole.AGENT) {
    const [agent, plans] = await Promise.all([getAgentById(user.uid), getPlansConfig()]);
    if (!agent || !isPlanLive(agent.plan)) {
      return new NextResponse("Your plan has ended. Renew it in Plan & billing to use voice listing.", { status: 402 });
    }
    limit = plans.plans[agent.plan.id].aiDraftsPerMonth;
  }

  const ref = usageRef(user.uid);
  let used = 0;
  try {
    used = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = (snap.data()?.count as number) || 0;
      if (count >= limit) throw new DraftError(`You've used all ${limit} voice listings on your plan this month.`);
      tx.set(ref, { uid: user.uid, count: count + 1, updatedAt: new Date() }, { merge: true });
      return count + 1;
    });
  } catch (err) {
    if (err instanceof DraftError) return new NextResponse(err.message, { status: 429 });
    throw err;
  }

  try {
    const { draft, usage } = useFake()
      ? { draft: fakeDraft(parsed.data.text), usage: { inputTokens: 0, outputTokens: 0 } }
      : await callClaudeForDraft(parsed.data.text, parsed.data.writeIn);
    await ref.set(
      { inputTokens: FieldValue.increment(usage.inputTokens), outputTokens: FieldValue.increment(usage.outputTokens), model: useFake() ? "fake" : listingModel() },
      { merge: true }
    );
    const result = normalizeDraft(draft);
    return NextResponse.json({ ...result, remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : null });
  } catch (err) {
    // Don't charge the allowance for a failed read.
    await ref.set({ count: FieldValue.increment(-1) }, { merge: true }).catch(() => {});
    if (err instanceof DraftError) return new NextResponse(err.message, { status: 503 });
    console.error("[LISTING_DRAFT]", err);
    return new NextResponse("Couldn't read that right now. Please try again.", { status: 500 });
  }
}
