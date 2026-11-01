"use client";

import { usePathname } from "next/navigation";

/**
 * Agent share pages show the agent's branding, so the site's own header and footer
 * step aside. With `alsoApp`, the wrapped part is also hidden inside the agent
 * dashboard and admin, where the marketing footer is only clutter.
 */
export function HideOnAgentPages({ children, alsoApp = false }: { children: React.ReactNode; alsoApp?: boolean }) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/a/")) return null;
  if (alsoApp && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) return null;
  return <>{children}</>;
}
