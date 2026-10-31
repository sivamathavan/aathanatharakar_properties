import Link from "next/link";
import { Check, Share2, MessageSquare, Smartphone } from "lucide-react";
import { getPlansConfig } from "@/lib/firestore";
import { formatINR, PAID_PLAN_IDS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "For property agents — your own property page | DK Promoters",
  description: "Put all your listings on one link and share it with clients on WhatsApp. Free trial, then from ₹299 a month.",
};

export default async function ForAgentsPage() {
  const plans = await getPlansConfig();
  const paid = PAID_PLAN_IDS.map((id) => plans.plans[id]);

  return (
    <div className="bg-warm-cream">
      <section className="bg-navy-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl py-14 md:py-20 space-y-5">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-wider">For property agents in Tamil Nadu</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold max-w-3xl leading-tight">All your properties on one link. Send it on WhatsApp.</h1>
          <p className="text-gray-300 max-w-2xl">
            Add your plots, houses and rentals with photos. You get a page like <span className="font-mono text-gold-400">dkpromoters.in/a/your-name</span>. Clients call or WhatsApp you directly, and every enquiry lands in your inbox.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="h-12 px-6 rounded-btn bg-gold-500 text-navy-900 font-bold inline-flex items-center">Start {plans.trialDays}-day free trial</Link>
            <Link href="/login" className="h-12 px-6 rounded-btn border border-gold-500 text-gold-400 font-semibold inline-flex items-center">Agent login</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl py-12 grid md:grid-cols-3 gap-6">
        {[
          { icon: Smartphone, title: "Add from your phone", text: "Photos are resized for you. A listing takes two minutes." },
          { icon: Share2, title: "One link for everything", text: "Share your page, or one property, with a photo preview on WhatsApp." },
          { icon: MessageSquare, title: "Enquiries come to you", text: "Your number, your clients. Owner details stay private to you." },
        ].map((f) => (
          <div key={f.title} className="space-y-2">
            <f.icon className="w-6 h-6 text-gold-600" />
            <h2 className="font-bold text-navy-900">{f.title}</h2>
            <p className="text-sm text-navy-700">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="container mx-auto px-4 max-w-5xl pb-16 space-y-6">
        <h2 className="font-display text-2xl font-bold text-navy-900">Simple pricing</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-card border border-[#E8E0D0] p-5 space-y-2">
            <h3 className="font-bold text-navy-900">Free trial</h3>
            <p className="text-2xl font-bold text-navy-900">₹0</p>
            <p className="text-sm text-navy-700">{plans.trialDays} days · {plans.plans.TRIAL.listingLimit} listings · {plans.plans.TRIAL.photoLimit} photos each</p>
          </div>
          {paid.map((p) => (
            <div key={p.id} className={`bg-white rounded-card border p-5 space-y-2 ${p.id === "PRO" ? "border-gold-500 ring-1 ring-gold-500" : "border-[#E8E0D0]"}`}>
              <h3 className="font-bold text-navy-900">{p.name}</h3>
              <p className="text-2xl font-bold text-navy-900">{formatINR(p.priceMonthly)}<span className="text-sm font-normal text-navy-600"> / month</span></p>
              <p className="text-xs text-navy-600">or {formatINR(p.priceYearly)} / year</p>
              <ul className="text-sm text-navy-800 space-y-1 pt-1">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5" />{p.listingLimit} listings, {p.photoLimit} photos each</li>
                {p.viewStats && <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5" />Views on every listing</li>}
                {p.branding && <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5" />Your logo on your page</li>}
                {p.verifiedBadge && <li className="flex gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5" />Verified agent badge</li>}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm text-navy-700">
          Want more buyers? Boost any listing onto the DK Promoters website for {formatINR(plans.boostPricePerWeek)} a week. Pay by UPI.
        </p>
      </section>
    </div>
  );
}
