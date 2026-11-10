import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, parseLang, type Lang, type TFunc } from "@/lib/i18n";

/** Language for agent screens, from the cookie set by the language switch. */
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function serverT(): Promise<TFunc> {
  return makeT(await getLang());
}
