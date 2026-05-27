"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface MobileFilterDrawerProps {
  city?: string;
  type?: string;
  listingType?: string;
  tnCities: readonly string[];
  propertyTypes: readonly string[];
  listingTypes: readonly string[];
}

export function MobileFilterDrawer({
  city,
  type,
  listingType,
  tnCities,
  propertyTypes,
  listingTypes,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-navy-900 hover:bg-navy-800 text-gold-500 font-sans font-semibold px-6 py-3 rounded-full shadow-lg border border-gold-500/30 flex items-center gap-2 whitespace-nowrap h-12 active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="w-4 h-4 text-gold-500" />
          <span>Filters</span>
        </Button>
      </div>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filter Properties"
      >
        <form className="space-y-5 pb-6">
          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2">City</label>
            <select name="city" defaultValue={city} className="w-full h-12 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500">
              <option value="">All Cities</option>
              {tnCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2">Property Type</label>
            <select name="type" defaultValue={type} className="w-full h-12 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500">
              <option value="">All Types</option>
              {propertyTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-800 uppercase tracking-wider mb-2">Listing Type</label>
            <select name="listingType" defaultValue={listingType} className="w-full h-12 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500">
              <option value="">All Listings</option>
              {listingTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" className="w-full h-12 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-md rounded-btn">
              Apply Filters
            </Button>
            <a href="/properties" className="block w-full text-center">
              <Button type="button" variant="outline" className="w-full h-12 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-sans">
                Clear Filters
              </Button>
            </a>
          </div>
        </form>
      </BottomSheet>
    </>
  );
}
