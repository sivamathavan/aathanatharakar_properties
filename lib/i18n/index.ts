// Multilingual support: English and Tamil active by default, with architectural foundation
// and translation dictionaries established for future expansion to Hindi, Malayalam, and Kannada.
// English text is the key, so code reads naturally and missing keys fall back gracefully to English.
import { TA } from "@/lib/i18n/ta";
import { HI } from "@/lib/i18n/hi";
import { ML } from "@/lib/i18n/ml";
import { KN } from "@/lib/i18n/kn";

export type Lang = "en" | "ta" | "hi" | "ml" | "kn";
export const LANG_COOKIE = "lang";

export interface LanguageMeta {
  code: Lang;
  label: string;       // Native script: "English", "தமிழ்", "हिन्दी", "മലയാളം", "ಕನ್ನಡ"
  name: string;        // English name: "English", "Tamil", "Hindi", "Malayalam", "Kannada"
  enabled: boolean;    // true for active default languages (en, ta); ready for future (hi, ml, kn)
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English", name: "English", enabled: true },
  { code: "ta", label: "தமிழ்", name: "Tamil", enabled: true },
  { code: "hi", label: "हिन्दी", name: "Hindi", enabled: false },
  { code: "ml", label: "മലയാളം", name: "Malayalam", enabled: false },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada", enabled: false },
];

const DICTIONARIES: Record<Lang, Record<string, string>> = {
  en: {},
  ta: TA,
  hi: HI,
  ml: ML,
  kn: KN,
};

export type TFunc = (text: string, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  const dict = DICTIONARIES[lang];
  let out = (dict && dict[text]) ?? (lang === "ta" ? (TA[text] ?? text) : text);
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function makeT(lang: Lang): TFunc {
  return (text, vars) => translate(lang, text, vars);
}

export function parseLang(value: string | null | undefined): Lang {
  if (value === "ta" || value === "hi" || value === "ml" || value === "kn") return value;
  return "en";
}
