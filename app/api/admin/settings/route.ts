import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { configCol, writeAudit } from "@/lib/firestore";
import { UserRole } from "@/types";

const limits = z.object({
  priceMonthly: z.coerce.number().int().min(0).max(100000),
  priceYearly: z.coerce.number().int().min(0).max(1000000),
  listingLimit: z.coerce.number().int().min(1).max(100),
  photoLimit: z.coerce.number().int().min(1).max(20),
  aiDraftsPerMonth: z.coerce.number().int().min(0).max(2000).optional(),
});

const schema = z.object({
  plans: z.object({
    trialDays: z.coerce.number().int().min(1).max(60),
    boostPricePerWeek: z.coerce.number().int().min(0).max(100000),
    trial: limits.pick({ listingLimit: true, photoLimit: true, aiDraftsPerMonth: true }),
    starter: limits,
    pro: limits,
  }),
  site: z.object({
    upiId: z.string().trim().max(80).refine((v) => v === "" || /^[\w.\-]+@[\w.\-]+$/.test(v), "UPI ID looks wrong (example: yourname@okaxis)"),
    upiName: z.string().trim().min(2).max(80),
    brokerWhatsapp: z.string().trim().max(20),
    gstin: z.string().trim().toUpperCase().max(15).refine((v) => v === "" || /^[0-9]{2}[A-Z0-9]{13}$/.test(v), "GSTIN must be 15 characters"),
  }),
});

// Listing and photo limits are capped at 100 and 20: agent pages load all
// listings in one read, and photos are the main bandwidth cost.
export async function PUT(req: Request) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
  const { plans, site } = parsed.data;
  await configCol().doc("plans").set({
    trialDays: plans.trialDays,
    boostPricePerWeek: plans.boostPricePerWeek,
    // JSON round-trip drops unset optional fields; Firestore rejects undefined.
    plans: JSON.parse(JSON.stringify({ TRIAL: plans.trial, STARTER: plans.starter, PRO: plans.pro })),
  }, { merge: true });
  await configCol().doc("site").set(site, { merge: true });
  await writeAudit(admin.uid, "settings.update", "config", parsed.data);
  revalidatePath("/for-agents");
  revalidatePath("/register");
  return NextResponse.json({ ok: true });
}
