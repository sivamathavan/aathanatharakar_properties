"use client";

import { MapPin, Heart, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    locality: string;
    city: string;
    price: string | number | bigint;
    priceUnit?: string;
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

// Broker contact — never expose the listing owner's number publicly.
const BROKER_PHONE =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916381169124").replace(
    /[^0-9]/g,
    ""
  );

export function PropertyCard({ property }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("saved_properties") || "[]"
      );
      setIsSaved(Array.isArray(saved) && saved.includes(property.id));
    } catch {
      setIsSaved(false);
    }
  }, [property.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved = JSON.parse(
        localStorage.getItem("saved_properties") || "[]"
      );
      const list: string[] = Array.isArray(saved) ? saved : [];
      const next = list.includes(property.id)
        ? list.filter((id) => id !== property.id)
        : [...list, property.id];
      localStorage.setItem("saved_properties", JSON.stringify(next));
      setIsSaved(next.includes(property.id));
    } catch {
      /* localStorage disabled — silently ignore */
    }
  };

  const formatIndianPrice = (num: number) => {
    if (!Number.isFinite(num) || num <= 0) return "Price on Request";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumSignificantDigits: 3,
    }).format(num);
  };

  const getListingColor = (type: string) => {
    switch (type) {
      case "BUY":
        return "bg-gold-500 text-navy-900 border-gold-600";
      case "RENT":
        return "bg-navy-700 text-white";
      case "LEASE":
        return "bg-navy-600 text-white";
      case "SELL":
        return "bg-gold-600 text-navy-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const listingLabel =
    property.listingType === "BUY"
      ? "For Sale"
      : property.listingType === "RENT"
      ? "For Rent"
      : property.listingType === "LEASE"
      ? "For Lease"
      : "Selling";

  const waMessage = encodeURIComponent(
    `Hi Aadana Tharakar, I'm interested in "${property.title}" in ${property.locality}, ${property.city} (ID: ${property.id}). Please share more details.`
  );
  const waUrl = `https://wa.me/${BROKER_PHONE}?text=${waMessage}`;
  const callUrl = `tel:+${BROKER_PHONE}`;

  return (
    <div className="overflow-hidden group flex flex-col justify-between bg-white rounded-card border border-[#E8E0D0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-navy-950 flex-shrink-0">
        {/* Blurred Background to prevent cuts */}
        {property.media?.[0]?.url && (
          <Image
            src={getOptimizedCloudinaryUrl(
              property.media?.[0]?.thumbnailUrl || property.media?.[0]?.url
            )}
            alt=""
            fill
            className="object-cover blur-md opacity-30 scale-110 pointer-events-none"
            sizes="10vw"
          />
        )}
        <Image
          src={getOptimizedCloudinaryUrl(
            property.media?.[0]?.thumbnailUrl || property.media?.[0]?.url
          )}
          alt={property.title}
          fill
          className="object-contain group-hover:scale-102 transition-transform duration-300 z-10"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute top-3 left-3 z-10">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-pill shadow-xs uppercase tracking-wide ${getListingColor(
              property.listingType
            )}`}
          >
            {listingLabel}
          </span>
        </div>

        <button
          onClick={toggleSave}
          className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          aria-label={isSaved ? "Remove from saved" : "Save property"}
          aria-pressed={isSaved}
        >
          <Heart
            className={`w-4 h-4 ${
              isSaved ? "fill-red-500 text-red-500" : "text-navy-900"
            }`}
          />
        </button>

        {property.isFeatured && (
          <div className="absolute top-12 right-3 z-10">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-[#D4A017] text-navy-900 shadow-xs uppercase tracking-wide">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-[#8A95A3] mb-1.5 flex items-center gap-1 font-sans">
            <MapPin size={12} className="text-gold-500" /> {property.locality},{" "}
            {property.city}
          </p>
          <h3
            className="font-sans font-medium text-navy-900 text-sm leading-snug line-clamp-2 mb-2"
            title={property.title}
          >
            {property.title}
          </h3>
          <p className="font-display font-semibold text-navy-900 text-lg mb-3">
            {formatIndianPrice(Number(property.price))}
            {property.listingType === "RENT" || property.priceUnit === "PER_MONTH" ? (
              <span className="text-xs font-sans text-navy-700 ml-1">/ month</span>
            ) : property.listingType === "LEASE" || property.priceUnit === "PER_YEAR" ? (
              <span className="text-xs font-sans text-navy-700 ml-1">/ year</span>
            ) : property.priceUnit === "PER_SQFT" ? (
              <span className="text-xs font-sans text-navy-700 ml-1">/ sqft</span>
            ) : null}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-xs text-[#4A5568] border-t border-[#E8E0D0] pt-3 font-sans">
            {property.bedrooms ? <span>{property.bedrooms} BHK</span> : null}
            <span>{property.area} sqft</span>
            <span className="ml-auto text-[#8A95A3]">
              {property.viewCount} views
            </span>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="block w-full"
            aria-label={`View details of ${property.title}`}
          >
            <span className="btn-primary w-full text-center block text-xs h-10 py-0 leading-10">
              View Details
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 h-9 rounded-btn bg-[#25D366] hover:bg-[#1ebe5c] text-white text-xs font-bold transition-colors"
              aria-label="Contact broker on WhatsApp"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-white shrink-0"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={callUrl}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 h-9 rounded-btn bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-colors"
              aria-label="Call broker"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              Call Broker
            </a>
          </div>

          <p className="text-[10px] text-navy-600 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3 h-3 text-gold-600" />
            Contact via Aadana Tharakar broker only
          </p>
        </div>
      </div>
    </div>
  );
}
