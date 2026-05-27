import { prisma } from "@/lib/prisma";
import { PropertyStatus } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { TN_CITIES, PROPERTY_TYPES, LISTING_TYPES } from "@/lib/constants";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MobileFilterDrawer } from "@/components/property/MobileFilterDrawer";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const type = typeof searchParams.type === 'string' ? searchParams.type : undefined;
  const listingType = typeof searchParams.listingType === 'string' ? searchParams.listingType : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

  const whereClause: any = {
    status: PropertyStatus.ACTIVE,
  };

  if (city) whereClause.city = city;
  if (type) whereClause.type = type;
  if (listingType) whereClause.listingType = listingType;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price_desc") {
    orderBy = { price: "desc" };
  }

  const properties = await prisma.property.findMany({
    where: whereClause,
    orderBy: orderBy,
    include: { media: true },
    take: 24,
  });

  const getSortUrl = (sortValue: string | undefined) => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (listingType) params.set("listingType", listingType);
    if (sortValue) params.set("sort", sortValue);
    return `/properties?${params.toString()}`;
  };

  // Convert BigInt to Number for safe serialization over client components boundary
  const serializedProperties = properties.map((property) => ({
    ...property,
    price: Number(property.price),
  }));

  return (
    <div className="min-h-screen bg-warm-cream py-6 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-6 md:mb-8 border-b border-[#E8E0D0] pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-900 leading-tight">
                Available Properties
              </h1>
              <p className="text-sm font-sans text-navy-700 mt-1">
                {serializedProperties.length === 0 
                  ? "No matching listings found" 
                  : `Showing ${serializedProperties.length} verified listings in Tamil Nadu`
                }
              </p>
            </div>
            
            {/* Desktop Map Button / View */}
            <div className="hidden md:flex gap-2">
              <Link href="/properties">
                <Button variant="outline" className="border-[#E8E0D0] hover:bg-navy-50 text-navy-800 font-sans">
                  Clear Filters
                </Button>
              </Link>
            </div>
          </div>

          {/* Horizontally scrollable sort chips */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 flex items-center gap-1 font-sans">
              <ArrowUpDown className="w-3 h-3 text-gold-500" /> Sort by
            </p>
            <div className="w-full overflow-x-auto scrollbar-hide flex gap-2 py-1 scroll-snap-x snap-mandatory">
              <Link 
                href={getSortUrl(undefined)}
                className={`snap-align-start shrink-0 px-4 py-2 text-xs font-sans font-medium rounded-pill border transition-all duration-200 ${
                  !sort 
                    ? "bg-gold-500 text-navy-900 border-gold-500 shadow-sm"
                    : "bg-white text-navy-700 border-[#E8E0D0] hover:bg-navy-50"
                }`}
              >
                Latest Listings
              </Link>
              <Link 
                href={getSortUrl("price_asc")}
                className={`snap-align-start shrink-0 px-4 py-2 text-xs font-sans font-medium rounded-pill border transition-all duration-200 ${
                  sort === "price_asc"
                    ? "bg-gold-500 text-navy-900 border-gold-500 shadow-sm"
                    : "bg-white text-navy-700 border-[#E8E0D0] hover:bg-navy-50"
                }`}
              >
                Price: Low to High
              </Link>
              <Link 
                href={getSortUrl("price_desc")}
                className={`snap-align-start shrink-0 px-4 py-2 text-xs font-sans font-medium rounded-pill border transition-all duration-200 ${
                  sort === "price_desc"
                    ? "bg-gold-500 text-navy-900 border-gold-500 shadow-sm"
                    : "bg-white text-navy-700 border-[#E8E0D0] hover:bg-navy-50"
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Desktop Sidebar Filters (Hidden on Mobile) */}
          <aside className="hidden md:block w-full md:w-1/4 shrink-0">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-sm sticky top-24">
              <h2 className="font-display font-bold text-lg text-navy-900 mb-5 pb-3 border-b border-[#E8E0D0] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold-500" /> Filters
              </h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">City</label>
                  <select name="city" defaultValue={city} className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500">
                    <option value="">All Cities</option>
                    {TN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">Property Type</label>
                  <select name="type" defaultValue={type} className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500">
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">Listing Type</label>
                  <select name="listingType" defaultValue={listingType} className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500">
                    <option value="">All Listings</option>
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors">
                    Apply Filters
                  </Button>
                  <Link href="/properties" className="block w-full mt-2 text-center">
                    <Button type="button" variant="outline" className="w-full h-11 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-sans">
                      Clear Filters
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
          </aside>

          {/* Property Grid (1 col on mobile, 2 col on tablet, 3 col on desktop) */}
          <main className="w-full md:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serializedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            
            {serializedProperties.length === 0 && (
              <div className="text-center py-20 bg-white rounded-card border border-[#E8E0D0] shadow-xs">
                <h3 className="font-display font-semibold text-xl text-navy-900">No properties found</h3>
                <p className="text-gray-500 mt-2 font-sans">Try adjusting your filters or search keywords</p>
                <Link href="/properties" className="mt-6 inline-block">
                  <Button className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans">
                    View All Properties
                  </Button>
                </Link>
              </div>
            )}
          </main>
        </div>

        {/* Mobile floating filter drawer (Sticky Bottom Sheet trigger) */}
        <MobileFilterDrawer
          city={city}
          type={type}
          listingType={listingType}
          tnCities={TN_CITIES}
          propertyTypes={PROPERTY_TYPES}
          listingTypes={LISTING_TYPES}
        />

      </div>
    </div>
  );
}
