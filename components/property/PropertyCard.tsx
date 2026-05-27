"use client";

import { MapPin, Heart } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    locality: string;
    city: string;
    price: string | number | bigint;
    listingType: string;
    isFeatured: boolean;
    bedrooms?: number | null;
    area: number;
    viewCount: number;
    media?: Array<{
      url: string;
      thumbnailUrl?: string | null;
    }>;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("saved_properties") || "[]");
    setIsSaved(saved.includes(property.id));
  }, [property.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem("saved_properties") || "[]");
    
    let newSaved;
    if (saved.includes(property.id)) {
      newSaved = saved.filter((id: string) => id !== property.id);
      setIsSaved(false);
    } else {
      newSaved = [...saved, property.id];
      setIsSaved(true);
    }
    
    localStorage.setItem("saved_properties", JSON.stringify(newSaved));
  };

  const formatIndianPrice = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumSignificantDigits: 3,
    }).format(num);
  };

  const getListingColor = (type: string) => {
    switch(type) {
      case 'BUY': return 'bg-gold-500 text-navy-900 border-gold-600';
      case 'RENT': return 'bg-info text-white';
      case 'LEASE': return 'bg-purple-600 text-white';
      case 'SELL': return 'bg-success text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-hover overflow-hidden group flex flex-col justify-between bg-white rounded-card border border-[#E8E0D0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-navy-50 flex-shrink-0">
        <Image
          src={getOptimizedCloudinaryUrl(property.media?.[0]?.thumbnailUrl || property.media?.[0]?.url)}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Listing Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-pill shadow-xs uppercase tracking-wide ${getListingColor(property.listingType)}`}>
            {property.listingType === 'BUY' ? 'For Sale' :
             property.listingType === 'RENT' ? 'For Rent' :
             property.listingType === 'LEASE' ? 'For Lease' : 'Selling'}
          </span>
        </div>
        
        {/* Save Button */}
        <button 
          onClick={toggleSave}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          aria-label="Save Property"
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-navy-900"}`} />
        </button>
        
        {/* Featured Ribbon */}
        {property.isFeatured && (
          <div className="absolute top-12 right-3 z-10">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-[#D4A017] text-navy-900 shadow-xs uppercase tracking-wide">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Info Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-[#8A95A3] mb-1.5 flex items-center gap-1 font-sans">
            <MapPin size={12} className="text-gold-500" /> {property.locality}, {property.city}
          </p>
          <h3 className="font-sans font-medium text-navy-900 text-sm leading-snug line-clamp-2 mb-2" title={property.title}>
            {property.title}
          </h3>
          <p className="font-display font-semibold text-navy-900 text-lg mb-3">
            {formatIndianPrice(Number(property.price))}
          </p>
        </div>

        <div className="space-y-3">
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-[#4A5568] border-t border-[#E8E0D0] pt-3 font-sans">
            {property.bedrooms && <span>{property.bedrooms} BHK</span>}
            <span>{property.area} sqft</span>
            <span className="ml-auto text-[#8A95A3]">{property.viewCount} views</span>
          </div>

          {/* Details Gold Button */}
          <Link href={`/properties/${property.id}`} className="block w-full">
            <span className="btn-primary w-full text-center block text-xs h-10 py-0.5 leading-9">
              View Details
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
