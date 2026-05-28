"use client";

import { useEffect } from "react";

export function ViewPing({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const key = `viewed:${propertyId}`;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch(`/api/properties/${propertyId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }, [propertyId]);

  return null;
}
