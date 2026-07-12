"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Phone, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916381169124").replace(/\D/g, "");
const WHATSAPP_MSG = encodeURIComponent("Hi DK Promoters, I'm interested in a property. Please share details.");
const PHONE_NUMBER = "+916381169124";

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on desktop, hide on dashboard/admin (which have their own nav)
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E0D0] flex justify-around items-center py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] text-navy-800 font-sans">

      <Link href="/" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
        <Home className={`w-5 h-5 ${pathname === "/" ? "text-gold-500 fill-gold-50" : "text-navy-600"}`} />
        <span className={pathname === "/" ? "text-gold-600" : "text-navy-600"}>Home</span>
      </Link>

      <Link href="/properties" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
        <Search className={`w-5 h-5 ${pathname === "/properties" ? "text-gold-500 fill-gold-50" : "text-navy-600"}`} />
        <span className={pathname === "/properties" ? "text-gold-600" : "text-navy-600"}>Explore</span>
      </Link>

      {/* Center FAB — WhatsApp Broker */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-navy-950 flex-1 relative -mt-5 active:scale-95 transition-transform"
        aria-label="WhatsApp DK Promoters"
      >
        <div className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center border-4 border-[#FDF8E8] shadow-md">
          <MessageCircle className="w-7 h-7" />
        </div>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-navy-900">WhatsApp</span>
      </a>

      {/* Call Button */}
      <a
        href={`tel:${PHONE_NUMBER}`}
        className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors"
        aria-label="Call DK Promoters"
      >
        <Phone className="w-5 h-5 text-navy-600" />
        <span className="text-navy-600">Call</span>
      </a>

      {/* About */}
      <Link href="/about" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
        <svg className={`w-5 h-5 ${pathname === "/about" ? "text-gold-500" : "text-navy-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" strokeLinecap="round" strokeWidth={2.5}/>
          <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
        </svg>
        <span className={pathname === "/about" ? "text-gold-600" : "text-navy-600"}>About</span>
      </Link>

    </div>
  );
}
