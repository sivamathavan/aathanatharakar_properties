// Plan definitions and plan-state helpers. Pure: safe for client and server.
// Prices and limits can be overridden by the admin in config/plans.
import type { AgentPlan, BillingPeriod, PlanDef, PlanId, PlansConfig } from "@/types";

export const DEFAULT_PLANS: PlansConfig = {
  trialDays: 14,
  boostPricePerWeek: 149,
  plans: {
    TRIAL: {
      id: "TRIAL",
      name: "Free trial",
      priceMonthly: 0,
      priceYearly: 0,
      listingLimit: 5,
      photoLimit: 6,
      branding: false,
      viewStats: false,
      verifiedBadge: false,
      aiDraftsPerMonth: 10,
    },
    STARTER: {
      id: "STARTER",
      name: "Starter",
      priceMonthly: 299,
      priceYearly: 2999,
      listingLimit: 25,
      photoLimit: 10,
      branding: false,
      viewStats: false,
      verifiedBadge: false,
      aiDraftsPerMonth: 50,
    },
    PRO: {
      id: "PRO",
      name: "Pro",
      priceMonthly: 699,
      priceYearly: 6999,
      listingLimit: 100,
      photoLimit: 15,
      branding: true,
      viewStats: true,
      verifiedBadge: true,
      aiDraftsPerMonth: 300,
    },
  },
};

export const PAID_PLAN_IDS: PlanId[] = ["STARTER", "PRO"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function mergePlans(stored?: Partial<PlansConfig> | null): PlansConfig {
  if (!stored) return DEFAULT_PLANS;
  const plans = { ...DEFAULT_PLANS.plans };
  for (const id of Object.keys(plans) as PlanId[]) {
    plans[id] = { ...plans[id], ...(stored.plans?.[id] || {}), id };
  }
  return {
    trialDays: stored.trialDays ?? DEFAULT_PLANS.trialDays,
    boostPricePerWeek: stored.boostPricePerWeek ?? DEFAULT_PLANS.boostPricePerWeek,
    plans,
  };
}

/** True when the agent's page and listings should be live. */
export function isPlanLive(plan: AgentPlan | null | undefined, now = new Date()): boolean {
  if (!plan) return false;
  if (plan.status === "SUSPENDED") return false;
  return new Date(plan.expiresAt).getTime() > now.getTime();
}

export function daysLeft(plan: AgentPlan | null | undefined, now = new Date()): number {
  if (!plan) return 0;
  const ms = new Date(plan.expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
}

/** Status shown to people, derived from the stored status and the expiry date. */
export function effectiveStatus(plan: AgentPlan | null | undefined, now = new Date()) {
  if (!plan) return "EXPIRED" as const;
  if (plan.status === "SUSPENDED") return "SUSPENDED" as const;
  return isPlanLive(plan, now) ? plan.status : ("EXPIRED" as const);
}

export function planPrice(def: PlanDef, period: BillingPeriod): number {
  return period === "YEARLY" ? def.priceYearly : def.priceMonthly;
}

/**
 * New expiry after paying for a period. Paying early stacks on the current
 * expiry; paying after expiry starts from today.
 */
export function extendExpiry(currentExpiry: Date | null | undefined, period: BillingPeriod, now = new Date()): Date {
  const base = currentExpiry && new Date(currentExpiry).getTime() > now.getTime() ? new Date(currentExpiry) : new Date(now);
  return addMonthsUTC(base, period === "YEARLY" ? 12 : 1);
}

/** Calendar months, clamped to the month's last day (31 Oct + 1 month = 30 Nov, not 1 Dec). */
function addMonthsUTC(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export function trialPlan(trialDays: number, now = new Date()): AgentPlan {
  return { id: "TRIAL", status: "TRIAL", expiresAt: new Date(now.getTime() + trialDays * DAY_MS) };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

/** Lowercase, hyphenated, ASCII-only slug for share links. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const RESERVED_SLUGS = new Set(["admin", "api", "dashboard", "login", "register", "new", "edit", "for-agents", "properties"]);

/** Digits only, Indian numbers get a 91 prefix — the format wa.me expects. */
export function waNumber(phone: string | null | undefined): string {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
