import { BRAND } from "@/lib/brand";
import { Check } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getPaymentRequests, getSiteConfig } from "@/lib/firestore";
import { daysLeft, effectiveStatus, formatINR, PAID_PLAN_IDS } from "@/lib/plans";
import { PaymentRequestForm } from "@/components/dashboard/PaymentRequestForm";
import type { PlanDef } from "@/types";
import type { TFunc } from "@/lib/i18n";
import { serverT } from "@/lib/i18n/server";
import { SupportLinks } from "@/components/support/SupportLinks";
import { ST } from "@/components/ui/stack-table";

export const metadata = { title: "Plan & billing" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Not found — please contact us" };
const STATUS_STYLE: Record<string, string> = { PENDING: "bg-amber-100 text-amber-900", APPROVED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800" };

function features(p: PlanDef, t: TFunc) {
  return [
    t("{n} listings", { n: p.listingLimit }),
    t("{n} photos per listing", { n: p.photoLimit }),
    t("{n} spoken or pasted listings a month", { n: p.aiDraftsPerMonth }),
    t("Your page with your logo and colours"),
    t("Poster, visiting card and WhatsApp previews"),
    t("Enquiries, follow-ups and buyer matching"),
    ...(p.viewStats ? [t("WhatsApp and call taps, 30-day chart")] : []),
    ...(p.branding ? [t("Cover photo, brochure PDF, no {brand} footer", { brand: BRAND.name })] : []),
    ...(p.verifiedBadge ? [t("Verified agent badge")] : []),
  ];
}

export default async function BillingPage() {
  const { agent, plans, limits } = await requireAgentPage();
  const t = serverT();
  const [site, history] = await Promise.all([getSiteConfig(), getPaymentRequests({ agentId: agent.id })]);
  const status = effectiveStatus(agent.plan);
  const paid = PAID_PLAN_IDS.map((id) => plans.plans[id]);
  const onTrial = agent.plan.id === "TRIAL";
  const trial = plans.plans.TRIAL;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Plan & billing")}</h1>
        <p className="text-sm text-navy-700">
          {status === "EXPIRED"
            ? t("Your plan has ended. Your listings are saved; pay below to bring your page back.")
            : status === "SUSPENDED"
            ? t("Your account is paused. Please contact {brand} support.", { brand: BRAND.name })
            : t("You're on {plan}. {n} days left (until {date}).", { plan: limits.name, n: daysLeft(agent.plan), date: new Date(agent.plan.expiresAt).toLocaleDateString("en-IN") })}
        </p>
      </div>

      <div className={`grid gap-4 ${onTrial ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
        {onTrial && (
          <div className="bg-white rounded-card border border-gold-500 ring-1 ring-gold-500 p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-navy-900">{trial.name}</h2>
              <span className="text-xs font-bold text-gold-700">{t("Current plan")}</span>
            </div>
            <p className="text-2xl font-bold text-navy-900">{formatINR(0)}</p>
            <p className="text-xs text-navy-600">
              {status === "EXPIRED" ? t("Your plan has ended.") : t("{n} days left (until {date}).", { n: daysLeft(agent.plan), date: new Date(agent.plan.expiresAt).toLocaleDateString("en-IN") })}
            </p>
            <ul className="space-y-1.5 text-sm text-navy-800">
              {features(trial, t).map((f) => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
          </div>
        )}
        {paid.map((p) => (
          <div key={p.id} className={`bg-white rounded-card border p-5 space-y-3 ${agent.plan.id === p.id ? "border-gold-500 ring-1 ring-gold-500" : "border-[#E4DED2]"}`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-navy-900">{p.name}</h2>
              {agent.plan.id === p.id && <span className="text-xs font-bold text-gold-700">{t("Current plan")}</span>}
            </div>
            <p className="text-2xl font-bold text-navy-900">
              {formatINR(p.priceMonthly)}<span className="text-sm font-normal text-navy-600"> / {t("month")}</span>
            </p>
            <p className="text-xs text-navy-600">{t("or {price} / year", { price: formatINR(p.priceYearly) })}</p>
            <ul className="space-y-1.5 text-sm text-navy-800">
              {features(p, t).map((f) => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {status !== "SUSPENDED" && (
        <div className="bg-white rounded-card border border-[#E4DED2] p-5 max-w-xl space-y-3">
          <h2 className="text-lg font-bold text-navy-900">{t("Pay for a plan")}</h2>
          <p className="text-sm text-navy-700">{t("Paying before your plan ends adds the time on top. Nothing is lost.")}</p>
          <PaymentRequestForm kind="PLAN" upi={{ id: site.upiId, name: site.upiName }} plans={paid} initialPlanId={agent.plan.id === "PRO" ? "PRO" : "STARTER"} />
        </div>
      )}

      <div className="bg-white rounded-card border border-[#E4DED2] p-5">
        <h2 className="text-lg font-bold text-navy-900 mb-3">{t("Payment history")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-navy-600">{t("No payments yet.")}</p>
        ) : (
          <table className={ST.table}>
            <thead className={ST.thead}>
              <tr className="text-left text-xs uppercase text-navy-600">
                <th className="py-2 pr-4">{t("Date")}</th><th className="py-2 pr-4">{t("For")}</th><th className="py-2 pr-4">{t("Amount")}</th><th className="py-2 pr-4">UTR</th><th className="py-2">{t("Status")}</th>
              </tr>
            </thead>
            <tbody className={ST.tbody}>
              {history.map((h) => (
                <tr key={h.id} className={ST.tr}>
                  <td className={`${ST.td} md:py-2 md:pr-4 whitespace-nowrap`}>{new Date(h.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className={`${ST.td} md:py-2 md:pr-4`}>{h.kind === "PLAN" ? `${plans.plans[h.planId!]?.name || h.planId} · ${h.period === "YEARLY" ? t("1 year") : t("1 month")}` : `${t("Boost")} ${h.weeks}w · ${h.propertyTitle}`}</td>
                  <td className={`${ST.td} md:py-2 md:pr-4 whitespace-nowrap font-semibold md:font-normal`}>{formatINR(h.amount)}</td>
                  <td className={`${ST.td} md:py-2 md:pr-4 font-mono text-xs`}><span className={ST.label}>UTR</span>{h.utr}</td>
                  <td className={`${ST.td} order-first w-full md:w-auto md:py-2 whitespace-nowrap`}>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-pill ${STATUS_STYLE[h.status] || ""}`}>{t(STATUS[h.status])}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-2">
        <h2 className="text-lg font-bold text-navy-900">{t("Questions about paying?")}</h2>
        <p className="text-sm text-navy-700">{t("We check UPI payments by the UTR number, usually within a few hours.")}</p>
        <SupportLinks message={`Hi ${BRAND.name} team, I'm ${agent.displayName} (${agent.email}). About my payment:`} />
      </div>
    </div>
  );
}
