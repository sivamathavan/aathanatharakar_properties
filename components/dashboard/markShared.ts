"use client";

/** Tell the server the agent shared their link (once per browser is enough). */
export function markShared() {
  try {
    if (localStorage.getItem("pp-shared")) return;
    localStorage.setItem("pp-shared", "1");
  } catch {}
  fetch("/api/agent/prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shared: true }), keepalive: true }).catch(() => {});
}
