"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { makeT, type Lang, type TFunc } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  // The root layout is shared with cached public pages, so <html lang> is set here.
  useEffect(() => {
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): TFunc {
  const lang = useContext(LangContext);
  return useMemo(() => makeT(lang), [lang]);
}
