"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => signOut()} className={`flex items-center gap-2 text-sm text-navy-700 hover:text-red-600 ${className}`}>
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  );
}
