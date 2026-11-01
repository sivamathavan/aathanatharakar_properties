// Agent page themes. Pure: safe for client and server.
// Every preset is a dark background with white text and one accent colour.
// tests/unit/agent-brand.test.ts checks that white text and the accent both
// stay readable (WCAG 4.5:1) on the background, so agents can't pick a theme
// that makes their phone number hard to read.

export interface BrandPreset {
  id: string;
  name: string;
  bg: string; // header and buttons
  accent: string; // call button, highlights
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: "teal", name: "Teal", bg: "#0C2B29", accent: "#E39614" },
  { id: "navy", name: "Navy", bg: "#14213D", accent: "#FCA311" },
  { id: "maroon", name: "Maroon", bg: "#5C1A1B", accent: "#F2C14E" },
  { id: "forest", name: "Forest", bg: "#1B4332", accent: "#95D5B2" },
  { id: "plum", name: "Plum", bg: "#3C1642", accent: "#F7B32B" },
  { id: "charcoal", name: "Charcoal", bg: "#222831", accent: "#4FD1C5" },
  { id: "ocean", name: "Ocean", bg: "#023E58", accent: "#FFD166" },
  { id: "earth", name: "Earth", bg: "#3E2723", accent: "#FFB74D" },
  { id: "indigo", name: "Indigo", bg: "#2B2D72", accent: "#F9C74F" },
  { id: "crimson", name: "Crimson", bg: "#7A0C1A", accent: "#FFD166" },
  { id: "olive", name: "Olive", bg: "#283618", accent: "#DDA15E" },
  { id: "black", name: "Black & gold", bg: "#111111", accent: "#D4AF37" },
];

export const DEFAULT_BRAND_COLOR = "teal";

export function brandPreset(id: string | null | undefined): BrandPreset {
  return BRAND_PRESETS.find((p) => p.id === id) || BRAND_PRESETS[0];
}

export const AGENT_LANGUAGES = ["Tamil", "English", "Telugu", "Malayalam", "Kannada", "Hindi"] as const;

export const SOCIAL_KEYS = ["website", "facebook", "instagram", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255]
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/** WCAG contrast ratio between two #RRGGBB colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Link names agents may choose: 3–40 lowercase letters, digits and single hyphens. */
export function validSlugChoice(slug: string): string | null {
  if (slug.length < 3) return "Use at least 3 letters.";
  if (slug.length > 40) return "Use 40 letters or fewer.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use only English letters, numbers and hyphens.";
  return null;
}

/** Images on an agent profile must come from that agent's own Storage folder (empty = removed). */
export function ownAgentImage(url: string, uid: string): boolean {
  return url === "" || url.includes(encodeURIComponent(`agents/${uid}/`));
}
