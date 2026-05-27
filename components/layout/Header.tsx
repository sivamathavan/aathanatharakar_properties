"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { Menu, X, Home, Briefcase, FileText, Info, LogIn, LayoutDashboard } from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";

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
              Aadana<span className="text-gold-500">Tharakar</span>
            </span>
          </Link>

          {/* Desktop & Tablet Navigation Link Options (768px+) */}
          {!isAdminRoute && (
            <nav className="hidden md:flex items-center space-x-5 lg:space-x-8 text-sm font-sans font-medium">
              <Link href="/properties" className="relative py-2 group hover:text-gold-500 transition-colors">
                Properties
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link href="/services" className="relative py-2 group hover:text-gold-500 transition-colors">
                Services
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link href="/blog" className="relative py-2 group hover:text-gold-500 transition-colors">
                Blog
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link href="/about" className="relative py-2 group hover:text-gold-500 transition-colors">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            </nav>
          )}

          {/* Actions & Login Status (768px+) */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {!isAdminRoute && (
              <Link href="/sell-your-property">
                <Button className="bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-900 font-sans font-medium text-xs lg:text-sm px-4 lg:px-5 py-2 rounded-btn">
                  List Property
                </Button>
              </Link>
            )}

            {session ? (
              <div className="flex items-center space-x-2">
                <Link href={session.user.role === UserRole.ADMIN ? "/admin" : "/dashboard"}>
                  <Button variant="ghost" className="text-white hover:bg-navy-800 text-xs lg:text-sm">
                    {session.user.role === UserRole.ADMIN ? "Admin" : "Dashboard"}
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
            ) : (
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:bg-navy-800 text-xs lg:text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    variant="outline" 
                    className="border-gold-500 text-gold-500 bg-transparent hover:bg-gold-500 hover:text-navy-900 text-xs lg:text-sm h-9"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon Toggle (< 768px) */}
          <button
            className="md:hidden p-2 text-gold-500 hover:text-gold-400 focus:outline-none z-50 h-10 w-10 flex items-center justify-center"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Full screen overlay, navy bg) */}
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
              href="/services" 
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
            >
              <Briefcase className="w-5 h-5 text-gold-500" />
              <span>Services</span>
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

            {session && (
              <Link 
                href={session.user.role === UserRole.ADMIN ? "/admin" : "/dashboard"} 
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 py-2 border-b border-navy-800 hover:text-gold-500 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-gold-500" />
                <span>{session.user.role === UserRole.ADMIN ? "Admin Control" : "My Dashboard"}</span>
              </Link>
            )}
          </nav>

          {/* Action Call at Bottom of Drawer */}
          <div className="space-y-3 mb-10">
            <Link href="/sell-your-property" onClick={closeMobileMenu} className="block w-full">
              <Button className="w-full bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-900 font-sans font-bold h-12 shadow-lg">
                List Property Free
              </Button>
            </Link>

            {session ? (
              <Button 
                variant="outline" 
                onClick={() => { signOut({ callbackUrl: "/" }); closeMobileMenu(); }}
                className="w-full border-navy-700 text-white bg-transparent hover:bg-navy-800 h-12"
              >
                Sign Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={closeMobileMenu} className="w-full">
                  <Button variant="ghost" className="w-full text-white hover:bg-navy-800 h-12 flex items-center justify-center gap-1.5">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu} className="w-full">
                  <Button variant="outline" className="w-full border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-navy-900 h-12">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
