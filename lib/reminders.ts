// Daily emails: plan/trial ending reminders and the follow-up digest.
// Run once a day by Cloud Scheduler calling /api/cron/daily. Server only.
import { agentsCol, leadsCol, docToTyped } from "@/lib/firestore";
import { effectiveStatus } from "@/lib/plans";
import { istDayKey, istDayStart, istDaysFromToday, istTime } from "@/lib/dates";
import { makeT, parseLang } from "@/lib/i18n";
import { sendEmail, escapeHtml } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";
import { BRAND } from "@/lib/brand";
import type { AgentDoc, AgentPlan, LeadDoc } from "@/types";

export const REMINDER_DAYS = [7, 3, 1, 0];

/**
 * Which plan reminder (if any) is due today. Returns a key like "2026-11-15:3"
 * (expiry day : days left) that is stored after sending, so each goes once.
 * -1 means "ended yesterday" (one last nudge).
 */
export function planReminderDue(plan: AgentPlan, lastKey: string | null | undefined, now = new Date()): { key: string; daysLeft: number } | null {
  if (plan.status === "SUSPENDED") return null;
  const daysLeft = istDaysFromToday(plan.expiresAt, now);
  if (!REMINDER_DAYS.includes(daysLeft) && daysLeft !== -1) return null;
  const key = `${istDayKey(plan.expiresAt)}:${daysLeft}`;
  return key === lastKey ? null : { key, daysLeft };
}

const OPEN = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION"];

function layout(body: string) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0C2B29;max-width:560px">${body}<p style="color:#555;font-size:12px;margin-top:24px">${escapeHtml(BRAND.name)} · ${escapeHtml(SITE_URL)}</p></div>`;
}
const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#0C2B29;color:#E39614;padding:12px 18px;border-radius:8px;font-weight:bold;text-decoration:none">${escapeHtml(label)}</a></p>`;

export async function runDailyReminders({ now = new Date(), send = true } = {}) {
  const today = istDayKey(now);
  const summary = { planReminders: 0, digests: 0, adminDigest: false, skipped: 0 };
  const agents = (await agentsCol().get()).docs.map((d) => docToTyped<AgentDoc>(d)!);

  // 1. Plan / trial ending
  for (const agent of agents) {
    const due = planReminderDue(agent.plan, agent.lastReminderKey, now);
    if (!due) continue;
    const t = makeT(parseLang(agent.uiLang));
    const trial = agent.plan.status === "TRIAL" || agent.plan.id === "TRIAL";
    const when = due.daysLeft === -1 ? t("ended yesterday") : due.daysLeft === 0 ? t("ends today") : t("ends in {n} days", { n: due.daysLeft });
    const subject = `${trial ? t("Your free trial") : t("Your plan")} ${when} — ${BRAND.name}`;
    const html = layout(
      `<p>${escapeHtml(t("Hi {name},", { name: agent.displayName }))}</p>` +
        `<p>${escapeHtml(trial ? t("Your free trial {when}.", { when }) : t("Your plan {when}.", { when }))} ${escapeHtml(t("When it ends your page is paused, but your listings and enquiries are kept."))}</p>` +
        `<p>${escapeHtml(t("Renew by UPI in a minute: pay, enter the UTR number, and we switch it on."))}</p>` +
        button(`${SITE_URL}/dashboard/billing`, t("Renew my plan"))
    );
    if (send) {
      await sendEmail({ to: agent.email, subject, html });
      await agentsCol().doc(agent.id).update({ lastReminderKey: due.key });
    }
    summary.planReminders++;
  }

  // 2. Follow-ups due and site visits today, one email per person
  const end = istDayStart(now, 1);
  const [followSnap, visitSnap] = await Promise.all([
    leadsCol().where("nextFollowUpAt", "<", end).limit(5000).get(),
    leadsCol().where("siteVisitDate", ">=", istDayStart(now)).where("siteVisitDate", "<", end).limit(2000).get(),
  ]);
  const byOwner = new Map<string, { follow: LeadDoc[]; visits: LeadDoc[] }>();
  const add = (l: LeadDoc, kind: "follow" | "visits") => {
    const entry = byOwner.get(l.ownerId) || { follow: [], visits: [] };
    entry[kind].push(l);
    byOwner.set(l.ownerId, entry);
  };
  followSnap.docs.map((d) => docToTyped<LeadDoc>(d)!).filter((l) => OPEN.includes(l.status)).forEach((l) => add(l, "follow"));
  visitSnap.docs.map((d) => docToTyped<LeadDoc>(d)!).filter((l) => l.status !== "LOST").forEach((l) => add(l, "visits"));

  const agentById = new Map(agents.map((a) => [a.id, a]));
  for (const [ownerId, { follow, visits }] of Array.from(byOwner.entries())) {
    const agent = agentById.get(ownerId);
    const live = agent && ["TRIAL", "ACTIVE"].includes(effectiveStatus(agent.plan, now));
    const to = agent ? (live && agent.lastDigestDate !== today ? agent.email : null) : follow[0]?.ownerType === "ADMIN" || visits[0]?.ownerType === "ADMIN" ? process.env.ADMIN_EMAIL || null : null;
    if (!to) {
      summary.skipped++;
      continue;
    }
    const t = makeT(parseLang(agent?.uiLang));
    const rows = [
      ...visits.map((l) => `<li><strong>${escapeHtml(t("Site visit"))} ${escapeHtml(istTime(l.siteVisitDate!))}</strong>: ${escapeHtml(l.name)}, ${escapeHtml(l.phone)}${l.propertyTitle ? ` — ${escapeHtml(l.propertyTitle)}` : ""}</li>`),
      ...follow.map((l) => `<li>${escapeHtml(istDaysFromToday(l.nextFollowUpAt!, now) < 0 ? t("Overdue") : t("Today"))}: ${escapeHtml(l.name)}, ${escapeHtml(l.phone)}${l.propertyTitle ? ` — ${escapeHtml(l.propertyTitle)}` : ""}</li>`),
    ];
    const html = layout(
      `<p>${escapeHtml(t("Good morning! Today you have:"))}</p><ul>${rows.join("")}</ul>` +
        button(`${SITE_URL}${agent ? "/dashboard/enquiries?view=today" : "/admin/leads"}`, t("Open today's list"))
    );
    if (send) {
      await sendEmail({ to, subject: t("{n} follow-ups and visits today", { n: rows.length }), html });
      if (agent) await agentsCol().doc(agent.id).update({ lastDigestDate: today });
    }
    if (agent) summary.digests++;
    else summary.adminDigest = true;
  }
  return summary;
}
