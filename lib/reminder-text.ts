// Pure: safe for client and server.
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import { formatINR } from "@/lib/plans";
import { istDaysFromToday } from "@/lib/dates";

/** Text for the admin's one-tap WhatsApp reminder to an agent whose plan is ending. */
export function renewalWhatsappText(name: string, expiresAt: Date | string, price: number, now = new Date()): string {
  const days = istDaysFromToday(expiresAt, now);
  const when = days < 0 ? "has ended" : days === 0 ? "ends today" : `ends in ${days} day${days === 1 ? "" : "s"}`;
  return `Hi ${name}, your ${BRAND.name} plan ${when}. Renew for ${formatINR(price)} by UPI at ${SITE_URL}/dashboard/billing so your page stays live. Thank you!`;
}
