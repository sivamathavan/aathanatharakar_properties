"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: "85vh" | "50vh";
}

export function BottomSheet({ isOpen, onClose, title, children, snapPoint = "85vh" }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 200);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const heightClass = snapPoint === "85vh" ? "h-[85vh]" : "h-[50vh]";

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs cursor-pointer" 
        onClick={onClose}
      />
      
      {/* Sheet Container */}
      <div 
        className={`relative w-full max-w-lg bg-white rounded-t-2xl shadow-xl flex flex-col z-10 transition-transform duration-300 transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        } ${heightClass}`}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 shrink-0" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto cursor-pointer hover:bg-gray-400 transition-colors" />
        </div>

        {/* Title bar */}
        {title && (
          <div className="px-6 py-2 border-b flex justify-between items-center shrink-0">
            <h3 className="font-display font-semibold text-lg text-navy-900">{title}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="w-4 h-4 text-gray-500 hover:text-navy-950" />
            </Button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-safe text-navy-900">
          {children}
        </div>
      </div>
    </div>
  );
}
