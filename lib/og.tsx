// Helpers for the WhatsApp / social preview images (next/og). Server only.

/**
 * Fetch an image and return it as a data URL the preview renderer can draw.
 * Only JPEG and PNG (the renderer can't draw WebP); gives up after 4 seconds
 * so a slow Storage read never blocks a preview.
 */
export async function imageDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0];
    if (type !== "image/jpeg" && type !== "image/png") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The ₹ sign as a vector (the preview renderer's built-in font has no ₹ glyph).
 * Paths from the Lucide "indian-rupee" icon.
 */
export function rupeeSvg(color: string, size: number) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: size * 0.05 }}>
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}
