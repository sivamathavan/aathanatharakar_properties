// Agent screens in English or Tamil. English text is the key, so code reads
// naturally and a missing Tamil line falls back to English instead of breaking.
// Pure: safe for client and server. tests/unit/i18n.test.ts checks that every
// t("...") used on agent screens has a Tamil line.
import { TA } from "@/lib/i18n/ta";

export type Lang = "en" | "ta";
export const LANG_COOKIE = "lang";

export type TFunc = (text: string, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  let out = lang === "ta" ? TA[text] ?? text : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function makeT(lang: Lang): TFunc {
  return (text, vars) => translate(lang, text, vars);
}

export function parseLang(value: string | null | undefined): Lang {
  return value === "ta" ? "ta" : "en";
}
