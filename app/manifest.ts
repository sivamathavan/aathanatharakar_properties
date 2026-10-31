import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Installable app (Add to Home Screen). Agents land on their dashboard.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — property pages for agents`,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    lang: "en",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
