// Admin funnel and business numbers. Pure: takes plain data, safe to unit test.
import { effectiveStatus } from "@/lib/plans";
import { istDayStart } from "@/lib/dates";
import type { AgentDoc, PaymentRequestDoc, PlansConfig } from "@/types";

export const FUNNEL_STEPS = [
  { key: "signedUp", label: "Signed up" },
  { key: "verified", label: "Confirmed email" },
  { key: "listed", label: "Added a listing" },
  { key: "shared", label: "Shared their link" },
  { key: "paid", label: "Paid" },
] as const;
export type FunnelKey = (typeof FUNNEL_STEPS)[number]["key"];
export type Funnel = Record<FunnelKey, number>;

type A = Pick<AgentDoc, "id" | "createdAt" | "emailVerified" | "firstListingAt" | "firstSharedAt" | "firstPaidAt" | "plan">;

/** Each agent counts at a step only if they also reached every earlier step. */
export function funnelOf(agents: A[], hasListing: Set<string>, paidIds: Set<string>): Funnel {
  const f: Funnel = { signedUp: 0, verified: 0, listed: 0, shared: 0, paid: 0 };
  for (const a of agents) {
    f.signedUp++;
    if (!a.emailVerified) continue;
    f.verified++;
    if (!a.firstListingAt && !hasListing.has(a.id)) continue;
    f.listed++;
    if (!a.firstSharedAt) continue;
    f.shared++;
    if (a.firstPaidAt || paidIds.has(a.id)) f.paid++;
  }
  return f;
}

/** Monday 00:00 IST of the week the date falls in. */
export function istWeekStart(d: Date | string): Date {
  const day = istDayStart(d);
  const weekday = (new Date(day.getTime() + 330 * 60000).getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - weekday * 86400000);
}

export function weeklyCohorts(agents: A[], hasListing: Set<string>, paidIds: Set<string>, weeks = 8, now = new Date()) {
  const thisWeek = istWeekStart(now).getTime();
  return Array.from({ length: weeks }, (_, i) => {
    const start = thisWeek - i * 7 * 86400000;
    const cohort = agents.filter((a) => istWeekStart(a.createdAt).getTime() === start);
    return { weekStart: new Date(start), ...funnelOf(cohort, hasListing, paidIds) };
  });
}

/** Monthly-equivalent revenue from agents on a live paid plan (yearly counts as 1/12). */
export function monthlyRecurring(agents: A[], plans: PlansConfig, now = new Date()): number {
  return agents.reduce((sum, a) => {
    if (effectiveStatus(a.plan, now) !== "ACTIVE" || a.plan.id === "TRIAL") return sum;
    const def = plans.plans[a.plan.id];
    return sum + (a.plan.period === "YEARLY" ? def.priceYearly / 12 : def.priceMonthly);
  }, 0);
}

/** Approved payments per calendar month (IST), newest first. */
export function revenueByMonth(payments: Pick<PaymentRequestDoc, "status" | "amount" | "decidedAt" | "kind">[], months = 6, now = new Date()) {
  const key = (d: Date | string) => new Date(new Date(d).getTime() + 330 * 60000).toISOString().slice(0, 7);
  const out = new Map<string, { month: string; plans: number; boosts: number }>();
  const cursor = new Date(now.getTime() + 330 * 60000);
  for (let i = 0; i < months; i++) {
    const m = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1)).toISOString().slice(0, 7);
    out.set(m, { month: m, plans: 0, boosts: 0 });
  }
  for (const p of payments) {
    if (p.status !== "APPROVED" || !p.decidedAt) continue;
    const row = out.get(key(p.decidedAt));
    if (row) row[p.kind === "BOOST" ? "boosts" : "plans"] += p.amount;
  }
  return Array.from(out.values());
}
