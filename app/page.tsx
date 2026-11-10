import Link from "next/link";
import { Building, Map, Store, Warehouse, Trees, Home as HomeIcon } from "lucide-react";
import { getActiveProperties, getPlansConfig, marketplaceContacts } from "@/lib/firestore";
import { PROPERTY_TYPES } from "@/lib/constants";
import { BRAND } from "@/lib/brand";
import { HomeSearch } from "@/components/home/HomeSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Card } from "@/components/ui/card";
import { LandingHero } from "@/components/marketing/LandingHero";
import { Faq, Features, HowItWorks, PrivacyPromise } from "@/components/marketing/LandingSections";
import { Pricing } from "@/components/marketing/Pricing";

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
    <div className="flex flex-col w-full bg-cream-100">
      <LandingHero plans={plans} variant="home" />
      <HowItWorks />
      <Features />

      {/* Buyers: search and the latest listings, including agents' boosted ones. */}
      <section className="bg-white border-b border-[#E4DED2]">
        <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="section-title">Looking for a property?</h2>
            <p className="font-tamil text-navy-800">உங்களுக்கான இடத்தை தேர்வு செய்யுங்கள்</p>
            <p className="text-navy-600 text-sm">{BRAND.buyerTagline}</p>
          </div>
          <div className="w-full flex justify-center">
            <HomeSearch />
          </div>
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

          {properties.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end gap-4">
                <div>
                  <h3 className="font-display text-xl md:text-2xl font-semibold text-navy-900">Latest properties</h3>
                  <p className="section-subtitle">Listed on {BRAND.name}</p>
                </div>
                <Link href="/properties" className="text-gold-700 font-bold text-sm hover:text-gold-600 whitespace-nowrap">See all &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} contact={contacts[p.id]} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <PrivacyPromise />
      <Pricing plans={plans} />
      <Faq plans={plans} />
    </div>
  );
}
