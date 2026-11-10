import {
  CalendarClock, ChevronDown, FileCheck2, Languages, Lock, MessageSquare, Mic, Palette, Share2, ShieldCheck, Users, Wallet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { GRACE_DAYS } from "@/lib/plans";
import type { PlansConfig } from "@/types";

const STEPS = [
  {
    title: "Start your free trial",
    text: "Sign up with your phone number and email. Your page is ready straight away, in your agency's name.",
  },
  {
    title: "Add your properties",
    text: "Speak in Tamil or English, or paste the owner's WhatsApp message, and the form fills itself. Add photos from your phone.",
  },
  {
    title: "Share one link",
    text: "Send your page, or a single property, on WhatsApp. Clients see the photos and price, then call or WhatsApp you directly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-50 border-b border-[#E4DED2] scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl space-y-2">
          <h2 className="section-title">How it works</h2>
          <p className="text-navy-700">Three steps, all from your phone. No website to build, nothing to install.</p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-white rounded-card border border-[#E4DED2] p-6 space-y-3">
              <span className="w-10 h-10 rounded-full bg-gold-500 text-navy-900 font-display font-bold text-lg flex items-center justify-center">{i + 1}</span>
              <h3 className="font-bold text-lg text-navy-900">{s.title}</h3>
              <p className="text-sm text-navy-700 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Palette,
    title: "A page in your name",
    text: "Your photo, logo, tagline and RERA number on top, in one of 12 colours. Choose an easy link like /a/senthil-coimbatore.",
  },
  {
    icon: Share2,
    title: "Made for WhatsApp",
    text: "Every link opens with a photo preview. Download a QR poster and visiting card for your office, site boards and status.",
  },
  {
    icon: Mic,
    title: "Speak or paste a listing",
    text: "Say “5 cent plot in Vadavalli, 25 lakhs” or paste the owner's message. Price, size and place are filled in for you to check.",
  },
  {
    icon: MessageSquare,
    title: "Every enquiry in one place",
    text: "Enquiries from your page, calls and walk-ins in one list. Set follow-up dates, book site visits and keep notes.",
  },
  {
    icon: Users,
    title: "Buyers matched to listings",
    text: "Save what each buyer wants: area, type and budget. See which of your properties match, and send them in one tap.",
  },
  {
    icon: FileCheck2,
    title: "Title documents, kept private",
    text: "Track Patta, Chitta, EC, FMB sketch and seven more for each property, with copies attached. Only you can see them.",
  },
  {
    icon: CalendarClock,
    title: "Today's work on one screen",
    text: "Follow-ups and site visits due today wait on your first screen, with how many people viewed and enquired.",
  },
  {
    icon: Languages,
    title: "Tamil or English",
    text: "Use all your agent screens in Tamil or English, and write each property's description in either language.",
  },
];

export function Features() {
  return (
    <section className="bg-cream-100 border-b border-[#E4DED2]">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl space-y-2">
          <h2 className="section-title">Everything an agent needs, nothing extra</h2>
          <p className="text-navy-700">Built for property agents in Tamil Nadu, for how you already work: on the phone and on WhatsApp.</p>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-4 lg:flex-col lg:gap-3">
              <span className="w-11 h-11 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <h3 className="font-bold text-navy-900">{f.title}</h3>
                <p className="text-sm text-navy-700 leading-relaxed">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PrivacyPromise() {
  const points = [
    { icon: Lock, text: "Owner name, owner phone and survey number are never shown to buyers. They see your number and nobody else's." },
    { icon: MessageSquare, text: "Buyers call or WhatsApp you directly, and every enquiry comes to you. There is no middleman between you and your client." },
    { icon: Wallet, text: `If a plan ends, your page stays live for ${GRACE_DAYS} more days, and nothing is deleted. Pay and you carry on where you left off.` },
    { icon: ShieldCheck, text: "Download all your data whenever you like, or delete your account and your listings with it." },
  ];
  return (
    <section className="bg-navy-900 text-white">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20 grid md:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
        <div className="space-y-3">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-gold-50">Your clients stay yours</h2>
          <p className="text-navy-100">Your listings, your owners and your buyers belong to you. {BRAND.name} is a tool you pay for, not a portal that sells your leads.</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p.text} className="flex gap-3">
              <span className="w-9 h-9 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center shrink-0"><p.icon className="w-4 h-4" aria-hidden /></span>
              <span className="text-sm text-navy-100 leading-relaxed">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Faq({ plans }: { plans: PlansConfig }) {
  const items = [
    {
      q: "Do I need a website or any technical skill?",
      a: `No. If you can send a WhatsApp message, you can use ${BRAND.name}. Everything works from the browser on your phone.`,
    },
    {
      q: "Can buyers see the owner's phone number?",
      a: "No. Owner name, owner phone, survey number, private notes, title documents and sold prices are only for you.",
    },
    {
      q: "Does it work in Tamil?",
      a: "Yes. Switch your screens to தமிழ் from the menu, speak your listings in Tamil, and write descriptions in Tamil or English.",
    },
    {
      q: "What happens when the free trial ends?",
      a: `Choose Starter or Pro and pay by UPI. If you don't, your page stays live for ${GRACE_DAYS} more days and then pauses. Nothing is deleted, and your page comes back as soon as your payment is approved.`,
    },
    {
      q: "How do I pay?",
      a: "By UPI, from Plan & billing: scan the QR code, pay, and enter the 12-digit UTR from your UPI app. We check it and switch your plan on, usually within a few hours.",
    },
    {
      q: "Is there a contract or auto-debit?",
      a: "Neither. You pay for a month or a year at a time. If you don't renew, the plan simply ends.",
    },
    {
      q: "Can I change my link name?",
      a: "Yes, once, from Profile & branding. Links you have already shared keep working.",
    },
    {
      q: "Can I keep it on my phone like an app?",
      a: `Yes. Open ${BRAND.name} in Chrome, or Safari on iPhone, and add it to your home screen. It opens like an app, without the browser bar.`,
    },
    {
      q: "How many free trials can I take?",
      a: `One per mobile number: ${plans.trialDays} days with ${plans.plans.TRIAL.listingLimit} listings to try everything.`,
    },
  ];
  return (
    <section className="bg-white border-b border-[#E4DED2]">
      <div className="container mx-auto max-w-3xl px-4 py-14 md:py-20">
        <h2 className="section-title">Questions agents ask</h2>
        <div className="mt-8 divide-y divide-[#E4DED2] border-y border-[#E4DED2]">
          {items.map((it) => (
            <details key={it.q} className="group py-1">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                {it.q}
                <ChevronDown className="w-5 h-5 shrink-0 text-gold-600 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-sm text-navy-700 leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
