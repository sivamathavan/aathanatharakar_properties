import { getActiveProperties } from "@/lib/firestore";
import { PropertyStatus } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Search } from "lucide-react";
import { TN_CITIES, PROPERTY_TYPES, LISTING_TYPES } from "@/lib/constants";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MobileFilterDrawer } from "@/components/property/MobileFilterDrawer";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function toIntOrUndefined(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const city = typeof searchParams.city === "string" ? searchParams.city : undefined;
  const type = typeof searchParams.type === "string" ? searchParams.type : undefined;
  const listingType =
    typeof searchParams.listingType === "string" ? searchParams.listingType : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 80) : undefined;
  const minPrice = toIntOrUndefined(searchParams.minPrice);
  const maxPrice = toIntOrUndefined(searchParams.maxPrice);
  const bhk = toIntOrUndefined(searchParams.bhk);
  const page = Math.max(1, toIntOrUndefined(searchParams.page) || 1);

  const { properties, total: totalCount } = await getActiveProperties({
    city,
    type,
    listingType,
    bedrooms: bhk,
    minPrice,
    maxPrice,
    search: q,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merge = {
      city,
      type,
      listingType,
      sort,
      q,
      minPrice: minPrice?.toString(),
      maxPrice: maxPrice?.toString(),
      bhk: bhk?.toString(),
      page: page > 1 ? page.toString() : undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merge)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/properties?${qs}` : "/properties";
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const serializedProperties = properties.map((property) => ({
    ...property,
    price: Number(property.price),
  }));

  const activeFilterCount = [city, type, listingType, q, minPrice, maxPrice, bhk].filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="min-h-screen bg-warm-cream py-4 md:py-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-5 md:mb-8 border-b border-[#E8E0D0] pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="font-display font-bold text-xl md:text-3xl text-navy-900 leading-tight">
                Available Properties
              </h1>
              <p className="text-xs sm:text-sm font-sans text-navy-700 mt-1">
                {totalCount === 0
                  ? "No matching listings found"
                  : `${totalCount} verified listing${totalCount === 1 ? "" : "s"} in Tamil Nadu`}
              </p>
            </div>

            {activeFilterCount > 0 && (
              <Link href="/properties">
                <Button
                  variant="outline"
                  className="border-[#E8E0D0] hover:bg-navy-50 text-navy-800 font-sans h-9 text-xs"
                >
                  Clear all filters ({activeFilterCount})
                </Button>
              </Link>
            )}
          </div>

          {/* Search bar — visible on all sizes */}
          <form method="get" className="mt-4">
            {/* Preserve other filters as hidden inputs so the search form doesn't drop them */}
            {city && <input type="hidden" name="city" value={city} />}
            {type && <input type="hidden" name="type" value={type} />}
            {listingType && <input type="hidden" name="listingType" value={listingType} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {bhk !== undefined && <input type="hidden" name="bhk" value={String(bhk)} />}
            {minPrice !== undefined && (
              <input type="hidden" name="minPrice" value={String(minPrice)} />
            )}
            {maxPrice !== undefined && (
              <input type="hidden" name="maxPrice" value={String(maxPrice)} />
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
              <input
                type="search"
                name="q"
                defaultValue={q || ""}
                placeholder="Search by title, locality or address…"
                className="w-full h-11 pl-9 pr-24 border border-[#E8E0D0] rounded-btn bg-white font-sans text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                aria-label="Search properties"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-btn bg-navy-900 text-gold-500 text-xs font-bold hover:bg-navy-950"
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort chips */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 flex items-center gap-1 font-sans">
              <ArrowUpDown className="w-3 h-3 text-gold-500" /> Sort by
            </p>
            <div className="w-full overflow-x-auto scrollbar-hide flex gap-2 py-1 scroll-snap-x snap-mandatory">
              {[
                { value: undefined, label: "Latest Listings" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" },
              ].map(({ value, label }) => (
                <Link
                  key={label}
                  href={buildUrl({ sort: value, page: undefined })}
                  className={`snap-align-start shrink-0 px-4 py-2 text-xs font-sans font-medium rounded-pill border transition-all duration-200 ${
                    sort === value
                      ? "bg-gold-500 text-navy-900 border-gold-500 shadow-sm"
                      : "bg-white text-navy-700 border-[#E8E0D0] hover:bg-navy-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Desktop filters */}
          <aside className="hidden md:block w-full md:w-1/4 shrink-0">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-sm sticky top-24">
              <h2 className="font-display font-bold text-lg text-navy-900 mb-5 pb-3 border-b border-[#E8E0D0] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold-500" /> Filters
              </h2>

              <form method="get" className="space-y-4">
                {q && <input type="hidden" name="q" value={q} />}
                {sort && <input type="hidden" name="sort" value={sort} />}

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">
                    City
                  </label>
                  <select
                    name="city"
                    defaultValue={city || ""}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">All Cities</option>
                    {TN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">
                    Property Type
                  </label>
                  <select
                    name="type"
                    defaultValue={type || ""}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">
                    Listing Type
                  </label>
                  <select
                    name="listingType"
                    defaultValue={listingType || ""}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">All Listings</option>
                    {LISTING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">
                    Bedrooms (BHK)
                  </label>
                  <select
                    name="bhk"
                    defaultValue={bhk?.toString() || ""}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} BHK
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">
                    Price Range (₹)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      defaultValue={minPrice?.toString() || ""}
                      min="0"
                      placeholder="Min"
                      className="h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      defaultValue={maxPrice?.toString() || ""}
                      min="0"
                      placeholder="Max"
                      className="h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-sm text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors"
                  >
                    Apply Filters
                  </Button>
                  <Link href="/properties" className="block w-full text-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-sans"
                    >
                      Clear Filters
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
          </aside>

          {/* Grid */}
          <main className="w-full md:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {serializedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {serializedProperties.length === 0 && (
              <div className="text-center py-12 md:py-20 bg-white rounded-card border border-[#E8E0D0] shadow-xs">
                <h3 className="font-display font-semibold text-base md:text-xl text-navy-900">
                  No properties found
                </h3>
                <p className="text-gray-500 mt-2 font-sans text-xs md:text-sm">
                  Try adjusting your filters or search keywords
                </p>
                <Link href="/properties" className="mt-6 inline-block">
                  <Button className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans">
                    View All Properties
                  </Button>
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="h-10 px-4 rounded-btn border border-[#E8E0D0] text-navy-800 bg-white hover:bg-navy-50 text-xs font-bold flex items-center"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-xs text-navy-700 font-sans px-3">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="h-10 px-4 rounded-btn bg-navy-900 text-gold-500 hover:bg-navy-950 text-xs font-bold flex items-center"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>

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
