"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LANG_COOKIE, SUPPORTED_LANGUAGES, type Lang, type LanguageMeta } from "@/lib/i18n";
import { useLang } from "@/components/i18n/I18nProvider";

interface NavLanguageSwitchProps {
  className?: string;
  mobile?: boolean;
  onSelect?: () => void;
}

export function NavLanguageSwitch({ className = "", mobile = false, onSelect }: NavLanguageSwitchProps) {
  const currentLang = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectLanguage = (target: LanguageMeta) => {
    // If the language is not yet active, we still set the cookie and preview the scaffold
    const next = target.code;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    fetch("/api/agent/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uiLang: next }),
    }).catch(() => {});
    setOpen(false);
    onSelect?.();
    router.refresh();
  };

  const currentMeta = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Mobile layout: Compact segmented buttons for active languages + expandable scaffold
  if (mobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Active Languages (English & Tamil) */}
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Select language">
          {SUPPORTED_LANGUAGES.filter((l) => l.enabled).map((lang) => {
            const active = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang)}
                className={`h-11 px-3 rounded-btn text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  active
                    ? "bg-gold-500 text-navy-900 border-gold-400 font-bold shadow-sm"
                    : "bg-navy-800 text-gray-200 border-navy-700 hover:bg-navy-750"
                }`}
              >
                <span>{lang.label}</span>
                {active && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>

        {/* Future Languages Foundation (Hindi, Malayalam, Kannada) */}
        <div className="rounded-card border border-navy-800 bg-navy-850/60 p-2.5">
          <p className="text-[11px] font-semibold text-gray-400 mb-2 px-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-gold-400" />
            <span>More languages (Scaffold ready)</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {SUPPORTED_LANGUAGES.filter((l) => !l.enabled).map((lang) => {
              const active = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang)}
                  className={`py-2 px-1 rounded-btn text-xs font-medium text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    active
                      ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                      : "bg-navy-900/60 text-gray-300 border-navy-800 hover:border-navy-700"
                  }`}
                  title={`${lang.name} (Foundation preview)`}
                >
                  <span className="font-semibold">{lang.label}</span>
                  <span className="text-[9px] uppercase tracking-wider text-gold-400/90 font-mono">Soon</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Navbar layout: Elegant dropdown button matching navbar aesthetic
  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 px-2.5 rounded-btn border border-navy-700 bg-navy-800/80 hover:bg-navy-800 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
      >
        <Globe className="w-4 h-4 text-gold-400 shrink-0" />
        <span className="tracking-wide">{currentMeta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-180 text-gold-400" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language selection"
          className="absolute right-0 mt-1.5 w-52 rounded-card bg-navy-900 border border-navy-700 shadow-xl py-1.5 z-[60] focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-navy-800">
            Language / மொழி
          </div>

          {/* Active Languages (English & Tamil) */}
          <div className="py-1">
            {SUPPORTED_LANGUAGES.filter((l) => l.enabled).map((lang) => {
              const active = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selectLanguage(lang)}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    active ? "bg-navy-800 text-gold-400 font-semibold" : "text-gray-200 hover:bg-navy-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">{lang.label}</span>
                    <span className="text-[10px] text-gray-400">{lang.name}</span>
                  </div>
                  {active && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Future Languages Basement Header */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-t border-navy-800 flex items-center justify-between">
            <span>Upcoming / விரைவில்</span>
          </div>

          {/* Future Languages (Hindi, Malayalam, Kannada) */}
          <div className="py-0.5">
            {SUPPORTED_LANGUAGES.filter((l) => !l.enabled).map((lang) => {
              const active = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selectLanguage(lang)}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    active ? "bg-navy-800 text-gold-300" : "text-gray-300 hover:bg-navy-800/40 hover:text-white"
                  }`}
                  title={`${lang.name} — Basement scaffold ready`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">{lang.label}</span>
                    <span className="text-[10px] text-gray-400">({lang.name})</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-pill bg-navy-800 text-gold-400 border border-navy-700">
                    Soon
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

