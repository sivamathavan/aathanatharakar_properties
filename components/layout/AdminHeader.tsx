"use client";

import { useState } from "react";
import { Menu, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAdminMenu } from "@/components/layout/MobileAdminMenu";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden h-14 bg-navy-900 border-b border-navy-800 px-4 flex items-center justify-between text-white shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-white hover:bg-navy-800 rounded-btn"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-display font-bold text-base text-gold-500 tracking-wide">
            டிகே புரமோட்டர்ஸ் Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" target="_blank">
            <Button size="sm" variant="outline" className="h-8 text-xs border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-navy-900">
              Web View
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-8 w-8 text-red-400 hover:bg-navy-800 hover:text-red-300 rounded-full"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <MobileAdminMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
