"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Rocket, UserCircle, Info } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { UserRole } from "@/types";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Property pages and agent pages have their own sticky contact bar.
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/a/") ||
    /^\/properties\/[^/]+$/.test(pathname || "")
  ) {
    return null;
  }

  const role = session?.user.role;
  const account = role === UserRole.ADMIN ? "/admin" : role === UserRole.AGENT ? "/dashboard" : "/login";
  const item = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href;
    return (
      <Link href={href} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold flex-1 py-1">
        <Icon className={`w-5 h-5 ${active ? "text-gold-600" : "text-navy-600"}`} />
        <span className={active ? "text-gold-700" : "text-navy-600"}>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4DED2] flex justify-around items-center py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {item("/", "Home", Home)}
      {item("/properties", "Explore", Search)}
      <Link href={role ? account : "/register"} className="flex flex-col items-center flex-1 -mt-5 text-[10px] font-bold text-navy-900">
        <span className="w-14 h-14 bg-gold-500 text-navy-900 rounded-full flex items-center justify-center border-4 border-[#F8F6F0] shadow-md">
          <Rocket className="w-6 h-6" />
        </span>
        <span className="mt-1 uppercase tracking-wider">{role ? "My page" : "Start free"}</span>
      </Link>
      {item(account, role ? "Dashboard" : "Login", UserCircle)}
      {item("/about", "About", Info)}
    </nav>
  );
}
