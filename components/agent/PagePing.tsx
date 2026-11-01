"use client";

import { useEffect } from "react";

/** Counts one visit to an agent's page per browser session (for their stats). */
export function PagePing({ agentId }: { agentId: string }) {
  useEffect(() => {
    const key = `page:${agentId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "page", agentId }), keepalive: true }).catch(() => {});
  }, [agentId]);
  return null;
}
