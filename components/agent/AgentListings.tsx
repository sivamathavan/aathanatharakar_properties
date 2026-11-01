"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { waNumber } from "@/lib/plans";

interface Listing {
  id: string;
  title: string;
  locality: string;
  city: string;
  price: number;
  priceUnit: string;
  listingType: string;
  type: string;
  isFeatured: boolean;
  bedrooms?: number | null;
  area: number;
  areaUnit?: string | null;
  viewCount: number;
  description: string;
  media: { url: string }[];
}

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartments", VILLA: "Villas", HOUSE: "Houses", PLOT: "Plots", COMMERCIAL: "Commercial", WAREHOUSE: "Warehouses", FARM_LAND: "Farm land", PG_HOSTEL: "PG / hostel",
};

// All of an agent's listings are sent in one go (max 100), so filtering
// happens in the browser and the page itself stays cached.
export function AgentListings({ properties, slug, phone, name, agentId }: { properties: Listing[]; slug: string; phone: string; name: string; agentId: string }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [listing, setListing] = useState("ALL");
  const types = Array.from(new Set(properties.map((p) => p.type)));

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return properties.filter((p) => {
      if (type !== "ALL" && p.type !== type) return false;
      if (listing === "RENT" && p.listingType !== "RENT" && p.listingType !== "LEASE") return false;
      if (listing === "SALE" && (p.listingType === "RENT" || p.listingType === "LEASE")) return false;
      const hay = `${p.title} ${p.locality} ${p.city} ${p.description}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [properties, q, type, listing]);

  if (properties.length === 0) {
    return <p className="text-center text-navy-700 py-16">{name} hasn&apos;t added any properties yet.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search properties</span>
          <Search className="w-4 h-4 text-navy-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area, e.g. Vadavalli" className="w-full h-11 pl-9 pr-3 rounded-btn border border-[#E4DED2] bg-white text-sm" />
        </label>
        <select aria-label="Property type" value={type} onChange={(e) => setType(e.target.value)} className="h-11 px-3 rounded-btn border border-[#E4DED2] bg-white text-sm">
          <option value="ALL">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>
          ))}
        </select>
        <select aria-label="Sale or rent" value={listing} onChange={(e) => setListing(e.target.value)} className="h-11 px-3 rounded-btn border border-[#E4DED2] bg-white text-sm">
          <option value="ALL">Sale &amp; rent</option>
          <option value="SALE">For sale</option>
          <option value="RENT">For rent / lease</option>
        </select>
      </div>
      <p className="text-sm text-navy-700">{shown.length} propert{shown.length === 1 ? "y" : "ies"}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            href={`/a/${slug}/${p.id}`}
            contact={{ phone: waNumber(phone), label: "Agent", note: `Talk directly to ${name}`, agentId }}
            showViews={false}
          />
        ))}
      </div>
    </div>
  );
}
