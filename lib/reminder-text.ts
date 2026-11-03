// Pure: safe for client and server.
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import { formatINR, GRACE_DAYS } from "@/lib/plans";
import { istDayKey, istDaysFromToday } from "@/lib/dates";
import type { AgentPlan } from "@/types";

/** Text for the admin's one-tap WhatsApp reminder to an agent whose plan is ending. */
export function renewalWhatsappText(name: string, expiresAt: Date | string, price: number, now = new Date()): string {
  const days = istDaysFromToday(expiresAt, now);
  const pauses = new Date(new Date(expiresAt).getTime() + GRACE_DAYS * 86400000).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const when = days < 0 ? (days > -GRACE_DAYS ? `has ended and your page pauses on ${pauses}` : "has ended") : days === 0 ? "ends today" : `ends in ${days} day${days === 1 ? "" : "s"}`;
  return `Hi ${name}, your ${BRAND.name} plan ${when}. Renew for ${formatINR(price)} by UPI at ${SITE_URL}/dashboard/billing so your page stays live. Thank you!`;
}

/** Days before the end date (7, 3, 1, 0) and during the grace days (-1: ended yesterday, -6: page pauses tomorrow). */
export const REMINDER_DAYS = [7, 3, 1, 0, -1, -(GRACE_DAYS - 1)];

/**
 * Which plan reminder (if any) is due today. Returns a key like "2026-11-15:3"
 * (expiry day : days left) that is stored after sending, so each goes once.
 */
export function planReminderDue(plan: AgentPlan, lastKey: string | null | undefined, now = new Date()): { key: string; daysLeft: number } | null {
  if (plan.status === "SUSPENDED") return null;
  const daysLeft = istDaysFromToday(plan.expiresAt, now);
  if (!REMINDER_DAYS.includes(daysLeft)) return null;
  const key = `${istDayKey(plan.expiresAt)}:${daysLeft}`;
  return key === lastKey ? null : { key, daysLeft };
}
