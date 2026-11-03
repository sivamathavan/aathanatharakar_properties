import Link from "next/link";
import { Share2, ShieldCheck, Smartphone, IndianRupee } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "About",
  description: `${BRAND.name} gives property agents in Tamil Nadu their own property page to share with clients.`,
};

const POINTS = [
  { icon: Share2, title: "One link per agent", text: "Every agent gets a page with all their listings, ready to send on WhatsApp or print as a QR code." },
  { icon: Smartphone, title: "Built for the phone", text: "Agents add listings, photos and follow up enquiries from their phone. Buyers browse on theirs." },
  { icon: ShieldCheck, title: "Owner details stay private", text: `Owner names, phone numbers and survey numbers are visible only to the agent who listed the property: not to other agents, and not to the ${BRAND.name} team.` },
  { icon: IndianRupee, title: "Simple pricing", text: "A free trial, then a small monthly or yearly plan paid by UPI. No commission on your deals." },
];

export default function AboutPage() {
  return (
    <div className="bg-[#F8F6F0]">
      <section className="bg-navy-900 text-white py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-gold-500">About {BRAND.name}</h1>
          <p className="text-lg text-gray-300">
            {BRAND.name} is a tool for property agents in Tamil Nadu. Most agents run their business on WhatsApp, sending the same photos and details again and again. We give each agent one page that holds every listing, so they can share a single link and spend their time on site visits instead.
          </p>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-8">
          {POINTS.map((p) => (
            <div key={p.title} className="flex gap-4">
              <span className="w-11 h-11 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0"><p.icon className="w-5 h-5" /></span>
              <div>
                <h2 className="font-bold text-navy-900">{p.title}</h2>
                <p className="text-sm text-navy-700 mt-1">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-card border border-[#E4DED2] p-6 space-y-3 text-sm text-navy-800">
          <h2 className="font-bold text-navy-900 text-lg">Who runs it</h2>
          <p>
            {BRAND.name} is built and run by{" "}
            <a href={BRAND.companyUrl} target="_blank" rel="noopener noreferrer" className="underline">{BRAND.company}</a>.
            {BRAND.supportEmail ? <> Write to us at <a href={`mailto:${BRAND.supportEmail}`} className="underline">{BRAND.supportEmail}</a>.</> : null}
          </p>
          <p>
            Each listing belongs to the agent who posted it, and enquiries go straight to that agent. {BRAND.name} takes no part in agents&apos; deals and charges no commission.
          </p>
          <p>
            {BRAND.name} also lists a few properties of its own on this site, always marked &ldquo;Listed by {BRAND.name}&rdquo;. Agents&apos; enquiries, clients and private details are never used for them.
          </p>
          <Link href="/register" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-semibold">Start your free trial</Link>
        </div>
      </section>
    </div>
  );
}
