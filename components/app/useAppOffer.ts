"use client";

import { useEffect, useState } from "react";
import { readAppOffer, type AppOffer } from "@/lib/app-install";

/** Null until mounted: the answer depends on the phone, so the server can't know it. */
export function useAppOffer(): AppOffer | null {
  const [offer, setOffer] = useState<AppOffer | null>(null);
  useEffect(() => setOffer(readAppOffer()), []);
  return offer;
}
