"use client";

// Last-resort page when the root layout itself fails. It replaces the whole
// document, so it carries its own <html> and plain inline styles.
import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[GLOBAL_ERROR]", error);
  }, [error]);
  const btn = { display: "inline-block", minHeight: 44, padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", cursor: "pointer" } as const;
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: BRAND.backgroundColor, color: BRAND.themeColor }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 26, margin: "0 0 12px" }}>{BRAND.name} is having trouble</h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: "0 0 24px" }}>Please try again in a moment. Your listings and enquiries are safe.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => reset()} style={{ ...btn, border: 0, background: BRAND.themeColor, color: "#fff" }}>Try again</button>
              <a href="/" style={{ ...btn, border: `1px solid ${BRAND.themeColor}`, color: BRAND.themeColor }}>Go to home page</a>
            </div>
            {(BRAND.supportWhatsapp || BRAND.supportEmail) && (
              <p style={{ fontSize: 14, marginTop: 24 }}>
                Still stuck?{" "}
                {BRAND.supportWhatsapp ? <a href={`https://wa.me/${BRAND.supportWhatsapp}`} style={{ color: BRAND.themeColor }}>WhatsApp us</a> : <a href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.themeColor }}>{BRAND.supportEmail}</a>}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
