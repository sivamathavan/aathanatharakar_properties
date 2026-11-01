"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";
import { useLang } from "@/components/i18n/I18nProvider";

/** English / தமிழ் for agent screens. Saved in a cookie and on the profile (for emails). */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const choose = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    fetch("/api/agent/prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uiLang: next }) }).catch(() => {});
    router.refresh();
  };
  return (
    <div role="group" aria-label="Language / மொழி" className={`inline-flex rounded-pill border border-[#E4DED2] bg-white p-0.5 ${className}`}>
      {(["en", "ta"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={`h-9 px-4 rounded-pill text-sm font-semibold ${lang === l ? "bg-navy-900 text-gold-500" : "text-navy-800"}`}
        >
          {l === "en" ? "English" : "தமிழ்"}
        </button>
      ))}
    </div>
  );
}
