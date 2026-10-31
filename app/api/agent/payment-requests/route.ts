import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getAgentById, getPlansConfig, getPropertyById, paymentRequestsCol } from "@/lib/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import { escapeHtml, sendEmail } from "@/lib/mail";
import { formatINR, PAID_PLAN_IDS, planPrice } from "@/lib/plans";
import { PropertyStatus, UserRole } from "@/types";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("PLAN"),
    planId: z.enum(["STARTER", "PRO"]),
    period: z.enum(["MONTHLY", "YEARLY"]),
    utr: z.string().trim().regex(/^[A-Za-z0-9]{6,30}$/, "Enter the UTR / reference number from your UPI app."),
  }),
  z.object({
    kind: z.literal("BOOST"),
    propertyId: z.string().min(1).max(60),
    weeks: z.coerce.number().int().min(1).max(8),
    utr: z.string().trim().regex(/^[A-Za-z0-9]{6,30}$/, "Enter the UTR / reference number from your UPI app."),
  }),
]);

// An agent says "I have paid". The amount is worked out here from the current
// prices, never taken from the browser. The admin approves it after checking the bank.
export async function POST(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    if (await checkRateLimit(`payreq:${user.uid}`, 10, 24 * 60 * 60 * 1000)) {
      return new NextResponse("Too many payment submissions today. Please call DK Promoters.", { status: 429 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;

    const [agent, plans] = await Promise.all([getAgentById(user.uid), getPlansConfig()]);
    if (!agent) return new NextResponse("Agent profile not found.", { status: 404 });

    const utrTaken = await paymentRequestsCol().where("utr", "==", input.utr.toUpperCase()).limit(1).get();
    if (!utrTaken.empty) return new NextResponse("This UTR has already been submitted.", { status: 409 });

    const base = {
      agentId: user.uid,
      agentName: agent.displayName,
      utr: input.utr.toUpperCase(),
      status: "PENDING",
      decidedBy: null,
      decidedAt: null,
      note: null,
      createdAt: new Date(),
    };

    let doc: Record<string, unknown>;
    if (input.kind === "PLAN") {
      if (!PAID_PLAN_IDS.includes(input.planId)) return new NextResponse("Choose a plan.", { status: 400 });
      const def = plans.plans[input.planId];
      doc = { ...base, kind: "PLAN", planId: input.planId, period: input.period, amount: planPrice(def, input.period), propertyId: null, propertyTitle: null, weeks: null };
    } else {
      const property = await getPropertyById(input.propertyId);
      if (!property || property.postedById !== user.uid || property.status !== PropertyStatus.ACTIVE) {
        return new NextResponse("Only your live listings can be boosted.", { status: 400 });
      }
      doc = { ...base, kind: "BOOST", planId: null, period: null, propertyId: property.id, propertyTitle: property.title, weeks: input.weeks, amount: plans.boostPricePerWeek * input.weeks };
    }

    const ref = await paymentRequestsCol().add(doc);

    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Payment to check: ${agent.displayName} ${formatINR(doc.amount as number)}`,
        html: `<p>${escapeHtml(agent.displayName)} says they paid <strong>${formatINR(doc.amount as number)}</strong> for ${input.kind === "PLAN" ? `the ${escapeHtml(input.planId)} plan (${input.period.toLowerCase()})` : `a ${input.weeks}-week boost`}.</p><p>UTR: <strong>${escapeHtml(doc.utr)}</strong></p><p>Approve it in Admin → Payments.</p>`,
      }).catch(() => {});
    }
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[PAYMENT_REQUEST_POST]", error);
    return new NextResponse("Could not send. Please try again.", { status: 500 });
  }
}
