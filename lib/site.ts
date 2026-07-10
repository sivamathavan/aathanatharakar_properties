// Canonical site URL — used by sitemap, robots, Open Graph tags.
// Set NEXT_PUBLIC_SITE_URL in production to override.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://www.dkpromoters.in"
).replace(/\/$/, "");
