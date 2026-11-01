"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useT } from "@/components/i18n/I18nProvider";

export function SignOutButton({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <button type="button" onClick={() => signOut()} className={`flex items-center gap-2 text-sm text-navy-700 hover:text-red-600 ${className}`}>
      <LogOut className="w-4 h-4" /> {t("Sign out")}
    </button>
  );
}
