import Link from "next/link";
import { ArrowRight, MapPin, MessageSquare, Phone } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { formatINR } from "@/lib/plans";
import type { PlansConfig } from "@/types";
import { GetAppLink } from "@/components/app/GetAppLink";

/** The top of the agent landing page. "home" also points buyers to the listings. */
export function LandingHero({ plans, variant }: { plans: PlansConfig; variant: "home" | "agents" }) {
  const starter = plans.plans.STARTER.priceMonthly;
  // A real agent's page to show visitors what they get; set in apphosting.yaml.
  const sample = process.env.NEXT_PUBLIC_SAMPLE_AGENT_SLUG;

  return (
    <section className="relative bg-navy-900 text-white overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-900/30 via-transparent to-transparent" />
      <div className="relative container mx-auto max-w-6xl px-4 py-12 md:py-20 grid md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-14 items-center">
        <div className="space-y-5">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-wider">For property agents in Tamil Nadu</p>
          <h1 className="font-display text-[2rem] leading-[1.15] sm:text-5xl sm:leading-tight font-bold text-gold-50">
            {BRAND.tagline}, in your name.
          </h1>
          <p className="font-tamil text-lg text-gold-200">உங்கள் எல்லா சொத்துகளும் உங்கள் பெயரில் ஒரே லிங்க்கில். WhatsApp-ல் அனுப்புங்கள்.</p>
          <p className="text-base text-navy-100 max-w-xl">
            Stop forwarding twenty photos to every client. Add each property once, send one link on WhatsApp, and every
            enquiry comes straight to you, with follow-ups and site visits on one screen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link href="/register" className="h-12 px-6 rounded-btn bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold inline-flex items-center justify-center">
              Start free trial
            </Link>
            {sample ? (
              <Link href={`/a/${sample}`} className="h-12 px-6 rounded-btn border border-gold-500 text-gold-400 hover:bg-navy-800 font-semibold inline-flex items-center justify-center">
                See a sample page
              </Link>
            ) : variant === "agents" ? (
              <Link href="/login" className="h-12 px-6 rounded-btn border border-gold-500 text-gold-400 hover:bg-navy-800 font-semibold inline-flex items-center justify-center">
                Agent login
              </Link>
            ) : (
              <Link href="#how-it-works" className="h-12 px-6 rounded-btn border border-gold-500 text-gold-400 hover:bg-navy-800 font-semibold inline-flex items-center justify-center">
                See how it works
              </Link>
            )}
          </div>
          <p className="text-sm text-navy-200">
            {plans.trialDays} days free, then {formatINR(starter)} a month, about ₹{Math.round(starter / 30)} a day. No card needed.
          </p>
          {variant === "home" ? (
            <Link href="/properties" className="inline-flex items-center gap-2 min-h-10 text-sm font-semibold text-gold-400 underline underline-offset-4">
              Looking to buy or rent? Browse properties <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          ) : (
            <GetAppLink className="text-gold-400" />
          )}
        </div>
        <PhoneMock />
      </div>
    </section>
  );
}

const MOCK_LISTINGS = [
  { kind: "5 cent plot", place: "Vadavalli", price: "₹25,00,000", tag: "For sale", tone: "from-[#9DBB8A] to-[#46704F]" },
  { kind: "2 BHK house", place: "Saibaba Colony", price: "₹15,000 / month", tag: "For rent", tone: "from-[#D9B38C] to-[#9A6A45]" },
];

/** A drawing of an agent's page on a phone. Placeholder text only: no real agent or listing. */
function PhoneMock() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-[280px] md:max-w-[310px]">
      <div className="rounded-[2.25rem] border-[9px] border-navy-950 bg-navy-950 shadow-2xl ring-1 ring-white/10">
        <div className="rounded-[1.6rem] overflow-hidden bg-cream-100 text-navy-900">
          <div className="bg-[#5B1F2B] px-4 pt-6 pb-4 space-y-3 text-white">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-gold-400 text-[#5B1F2B] font-display font-bold text-lg flex items-center justify-center">Y</span>
              <span className="min-w-0">
                <span className="block font-display font-bold leading-tight">Your name</span>
                <span className="block text-xs text-gold-200">Your Realty · Coimbatore</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <span className="h-8 rounded-lg bg-[#25D366] text-white inline-flex items-center justify-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> WhatsApp</span>
              <span className="h-8 rounded-lg bg-gold-400 text-navy-900 inline-flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</span>
            </div>
          </div>
          <div className="p-3 space-y-2.5">
            {MOCK_LISTINGS.map((l) => (
              <div key={l.kind} className="bg-white rounded-xl overflow-hidden border border-[#E4DED2]">
                <div className={`h-16 bg-gradient-to-br ${l.tone} relative`}>
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide bg-gold-400 text-navy-900 px-1.5 py-0.5 rounded">{l.tag}</span>
                </div>
                <div className="px-2.5 py-2">
                  <span className="flex items-center gap-1 text-[10px] text-navy-600"><MapPin className="w-3 h-3" /> {l.place}, Coimbatore</span>
                  <span className="block text-xs font-semibold">{l.kind}</span>
                  <span className="block font-display font-bold text-sm">{l.price}</span>
                </div>
              </div>
            ))}
            <p className="text-center text-[10px] text-navy-600 pb-1">and every other property you add</p>
          </div>
        </div>
      </div>
    </div>
  );
}
