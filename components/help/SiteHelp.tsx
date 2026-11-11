"use client";

import { usePathname } from "next/navigation";
import { HelpWidget } from "@/components/help/HelpWidget";
import { BRAND } from "@/lib/brand";

/**
 * Pages written for agents get the help chat. Buyer pages never do: an agent's
 * own page (/a/…) and listing pages must show only that agent's WhatsApp and
 * Call, and the dashboard mounts its own copy (in Tamil when chosen).
 */
const AGENT_FACING = [/^\/$/, /^\/for-agents$/, /^\/about$/, /^\/app$/, /^\/blog(\/[^/]+)?$/, /^\/login$/, /^\/register$/, /^\/privacy$/, /^\/terms$/];

export function showSiteHelp(pathname: string) {
  return AGENT_FACING.some((re) => re.test(pathname));
}

export function SiteHelp() {
  const pathname = usePathname() || "";
  if (!showSiteHelp(pathname)) return null;
  return <HelpWidget surface="site" brand={BRAND.name} />;
}
