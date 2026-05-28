"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SavedPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const raw = localStorage.getItem("saved_properties") || "[]";
        const saved = JSON.parse(raw);
        const ids = Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
        if (ids.length === 0) {
          setProperties([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/properties/batch?ids=${encodeURIComponent(ids.join(","))}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(Array.isArray(data.properties) ? data.properties : []);
          // Drop any IDs that have been removed/deactivated to keep storage clean.
          const stillExist = new Set(
            (data.properties || []).map((p: any) => p.id)
          );
          const cleaned = ids.filter((id) => stillExist.has(id));
          if (cleaned.length !== ids.length) {
            localStorage.setItem("saved_properties", JSON.stringify(cleaned));
          }
        }
      } catch (error) {
        console.error("Failed to load saved properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <div className="bg-warm-cream min-h-screen py-10 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-gold-500 fill-gold-500" />
          <div>
            <h1 className="text-3xl font-display font-bold text-navy-900">Saved Properties</h1>
            <p className="text-navy-700 font-sans mt-1">Your shortlisted properties in one place</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-card border border-[#E8E0D0] p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 text-navy-200 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-navy-900 mb-2">No saved properties yet</h3>
            <p className="text-navy-700 font-sans mb-6">Explore our listings and save your favorites to view them later.</p>
            <Link href="/properties">
              <Button className="bg-gold-500 text-navy-900 hover:bg-gold-400 font-bold px-8 h-12 rounded-btn">
                Browse Properties
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
