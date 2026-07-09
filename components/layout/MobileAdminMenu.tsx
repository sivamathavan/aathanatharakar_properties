"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, LayoutDashboard, Home, Store, Handshake, Zap, CheckCircle2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileAdminMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/vendors", label: "Vendors & Services", icon: Store },
  { href: "/admin/co-brokers", label: "Co-Brokers / Dealers", icon: Handshake },
  { href: "/admin/leads", label: "Active Deals", icon: Zap },
  { href: "/admin/completed-deals", label: "Completed Deals", icon: CheckCircle2 },
  { href: "/admin/commissions", label: "Revenue Tracker", icon: Receipt },
];

export function MobileAdminMenu({ isOpen, onClose }: MobileAdminMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Dimmer overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Sidebar Drawer */}
      <div className="relative flex flex-col w-72 max-w-xs bg-navy-900 text-white h-full p-6 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Header inside drawer */}
        <div className="flex justify-between items-center pb-4 border-b border-navy-800 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-gold-500">டிகே புரமோட்டர்ஸ்</h2>
            <p className="text-[10px] text-gray-400">Admin Control Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-navy-800" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={onClose}
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-sans"
              >
                <Icon className="w-5 h-5 text-gold-500" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer inside drawer */}
        <div className="pt-4 border-t border-navy-800 text-center text-[10px] text-gray-500 font-sans">
          Logged in as Administrator
        </div>
      </div>
    </div>
  );
}
