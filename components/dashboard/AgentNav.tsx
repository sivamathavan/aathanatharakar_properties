"use client";

import { useEffect, useState } from "react";
import { OPEN_HELP_EVENT } from "@/components/help/open-help";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, List, MessageSquare, UserCircle, PlusCircle, Share2, CreditCard, Users, BarChart3, ShieldCheck, MoreHorizontal, LifeBuoy,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { useT } from "@/components/i18n/I18nProvider";

export const AGENT_NAV = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/properties", label: "My properties", icon: List },
  { href: "/dashboard/properties/new", label: "Add property", icon: PlusCircle },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/dashboard/buyers", label: "Buyers", icon: Users },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
  { href: "/dashboard/share", label: "Share my page", icon: Share2 },
  { href: "/dashboard/profile", label: "Profile & branding", icon: UserCircle },
  { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
  { href: "/dashboard/account", label: "Account & data", icon: ShieldCheck },
];

const MOBILE_MAIN = ["/dashboard", "/dashboard/properties", "/dashboard/properties/new", "/dashboard/enquiries"];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/properties") return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.endsWith("/new"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AgentSidebar({ name, planLine, help }: { name: string; planLine: string; help: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() || "";
  return (
    <aside className="w-64 bg-white border-r border-[#E4DED2] hidden md:flex flex-col shrink-0 font-sans">
      <div className="p-6 border-b border-[#E4DED2]">
        <h2 className="font-display font-semibold text-lg text-navy-900 truncate">{name}</h2>
        <p className="text-xs text-navy-700 mt-0.5">{planLine}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1" aria-label={t("Dashboard")}>
        {AGENT_NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 px-4 py-2.5 rounded-btn text-sm font-medium ${active ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}>
              <n.icon className={`w-4 h-4 shrink-0 ${active ? "text-gold-500" : "text-gold-600"}`} />
              <span>{t(n.label)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#E4DED2] space-y-3">
        <LanguageSwitch />
        {help}
        <SignOutButton />
      </div>
    </aside>
  );
}

export function AgentBottomNav({ help }: { help: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() || "";
  const [more, setMore] = useState(false);
  // "Questions & answers" / "Send us a message" in More → Help open the help panel; close the sheet under it.
  useEffect(() => {
    const close = () => setMore(false);
    window.addEventListener(OPEN_HELP_EVENT, close);
    return () => window.removeEventListener(OPEN_HELP_EVENT, close);
  }, []);
  const main = AGENT_NAV.filter((n) => MOBILE_MAIN.includes(n.href));
  const rest = AGENT_NAV.filter((n) => !MOBILE_MAIN.includes(n.href));
  const moreActive = rest.some((n) => isActive(pathname, n.href));
  const short: Record<string, string> = { "/dashboard/properties": "Listings", "/dashboard/properties/new": "Add" };

  return (
    <>
      <nav aria-label={t("Dashboard")} className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4DED2] grid grid-cols-5 items-end py-2 pb-safe shadow-lg font-sans">
        {main.map((n) =>
          n.href === "/dashboard/properties/new" ? (
            <Link key={n.href} href={n.href} className="flex flex-col items-center -mt-5 text-[11px] font-bold text-navy-900">
              <span className="w-12 h-12 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center border-2 border-warm-cream shadow-md">
                <PlusCircle className="w-6 h-6" />
              </span>
              <span className="mt-1">{t("Add")}</span>
            </Link>
          ) : (
            <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? "page" : undefined} className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold py-1 min-h-11 justify-center ${isActive(pathname, n.href) ? "text-gold-700" : "text-navy-800"}`}>
              <n.icon className="w-5 h-5" />
              <span>{t(short[n.href] || n.label)}</span>
            </Link>
          )
        )}
        <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more} className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold py-1 min-h-11 justify-center ${moreActive ? "text-gold-700" : "text-navy-800"}`}>
          <MoreHorizontal className="w-5 h-5" />
          <span>{t("More")}</span>
        </button>
      </nav>
      <BottomSheet isOpen={more} onClose={() => setMore(false)} title={t("More")}>
        <div className="space-y-5 pb-4">
          <ul className="grid grid-cols-2 gap-2">
            {rest.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setMore(false)} className={`h-14 px-3 rounded-card border flex items-center gap-2 text-sm font-semibold ${isActive(pathname, n.href) ? "border-navy-900 bg-navy-50" : "border-[#E4DED2]"}`}>
                  <n.icon className="w-5 h-5 text-gold-600 shrink-0" /> <span>{t(n.label)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-600">{t("Language")}</p>
            <LanguageSwitch />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-600 flex items-center gap-1"><LifeBuoy className="w-4 h-4" /> {t("Help")}</p>
            {help}
          </div>
          <SignOutButton className="h-11" />
        </div>
      </BottomSheet>
    </>
  );
}
