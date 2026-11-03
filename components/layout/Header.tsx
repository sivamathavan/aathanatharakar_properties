"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, FileText, Info, LayoutDashboard, Briefcase, Rocket } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { UserRole } from "@/types";

const NAV = [
  { href: "/for-agents", label: "For agents", icon: Briefcase },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/about", label: "About", icon: Info },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const setMenu = (next: boolean) => {
    setOpen(next);
    document.body.style.overflow = next ? "hidden" : "";
  };

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  const role = session?.user.role;
  const accountHref = role === UserRole.ADMIN ? "/admin" : role === UserRole.AGENT ? "/dashboard" : "/login";
  const accountLabel = role ? "Dashboard" : "Agent login";
  const isAdminRoute = pathname?.startsWith("/admin");

  // Agent share pages carry the agent's own branding and contact.
  if (pathname?.startsWith("/a/")) return null;

  return (
    <>
      {/* On admin pages below lg the admin bar (AdminHeader) takes over, so only one header shows. */}
      <header className={`sticky top-0 z-50 w-full bg-navy-900 border-b border-navy-800 text-white ${isAdminRoute ? "hidden lg:block" : ""}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="shrink-0 z-50 py-1" onClick={() => setMenu(false)} aria-label="Home">
            <BrandLogo size="md" />
          </Link>

          {!isAdminRoute && (
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={`transition-colors ${active ? "text-gold-400" : "text-gray-200 hover:text-gold-400"}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="hidden md:flex items-center gap-2">
            <Link href={accountHref}>
              <Button variant="ghost" className="text-white hover:bg-navy-800 text-sm">
                <LayoutDashboard className="w-4 h-4 mr-1" /> {accountLabel}
              </Button>
            </Link>
            {session ? (
              <Button variant="outline" onClick={() => signOut()} className="border-navy-700 text-white bg-transparent hover:bg-navy-800 text-sm h-9">
                Sign out
              </Button>
            ) : (
              <Link href="/register">
                <Button className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-4 h-9 rounded-btn">Start free</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gold-500 hover:text-gold-400 z-50 h-10 w-10 flex items-center justify-center"
            onClick={() => setMenu(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 bg-navy-900 z-40 pt-20 px-6 flex flex-col justify-between pb-safe-bottom">
          <nav className="flex flex-col space-y-5 text-lg font-medium text-white">
            {[...NAV, { href: accountHref, label: accountLabel, icon: LayoutDashboard }].map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setMenu(false)} className="flex items-center gap-3 py-2 border-b border-navy-800 hover:text-gold-500">
                <item.icon className="w-5 h-5 text-gold-500" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="space-y-3 mb-10">
            {session ? (
              <Button variant="outline" onClick={() => { signOut(); setMenu(false); }} className="w-full border-navy-700 text-white bg-transparent hover:bg-navy-800 h-12">
                Sign out
              </Button>
            ) : (
              <Link href="/register" onClick={() => setMenu(false)} className="block">
                <Button className="w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold h-12 flex items-center justify-center gap-2">
                  <Rocket className="w-5 h-5" /> Start your free trial
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
