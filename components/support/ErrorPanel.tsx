"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { SupportLinks } from "@/components/support/SupportLinks";
import { useT } from "@/components/i18n/I18nProvider";

/** Friendly error inside the dashboard or admin, keeping their menus in place. */
export function ErrorPanel({ error, reset, homeHref, homeLabel }: { error: Error & { digest?: string }; reset: () => void; homeHref: string; homeLabel: string }) {
  const t = useT();
  useEffect(() => {
    console.error("[PAGE_ERROR]", error);
  }, [error]);
  return (
    <div role="alert" className="max-w-lg bg-white rounded-card border border-[#E4DED2] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-gold-700" /></span>
        <h1 className="text-lg font-bold text-navy-900">{t("This page didn't load")}</h1>
      </div>
      <p className="text-sm text-navy-700">{t("It may be your internet connection. Try again; nothing you saved is lost.")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => reset()} className="h-11 px-4 inline-flex items-center gap-2 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold">
          <RotateCcw className="w-4 h-4" /> {t("Try again")}
        </button>
        <Link href={homeHref} className="h-11 px-4 inline-flex items-center rounded-btn border border-navy-700 text-navy-900 text-sm font-semibold">{t(homeLabel)}</Link>
      </div>
      {error.digest && <p className="text-xs text-navy-500">{t("Error code")}: {error.digest}</p>}
      <SupportLinks message={`Hi, a page didn't load for me${error.digest ? ` (error ${error.digest})` : ""}.`} />
    </div>
  );
}
