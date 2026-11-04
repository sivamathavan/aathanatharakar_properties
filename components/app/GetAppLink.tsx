"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { useAppOffer } from "@/components/app/useAppOffer";

/** Link to the /app page, for Android phones that don't have the app yet. */
export function GetAppLink({ className = "text-navy-900" }: { className?: string }) {
  const t = useT();
  const offer = useAppOffer();
  if (offer !== "apk") return null;
  return (
    <Link href="/app" className={`inline-flex items-center gap-2 min-h-10 text-sm font-semibold underline ${className}`}>
      <Smartphone className="w-4 h-4 shrink-0" aria-hidden /> {t("Get the Android app")}
    </Link>
  );
}
