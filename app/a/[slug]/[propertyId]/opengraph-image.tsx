import { ImageResponse } from "next/og";
import { loadPublicAgent } from "@/lib/agent-public";
import { getPropertyById } from "@/lib/firestore";
import { brandPreset } from "@/lib/agent-brand";
import { imageDataUrl, OG_SIZE, rupeeSvg } from "@/lib/og";
import { isLatin, listingArea, listingKind, shortPrice } from "@/lib/listing-text";
import { BRAND } from "@/lib/brand";

// WhatsApp preview for one listing: photo, price, place and the agent's logo in
// their colour. Text comes from fixed English fields so it always renders; names
// typed in Tamil are left out rather than drawn wrongly.
export const runtime = "nodejs";
export const revalidate = 300;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Property photo with price and agent";

export default async function Image({ params }: { params: { slug: string; propertyId: string } }) {
  const { agent } = await loadPublicAgent(params.slug);
  const property = agent ? await getPropertyById(params.propertyId) : null;
  const theme = brandPreset(agent?.brandColor);

  if (!agent || !property || property.postedById !== agent.id) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: "#fff", fontSize: 56 }}>{BRAND.name}</div>,
      size
    );
  }

  const [photo, logo] = await Promise.all([
    imageDataUrl(property.media.find((m) => m.type === "IMAGE")?.url),
    imageDataUrl(agent.logoUrl || agent.photoUrl),
  ]);
  const who = [agent.agencyName, agent.displayName].filter(isLatin);
  const sold = property.status === "SOLD" || property.status === "RENTED";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: theme.bg, color: "#fff" }}>
        {photo && (
          <div style={{ width: 690, height: "100%", display: "flex", position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" width={690} height={630} style={{ objectFit: "cover", width: 690, height: 630 }} />
            {sold && (
              <div style={{ position: "absolute", top: 32, left: 32, display: "flex", background: "#111", color: "#fff", fontSize: 30, padding: "8px 20px", borderRadius: 12 }}>
                {property.status === "RENTED" ? "RENTED" : "SOLD"}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 44px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: photo ? 64 : 88, color: theme.accent, lineHeight: 1.1 }}>
              {rupeeSvg(theme.accent, photo ? 56 : 76)}
              {shortPrice(property).replace(/^₹/, "")}
            </div>
            <div style={{ fontSize: 34, marginTop: 20, lineHeight: 1.25 }}>{listingKind(property)}</div>
            <div style={{ fontSize: 30, marginTop: 10, opacity: 0.85 }}>{listingArea(property)}</div>
            <div style={{ fontSize: 30, marginTop: 10, opacity: 0.85 }}>{isLatin(property.locality) ? `${property.locality}, ${property.city}` : property.city}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {logo && (
              <div style={{ display: "flex", width: 96, height: 96, background: "#fff", borderRadius: 16, padding: 8, marginRight: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" width={80} height={80} style={{ objectFit: "contain", width: 80, height: 80 }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {who[0] && <div style={{ fontSize: 30 }}>{who[0]}</div>}
              {who[1] && <div style={{ fontSize: 24, opacity: 0.8, marginTop: 4 }}>{who[1]}</div>}
              {!who.length && <div style={{ fontSize: 28 }}>{agent.city}</div>}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
