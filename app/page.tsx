import Link from "next/link";
import { Building, Map, Store, Warehouse, Trees, Home as HomeIcon, Share2, MessageSquare, Smartphone } from "lucide-react";
import { getActiveProperties, getPlansConfig, marketplaceContacts } from "@/lib/firestore";
import { PROPERTY_TYPES } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import { formatINR } from "@/lib/plans";
import { HomeSearch } from "@/components/home/HomeSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, React.ReactNode> = {
  APARTMENT: <Building className="w-8 h-8" />,
  VILLA: <HomeIcon className="w-8 h-8" />,
  HOUSE: <HomeIcon className="w-8 h-8" />,
  PLOT: <Map className="w-8 h-8" />,
  COMMERCIAL: <Store className="w-8 h-8" />,
  WAREHOUSE: <Warehouse className="w-8 h-8" />,
  FARM_LAND: <Trees className="w-8 h-8" />,
  PG_HOSTEL: <Building className="w-8 h-8" />,
};

export default async function HomePage() {
  const [featured, latest, plans] = await Promise.all([
    getActiveProperties({ limit: 3, featured: true }),
    getActiveProperties({ limit: 9 }),
    getPlansConfig(),
  ]);
  const seen = new Set(featured.properties.map((p) => p.id));
  const properties = [...featured.properties, ...latest.properties.filter((p) => !seen.has(p.id))].slice(0, 6);
  const contacts = await marketplaceContacts(properties);

  return (
    <div className="flex flex-col w-full bg-[#F8F6F0]">
      <section className="relative w-full bg-navy-900 text-white py-16 md:py-24 px-4 overflow-hidden border-b border-navy-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-900/20 via-transparent to-transparent" />
        <div className="container mx-auto max-w-5xl relative flex flex-col items-center text-center space-y-6 md:space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight leading-tight tamil max-w-4xl text-gold-50">
              உங்களுக்கான இடத்தை தேர்வு செய்யுங்கள்
            </h1>
            <p className="text-base md:text-xl font-medium text-gold-300 max-w-2xl mx-auto">{BRAND.buyerTagline}</p>
          </div>
          <div className="w-full flex justify-center pt-2">
            <HomeSearch />
          </div>
        </div>
      </section>

      <section className="py-14 bg-cream-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title mb-2">Explore by type</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">Plots, farm land, houses and rentals across Tamil Nadu</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {PROPERTY_TYPES.map((type) => (
              <Link key={type} href={`/properties?type=${type}`}>
                <Card className="hover:shadow-md hover:border-gold-400 transition-all cursor-pointer border-[#E4DED2] w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center bg-white group rounded-card">
                  <div className="text-navy-900 group-hover:text-gold-600 mb-2">{TYPE_ICON[type]}</div>
                  <span className="text-[10px] sm:text-xs font-bold text-navy-800 capitalize">{type.replace("_", " ").toLowerCase()}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {properties.length > 0 && (
        <section className="py-14 container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="section-title">Latest properties</h2>
              <p className="section-subtitle">Listed by agents on {BRAND.name}</p>
            </div>
            <Link href="/properties" className="text-gold-700 font-bold text-sm hover:text-gold-600 whitespace-nowrap">See all &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} contact={contacts[p.id]} />
            ))}
          </div>
        </section>
      )}

      <section className="py-16 bg-navy-900 text-white border-t border-navy-800">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-wider">For property agents</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white leading-snug">{BRAND.tagline}. Share it on WhatsApp.</h2>
            <p className="text-sm text-gray-300 max-w-md">
              Add your plots, houses and rentals with photos and get your own page. Clients call or WhatsApp you directly. Free for {plans.trialDays} days, then from {formatINR(plans.plans.STARTER.priceMonthly)} a month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link href="/register" className="h-12 px-6 rounded-btn bg-gold-500 text-navy-900 font-bold inline-flex items-center justify-center">Start free trial</Link>
              <Link href="/for-agents" className="h-12 px-6 rounded-btn border border-gold-500 text-gold-400 font-semibold inline-flex items-center justify-center">How it works</Link>
            </div>
          </div>
          <ul className="space-y-5">
            {[
              { icon: Smartphone, title: "Add from your phone", text: "Photos are resized for you. A listing takes two minutes." },
              { icon: Share2, title: "One link for everything", text: "Your page, or one property, with a photo preview on WhatsApp." },
              { icon: MessageSquare, title: "Enquiries come to you", text: "Your number, your clients. Owner details stay private." },
            ].map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="w-10 h-10 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center shrink-0"><f.icon className="w-5 h-5" /></span>
                <span>
                  <span className="block font-semibold">{f.title}</span>
                  <span className="block text-sm text-gray-300">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
