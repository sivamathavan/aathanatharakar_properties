import { ImageResponse } from "next/og";
import { loadPublicAgent } from "@/lib/agent-public";
import { brandPreset } from "@/lib/agent-brand";
import { imageDataUrl, OG_SIZE } from "@/lib/og";
import { isLatin } from "@/lib/listing-text";
import { BRAND } from "@/lib/brand";

// WhatsApp preview for an agent's page: their photo and logo on their colour.
export const runtime = "nodejs";
export const revalidate = 300;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Property agent page";

export default async function Image({ params }: { params: { slug: string } }) {
  const { agent } = await loadPublicAgent(params.slug);
  const theme = brandPreset(agent?.brandColor);
  const [photo, logo] = await Promise.all([imageDataUrl(agent?.photoUrl), imageDataUrl(agent?.logoUrl)]);
  const name = agent && isLatin(agent.displayName) ? agent.displayName : null;
  const agency = agent && isLatin(agent.agencyName) ? agent.agencyName : null;
  const tagline = agent && isLatin(agent.tagline) ? agent.tagline : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", background: theme.bg, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={200} height={200} style={{ width: 200, height: 200, borderRadius: 100, objectFit: "cover", border: `6px solid ${theme.accent}`, marginRight: 48 }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 72, lineHeight: 1.1 }}>{agency || name || BRAND.name}</div>
            {agency && name && <div style={{ fontSize: 40, marginTop: 12, color: theme.accent }}>{name}</div>}
            {tagline && <div style={{ fontSize: 32, marginTop: 16, opacity: 0.85 }}>{tagline}</div>}
          </div>
          {logo && (
            <div style={{ display: "flex", width: 180, height: 180, background: "#fff", borderRadius: 24, padding: 14, marginLeft: 32 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" width={152} height={152} style={{ objectFit: "contain", width: 152, height: 152 }} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 34, color: theme.accent }}>
          {agent ? `Properties in ${agent.city} · Call or WhatsApp directly` : BRAND.tagline}
        </div>
      </div>
    ),
    size
  );
}
