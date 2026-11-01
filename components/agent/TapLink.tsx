"use client";

// A link that also counts the tap for the agent's stats (WhatsApp, call, share).
// sendBeacon survives the page switching to WhatsApp or the dialer.
export type TapKind = "wa" | "call" | "share";

export function trackTap(kind: TapKind, agentId: string, propertyId?: string | null) {
  try {
    const body = JSON.stringify({ kind, agentId, propertyId: propertyId || null });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

export function TapLink({
  kind,
  agentId,
  propertyId,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { kind: TapKind; agentId: string; propertyId?: string | null }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        if (agentId) trackTap(kind, agentId, propertyId);
        props.onClick?.(e);
      }}
    />
  );
}
