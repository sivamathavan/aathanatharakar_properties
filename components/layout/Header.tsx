"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { Menu, X, Home, FileText, Info, LayoutDashboard, MessageCircle } from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916381169124").replace(/\D/g, "");
const WHATSAPP_MSG = encodeURIComponent("Hi DK Promoters, I'm interested in a property. Please share details.");

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return nextState;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  // Cleanup body style on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-navy-900 border-b border-navy-800 text-white transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-[60px] lg:h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 z-50 group" onClick={closeMobileMenu}>
            <LogoIcon className="w-7 h-7 md:w-8 md:h-8 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="font-sans font-bold text-lg md:text-xl text-white leading-none tracking-wide">
              DK<span className="text-gold-500">Promoters</span>
            </span>
          </Link>

          {/* Desktop & Tablet Navigation — Broker-only: Properties, Blog, About */}
          {!isAdminRoute && (
            <nav className="hidden md:flex items-center space-x-5 lg:space-x-8 text-sm font-sans font-medium">
              {[
                { href: "/properties", label: "Properties" },
                { href: "/blog", label: "Blog" },
                { href: "/about", label: "About" },
              ].map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-2 group transition-colors ${
                      active ? "text-gold-500" : "hover:text-gold-500"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 bg-gold-500 transition-all duration-300 ${
                        active ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {!isAdminRoute && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-900 font-sans font-medium text-xs lg:text-sm px-4 lg:px-5 py-2 rounded-btn flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  Contact Broker
                </Button>
              </a>
            )}

            {/* Admin: show dashboard / sign-out if logged in as admin */}
            {session && session.user.role === UserRole.ADMIN && (
              <div className="flex items-center space-x-2">
                <Link href="/admin">
                  <Button variant="ghost" className="text-white hover:bg-navy-800 text-xs lg:text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="border-navy-800 text-white bg-transparent hover:bg-navy-800 text-xs lg:text-sm h-9"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gold-500 hover:text-gold-400 focus:outline-none z-50 h-10 w-10 flex items-center justify-center"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-navy-900 z-40 pt-20 px-6 flex flex-col justify-between pb-safe-bottom animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-5 text-lg font-sans font-medium text-white">
            <Link
              href="/properties"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
            >
              <Home className="w-5 h-5 text-gold-500" />
              <span>Properties</span>
            </Link>

            <Link
              href="/blog"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
            >
              <FileText className="w-5 h-5 text-gold-500" />
              <span>Blog</span>
            </Link>

            <Link
              href="/about"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
            >
              <Info className="w-5 h-5 text-gold-500" />
              <span>About Us</span>
            </Link>

            {session && session.user.role === UserRole.ADMIN && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-gold-500" />
                <span>Admin Control</span>
              </Link>
            )}
          </nav>

          {/* Bottom CTA */}
          <div className="space-y-3 mb-10">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
              onClick={closeMobileMenu}
            >
              <Button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-sans font-bold h-12 shadow-lg flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </Button>
            </a>

            {session && session.user.role === UserRole.ADMIN && (
              <Button
                variant="outline"
                onClick={() => { signOut({ callbackUrl: "/" }); closeMobileMenu(); }}
                className="w-full border-navy-700 text-white bg-transparent hover:bg-navy-800 h-12"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
