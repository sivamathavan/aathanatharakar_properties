"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, Heart, User, PlusCircle } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide on desktop, hide on dashboard (which has its own nav), hide on admin
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
      
      {/* Center FAB for List Property */}
      <Link href="/sell-your-property" className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-navy-950 flex-1 relative -mt-5 active:scale-95 transition-transform">
        <div className="w-14 h-14 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center border-4 border-[#FDF8E8] shadow-md">
          <PlusCircle className="w-7 h-7 text-gold-500" />
        </div>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-navy-900">List Free</span>
      </Link>
      
      <Link href="/saved" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
        <Heart className={`w-5 h-5 ${pathname === "/saved" ? "text-gold-500 fill-gold-50" : "text-navy-600"}`} />
        <span className={pathname === "/saved" ? "text-gold-600" : "text-navy-600"}>Saved</span>
      </Link>

      {session ? (
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
          <User className="w-5 h-5 text-navy-600" />
          <span className="text-navy-600">Account</span>
        </Link>
      ) : (
        <Link href="/login" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1 transition-colors">
          <User className="w-5 h-5 text-navy-600" />
          <span className="text-navy-600">Sign In</span>
        </Link>
      )}

    </div>
  );
}
