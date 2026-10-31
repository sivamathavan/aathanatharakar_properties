"use client";

import { usePathname } from "next/navigation";

/** Agent share pages show the agent's branding, so DK's site chrome steps aside. */
export function HideOnAgentPages({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/a/")) return null;
  return <>{children}</>;
}
