import Link from "next/link";
import { Check } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { formatINR, PAID_PLAN_IDS } from "@/lib/plans";
import type { PlanDef, PlansConfig } from "@/types";

function features(p: PlanDef): string[] {
  return [
    `${p.listingLimit} listings, ${p.photoLimit} photos each`,
    `Speak or paste ${p.aiDraftsPerMonth} listings a month`,
    "Your page with your logo and colours",
    "QR poster, visiting card and WhatsApp previews",
    "Enquiries, follow-ups, site visits and buyer matching",
    "Title documents checklist",
    "Views and enquiries on every listing",
    ...(p.viewStats ? ["WhatsApp and call taps, 30-day chart"] : []),
    ...(p.branding ? [`Cover photo, brochure PDF, no ${BRAND.name} footer`] : []),
    ...(p.verifiedBadge ? ["Verified agent badge"] : []),
  ];
}

/** Plans straight from the admin's settings, so the page always shows the real prices. */
export function Pricing({ plans }: { plans: PlansConfig }) {
  const trial = plans.plans.TRIAL;
  const paid = PAID_PLAN_IDS.map((id) => plans.plans[id]);

  return (
    <section id="pricing" className="bg-cream-50 border-b border-[#E4DED2] scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl space-y-2">
          <h2 className="section-title">Simple pricing</h2>
          <p className="text-navy-700">Start free. Pay by UPI when you are ready: no card, no contract, no auto-debit.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 items-start">
          <div className="bg-white rounded-card border border-[#E4DED2] p-6 space-y-3">
            <h3 className="font-bold text-lg text-navy-900">{trial.name}</h3>
            <p className="font-display text-3xl font-bold text-navy-900">₹0</p>
            <p className="text-sm text-navy-600">{plans.trialDays} days to try everything. No card needed.</p>
            <ul className="text-sm text-navy-800 space-y-2 pt-1">
              {[`${trial.listingLimit} listings, ${trial.photoLimit} photos each`, `Speak or paste ${trial.aiDraftsPerMonth} listings a month`, "All Starter features"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" aria-hidden />{f}</li>
              ))}
            </ul>
          </div>

          {paid.map((p) => {
            const saving = p.priceMonthly * 12 - p.priceYearly;
            const highlight = p.id === "PRO";
            return (
              <div key={p.id} className={`bg-white rounded-card p-6 space-y-3 ${highlight ? "border-2 border-gold-500 shadow-md" : "border border-[#E4DED2]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-lg text-navy-900">{p.name}</h3>
                  {highlight && <span className="text-[11px] font-bold uppercase tracking-wide bg-gold-100 text-gold-800 px-2 py-0.5 rounded-pill">Everything</span>}
                </div>
                <p className="font-display text-3xl font-bold text-navy-900">
                  {formatINR(p.priceMonthly)}<span className="font-sans text-sm font-normal text-navy-600"> / month</span>
                </p>
                <p className="text-sm text-navy-600">
                  or {formatINR(p.priceYearly)} a year{saving > 0 ? `, saving ${formatINR(saving)}` : ""}
                </p>
                <ul className="text-sm text-navy-800 space-y-2 pt-1">
                  {features(p).map((f) => (
                    <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" aria-hidden />{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 md:justify-between bg-white rounded-card border border-[#E4DED2] p-5">
          <p className="text-sm text-navy-700 max-w-2xl">
            Every plan starts with the free trial; choose Starter or Pro from Plan &amp; billing whenever you are ready.
            Want more buyers? Boost any listing onto the {BRAND.name} home page and search for {formatINR(plans.boostPricePerWeek)} a week.
          </p>
          <Link href="/register" className="h-12 px-6 rounded-btn bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold inline-flex items-center justify-center shrink-0">
            Start free trial
          </Link>
        </div>
      </div>
    </section>
  );
}
