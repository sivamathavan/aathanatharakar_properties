"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useT } from "@/components/i18n/I18nProvider";
import { useAppOffer } from "@/components/app/useAppOffer";

const DISMISSED = "proppage:get-app-dismissed";

/** Overview card for Android phones without the app. The Help link stays after it is closed. */
export function GetAppCard() {
  const t = useT();
  const offer = useAppOffer();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (offer !== "apk" || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Private mode: it simply comes back on the next visit.
    }
  };

  return (
    <section aria-labelledby="get-app-heading" className="rounded-card border border-[#E4DED2] bg-white p-4 flex items-start gap-3">
      <Smartphone className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0 space-y-2 text-sm text-navy-900">
        <h2 id="get-app-heading" className="font-semibold">{t("Get the {brand} Android app", { brand: BRAND.name })}</h2>
        <p>{t("Open your dashboard from an icon on your phone. Same account, same login.")}</p>
        <Link href="/app" className="h-10 px-4 rounded-btn bg-navy-900 text-gold-500 font-bold inline-flex items-center">
          {t("See how to install")}
        </Link>
      </div>
      <button type="button" onClick={dismiss} aria-label={t("Close")} className="p-2 -m-1 rounded-full text-navy-600 hover:bg-navy-50">
        <X className="w-4 h-4" aria-hidden />
      </button>
    </section>
  );
}
