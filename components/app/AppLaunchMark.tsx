"use client";

import { useEffect } from "react";
import { readAppOffer } from "@/lib/app-install";

/**
 * Notes a launch from the Android app on whichever page opens first. A signed-out
 * agent starts on /login, so the dashboard alone would miss it.
 */
export function AppLaunchMark() {
  useEffect(() => {
    readAppOffer();
  }, []);
  return null;
}
