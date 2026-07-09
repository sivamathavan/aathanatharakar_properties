import { prisma } from "@/lib/prisma";
import { PropertyStatus } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Map, Store, Warehouse, Trees, Briefcase, Sparkles, ShieldCheck, Heart } from "lucide-react";
import { PROPERTY_TYPES, VENDOR_CATEGORIES } from "@/lib/constants";
import { HomeSearch } from "@/components/home/HomeSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AnimatedStats } from "@/components/home/AnimatedStats";
import { Testimonials } from "@/components/home/Testimonials";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Show up to 3 featured + newest active to fill 6 cards, deduped.
  const [featuredProperties, latestProperties] = await Promise.all([
    prisma.property.findMany({
      where: { status: PropertyStatus.ACTIVE, isFeatured: true },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { media: true },
    }),
    prisma.property.findMany({
      where: { status: PropertyStatus.ACTIVE },
      take: 9,
      orderBy: { createdAt: "desc" },
      include: { media: true },
    }),
  ]);

  const seen = new Set(featuredProperties.map((p) => p.id));
  const propertiesToShow = [
    ...featuredProperties,
    ...latestProperties.filter((p) => !seen.has(p.id)),
  ].slice(0, 6);

  const propertyTypeIcons: Record<string, React.ReactNode> = {
    APARTMENT: <Building className="w-8 h-8" />,
    VILLA: <Briefcase className="w-8 h-8" />, // fallback home
    HOUSE: <Briefcase className="w-8 h-8" />,
    PLOT: <Map className="w-8 h-8" />,
    COMMERCIAL: <Store className="w-8 h-8" />,
    WAREHOUSE: <Warehouse className="w-8 h-8" />,
    FARM_LAND: <Trees className="w-8 h-8" />,
    PG_HOSTEL: <Building className="w-8 h-8" />,
  };

  // Convert BigInt prices to numbers for components compatibility
  const serializedProperties = propertiesToShow.map(p => ({
    ...p,
    price: Number(p.price)
  }));

  return (
    <div className="flex flex-col w-full bg-[#FDF8E8]">
      {/* Hero Section (Theme B Deep Navy bg, min-h-100svh on mobile) */}
      <section className="relative w-full bg-navy-900 text-white min-h-[75vh] sm:min-h-[80vh] flex items-center justify-center py-16 md:py-24 px-4 overflow-hidden border-b border-navy-800">
        {/* Subtle decorative overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-900/10 via-transparent to-transparent z-0"></div>
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8">
          <div className="space-y-3">
            <span className="text-gold-500 font-sans font-bold text-xs md:text-sm uppercase tracking-widest block animate-fade-up">
              டிகே புரமோட்டர்ஸ்
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-tight tamil max-w-4xl text-gold-50 drop-shadow-md animate-fade-up-delay-1">
              உங்களுக்கான இடத்தை தேர்வு செய்யுங்கள்
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-sans font-medium text-gold-300 tracking-wide max-w-2xl mx-auto drop-shadow-sm animate-fade-up-delay-2">
              Find Your Dream Property in Tamil Nadu
            </p>
          </div>

          {/* Large Gold Divider */}
          <div className="gold-divider mx-auto my-1 animate-fade-up-delay-2" />

          {/* Search Bar Component */}
          <div className="w-full flex justify-center pt-4 md:pt-6 animate-fade-up-delay-3">
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* Stats Bar (PWA safe notch responsive layout) */}
      <AnimatedStats />

      {/* Property Types Quick Links */}
      <section className="py-16 bg-cream-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title mb-2">Explore Property Types</h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-8">Filter residential and agricultural assets across the region</p>
          
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {PROPERTY_TYPES.map((type) => (
              <Link key={type} href={`/properties?type=${type}`}>
                <Card className="hover:shadow-md hover:border-gold-400 hover:-translate-y-0.5 transition-all cursor-pointer border-[#E8E0D0] w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center bg-white group rounded-card">
                  <div className="text-navy-900 group-hover:text-gold-600 transition-colors mb-2">
                    {propertyTypeIcons[type] || <Building className="w-6 h-6 sm:w-8 sm:h-8" />}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-navy-800 text-center px-1 font-sans capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="section-title">Featured Properties</h2>
            <p className="section-subtitle">Handpicked luxury assets in top localities</p>
          </div>
          <Link href="/properties" className="text-gold-700 font-sans font-bold text-xs sm:text-sm hover:text-gold-600 flex items-center gap-1">
            View All Properties &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {serializedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Allied Services */}
      <section className="py-16 bg-cream-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="section-title">Find Trusted Professionals</h2>
            <p className="section-subtitle mx-auto">Get quotes from verified builders, interior designers, and service professionals across Tamil Nadu.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {VENDOR_CATEGORIES.map((cat) => (
              <Link key={cat} href={`/services?category=${cat}`}>
                <Card className="p-4 text-center hover:border-gold-400 hover:shadow-xs transition-all group cursor-pointer h-full flex flex-col items-center justify-center bg-white rounded-card border-[#E8E0D0]">
                  <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-navy-900 mb-2 group-hover:scale-105 transition-transform" />
                  <span className="font-semibold text-xs text-navy-800 capitalize">{cat.replace(/_/g, ' ').toLowerCase()}</span>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/services">
              <Button className="btn-secondary h-11 text-xs">
                Browse All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-navy-900 text-white text-center border-t border-navy-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-gold-900/10 via-transparent to-transparent z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10 space-y-5">
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-gold-100 leading-snug">Want to sell or rent your property?</h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-sans leading-relaxed">
            List your residential, plot, or farm land assets with DK Promoters and reach genuine buyers across Tamil Nadu. Contact us directly — we handle everything.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916381169124").replace(/\D/g, "")}?text=${encodeURIComponent("Hi DK Promoters, I want to list my property. Please guide me.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="btn-primary h-12 text-sm px-8 shadow-lg font-bold w-full sm:w-auto">
                💬 WhatsApp Us to List
              </Button>
            </a>
            <a href="tel:+916381169124">
              <Button size="lg" variant="outline" className="h-12 text-sm px-8 font-bold border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-navy-900 w-full sm:w-auto">
                📞 Call +91 63811 69124
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
