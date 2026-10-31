import { Check } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getPaymentRequests, getSiteConfig } from "@/lib/firestore";
import { daysLeft, effectiveStatus, formatINR, PAID_PLAN_IDS } from "@/lib/plans";
import { PaymentRequestForm } from "@/components/dashboard/PaymentRequestForm";
import type { PlanDef } from "@/types";

export const metadata = { title: "Plan & billing | DK Promoters" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Not found — call us" };

function features(p: PlanDef) {
  return [
    `${p.listingLimit} listings`,
    `${p.photoLimit} photos per listing`,
    "Your own page link to share",
    "Enquiries straight to your WhatsApp",
    ...(p.viewStats ? ["See views on every listing"] : []),
    ...(p.branding ? ["Your logo on your page"] : []),
    ...(p.verifiedBadge ? ["Verified agent badge"] : []),
  ];
}

export default async function BillingPage() {
  const { agent, plans, limits } = await requireAgentPage();
  const [site, history] = await Promise.all([getSiteConfig(), getPaymentRequests({ agentId: agent.id })]);
  const status = effectiveStatus(agent.plan);
  const paid = PAID_PLAN_IDS.map((id) => plans.plans[id]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Plan &amp; billing</h1>
        <p className="text-sm text-navy-700">
          {status === "EXPIRED"
            ? "Your plan has ended. Your listings are saved; pay below to bring your page back."
            : status === "SUSPENDED"
            ? "Your account is paused. Please contact DK Promoters."
            : `You're on ${limits.name}. ${daysLeft(agent.plan)} days left (until ${new Date(agent.plan.expiresAt).toLocaleDateString("en-IN")}).`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {paid.map((p) => (
          <div key={p.id} className={`bg-white rounded-card border p-5 space-y-3 ${agent.plan.id === p.id ? "border-gold-500 ring-1 ring-gold-500" : "border-[#E8E0D0]"}`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-navy-900">{p.name}</h2>
              {agent.plan.id === p.id && <span className="text-xs font-bold text-gold-700">Current plan</span>}
            </div>
            <p className="text-2xl font-bold text-navy-900">
              {formatINR(p.priceMonthly)}<span className="text-sm font-normal text-navy-600"> / month</span>
            </p>
            <p className="text-xs text-navy-600">or {formatINR(p.priceYearly)} / year</p>
            <ul className="space-y-1.5 text-sm text-navy-800">
              {features(p).map((f) => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {status !== "SUSPENDED" && (
        <div className="bg-white rounded-card border border-[#E8E0D0] p-5 max-w-xl space-y-3">
          <h2 className="text-lg font-bold text-navy-900">Pay for a plan</h2>
          <p className="text-sm text-navy-700">Paying before your plan ends adds the time on top. Nothing is lost.</p>
          <PaymentRequestForm kind="PLAN" upi={{ id: site.upiId, name: site.upiName }} plans={paid} initialPlanId={agent.plan.id === "PRO" ? "PRO" : "STARTER"} />
        </div>
      )}

      <div className="bg-white rounded-card border border-[#E8E0D0] p-5">
        <h2 className="text-lg font-bold text-navy-900 mb-3">Payment history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-navy-600">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-navy-600">
                  <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">For</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">UTR</th><th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-[#E8E0D0]">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="py-2 pr-4">{h.kind === "PLAN" ? `${plans.plans[h.planId!]?.name || h.planId} · ${h.period === "YEARLY" ? "1 year" : "1 month"}` : `Boost ${h.weeks}w · ${h.propertyTitle}`}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatINR(h.amount)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{h.utr}</td>
                    <td className="py-2 whitespace-nowrap">{STATUS[h.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
