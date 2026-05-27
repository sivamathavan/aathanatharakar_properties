"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TN_CITIES, PROPERTY_TYPES } from "@/lib/constants";

export function HomeSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [listingType, setListingType] = useState("BUY");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (listingType) params.set("listingType", listingType);
    
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl bg-white text-navy-900 rounded-card p-3 md:p-5 shadow-2xl border border-gold-200">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* City Select */}
        <div className="flex-1 space-y-1">
          <label className="hidden lg:block text-xs font-semibold text-navy-800 ml-1">City / Locality</label>
          <select 
            value={city} 
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-12 px-3 border border-gray-200 rounded-btn text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
          >
            <option value="">All Cities / Localities</option>
            {TN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Property Type Select */}
        <div className="flex-1 space-y-1">
          <label className="hidden lg:block text-xs font-semibold text-navy-800 ml-1">Property Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full h-12 px-3 border border-gray-200 rounded-btn text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
          >
            <option value="">All Property Types</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>

        {/* Listing Type Stack/Tabs (Mobile: 2x2 grid, Tablet+: inline) */}
        <div className="flex-1 space-y-1">
          <label className="hidden lg:block text-xs font-semibold text-navy-800 ml-1">Listing Type</label>
          <div className="grid grid-cols-2 xs:grid-cols-4 lg:flex lg:gap-1 p-1 bg-navy-50 rounded-btn border border-gray-100">
            {["BUY", "RENT", "LEASE", "SELL"].map((mode) => {
              const active = listingType === mode;
              return (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setListingType(mode)}
                  className={`h-10 text-xs font-bold rounded-btn transition-all ${
                    active 
                      ? "bg-gold-500 text-navy-900 shadow-xs" 
                      : "text-navy-700 hover:text-[#0D1B2A]"
                  }`}
                >
                  {mode === "BUY" ? "Buy" : mode === "RENT" ? "Rent" : mode === "LEASE" ? "Lease" : "Sell"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gold Search Button */}
        <div className="lg:self-end shrink-0 pt-2 lg:pt-0">
          <Button 
            type="submit" 
            className="w-full lg:w-auto h-12 px-8 bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-900 font-sans font-bold text-sm shadow-md rounded-btn flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Search Properties
          </Button>
        </div>
      </div>
    </form>
  );
}
