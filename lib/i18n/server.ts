import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, parseLang, type Lang, type TFunc } from "@/lib/i18n";

/** Language for agent screens, from the cookie set by the language switch. */
export function getLang(): Lang {
  return parseLang(cookies().get(LANG_COOKIE)?.value);
}

export function serverT(): TFunc {
  return makeT(getLang());
}
