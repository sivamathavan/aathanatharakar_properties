import { prisma } from "@/lib/prisma";
import { AccountStatus, VendorCategory } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, SlidersHorizontal, PlusCircle } from "lucide-react";
import { TN_CITIES, VENDOR_CATEGORIES } from "@/lib/constants";
import { ServiceCategoryTabs } from "@/components/services/ServiceCategoryTabs";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const city = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  const whereClause: any = {
    user: { accountStatus: AccountStatus.ACTIVE },
  };

  if (category) whereClause.category = category as VendorCategory;
  if (city) {
    whereClause.serviceAreas = { has: city };
  }

  const vendors = await prisma.vendorProfile.findMany({
    where: whereClause,
    orderBy: { businessName: "asc" },
    include: { user: true },
    take: 20,
  });

  const categories = VENDOR_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat.replace('_', ' '),
  }));

  // Construct query string manually to update city select filter cleanly
  const getCityFilterUrl = (cityName: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (cityName) params.set("city", cityName);
    return `/services?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-warm-cream py-6 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Page title and description */}
        <div className="mb-6 border-b border-[#E8E0D0] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-900 leading-tight">
              Allied Services Directory
            </h1>
            <p className="text-sm font-sans text-navy-700 mt-1">
              Find and hire trusted home builders, architects, carpenters, and loan advisors in Tamil Nadu.
            </p>
          </div>
          <Link href="/register/vendor" className="shrink-0">
            <Button className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans text-xs font-semibold h-10 px-4 rounded-btn flex items-center gap-1.5 shadow-sm">
              <PlusCircle className="w-4 h-4 text-gold-500" /> Become a Partner
            </Button>
          </Link>
        </div>

        {/* Scrollable Category Tab Bar */}
        <div className="mb-6 bg-white p-2.5 rounded-card border border-[#E8E0D0]/60 shadow-xs">
          <p className="text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 px-1 font-sans">
            Filter by Service Type
          </p>
          <ServiceCategoryTabs categories={categories} activeCategory={category || ""} />
        </div>

        {/* Filters and List split grid */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Sidebar Filters */}
          <aside className="w-full md:w-1/4 shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-sm sticky top-24">
              <h2 className="font-display font-bold text-lg text-navy-900 mb-5 pb-3 border-b border-[#E8E0D0] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold-500" /> City Coverage
              </h2>
              
              <form className="space-y-4">
                {category && <input type="hidden" name="category" value={category} />}
                
                <div>
                  <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2 font-sans">Select Operating City</label>
                  <select 
                    name="city" 
                    defaultValue={city || ""} 
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  >
                    <option value="">All Tamil Nadu Cities</option>
                    {TN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors">
                    Apply Filter
                  </Button>
                  <Link href="/services" className="block w-full mt-2 text-center">
                    <Button type="button" variant="outline" className="w-full h-11 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-sans">
                      Reset Directory
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
            
            {/* Promo Card */}
            <div className="bg-navy-900 text-white p-6 rounded-card border border-navy-950 shadow-sm relative overflow-hidden font-sans">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-gold-500/10 rounded-full blur-xl" />
              <h3 className="font-display font-semibold text-base text-gold-500 mb-2">Are you a Professional?</h3>
              <p className="text-xs text-navy-200 leading-relaxed mb-4">
                List your builder, contractor, or Vastu consultation services here and connect with genuine property buyers directly.
              </p>
              <Link href="/register/vendor">
                <Button className="w-full bg-gold-500 text-navy-900 hover:bg-gold-400 font-bold text-xs h-10 rounded-btn transition-colors border-0">
                  Register as Vendor
                </Button>
              </Link>
            </div>
          </aside>

          {/* Vendors Grid */}
          <main className="w-full md:w-3/4">
            <div className="mb-5">
              <h2 className="text-lg font-display font-bold text-navy-900">
                {vendors.length === 0 
                  ? "No professionals found" 
                  : `${vendors.length} Verified Partners Available`
                }
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow border border-[#E8E0D0] bg-white rounded-card">
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div className="flex flex-row items-start gap-4">
                      {/* Compact photo/icon left */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-navy-50 rounded-lg flex items-center justify-center shrink-0 border border-[#E8E0D0]/50 text-gold-600">
                        <Briefcase className="w-7 h-7 sm:w-9 sm:h-9" />
                      </div>
                      
                      {/* Details right */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gold-500 text-navy-900 uppercase tracking-wide">
                            {vendor.category.replace('_', ' ')}
                          </span>
                          {vendor.isVerified && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1D6A3A] text-white uppercase tracking-wide">
                              Verified
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-display font-semibold text-base text-navy-900 mt-2 truncate" title={vendor.businessName}>
                          {vendor.businessName}
                        </h3>
                        
                        {vendor.yearsInBusiness && (
                          <p className="text-[11px] font-sans text-navy-700 mt-0.5">
                            <span className="font-bold text-navy-900">{vendor.yearsInBusiness} Years</span> Experience
                          </p>
                        )}

                        <p className="text-navy-700 text-xs font-sans mt-2 line-clamp-2 leading-relaxed">
                          {vendor.description}
                        </p>
                        
                        <div className="flex items-center text-[10px] text-navy-700 mt-2.5 font-sans">
                          <MapPin className="w-3 h-3 mr-1 text-gold-500 shrink-0" />
                          <span className="truncate">
                            {vendor.serviceAreas.length > 2 
                              ? `${vendor.serviceAreas.slice(0, 2).join(', ')} +${vendor.serviceAreas.length - 2} more`
                              : vendor.serviceAreas.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="mt-4 pt-3.5 border-t border-[#E8E0D0] flex gap-2 w-full font-sans">
                      <Link href={`/services/${vendor.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-navy-700 text-navy-800 hover:bg-navy-50 text-[11px] h-9 rounded-btn">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/services/${vendor.id}`} className="flex-1">
                        <Button className="w-full bg-navy-900 text-gold-500 hover:bg-navy-950 text-[11px] font-bold h-9 rounded-btn shadow-xs">
                          Get Quote
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {vendors.length === 0 && (
              <div className="text-center py-20 bg-white rounded-card border border-[#E8E0D0] shadow-xs">
                <h3 className="font-display font-semibold text-lg text-navy-900">No professionals found</h3>
                <p className="text-gray-500 mt-2 font-sans">Try selecting a different city or category</p>
                <Link href="/services" className="mt-6 inline-block">
                  <Button className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans">
                    View All Professionals
                  </Button>
                </Link>
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
