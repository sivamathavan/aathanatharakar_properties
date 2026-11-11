import { cookies, headers } from "next/headers";
import { LANG_COOKIE, makeT, parseLang, type Lang, type TFunc } from "@/lib/i18n";

/** Language from cookie, with automatic detection from mobile / browser headers as fallback. */
export function getLang(): Lang {
  const cookieVal = cookies().get(LANG_COOKIE)?.value;
  if (cookieVal) return parseLang(cookieVal);

  try {
    const accept = headers().get("accept-language")?.toLowerCase() || "";
    if (accept.includes("ta")) return "ta";
    if (accept.includes("hi")) return "hi";
    if (accept.includes("ml")) return "ml";
    if (accept.includes("kn")) return "kn";
  } catch {
    // Edge runtime fallback
  }

  return "en";
}

export function serverT(): TFunc {
  return makeT(getLang());
}
