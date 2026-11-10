import { BRAND } from "@/lib/brand";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/firestore";
import { loadListing } from "@/lib/listing-page";
import { SITE_URL } from "@/lib/site";
import { waNumber } from "@/lib/plans";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { PropertyStatus } from "@/types";

export const revalidate = 60;

function describe(p: { bedrooms?: number | null; type: string; listingType: string; locality: string; city: string; price: number }) {
  const kind = `${p.bedrooms ? `${p.bedrooms}BHK ` : ""}${p.type.replace("_", " ").toLowerCase()}`;
  return `${kind} for ${p.listingType === "RENT" ? "rent" : p.listingType === "LEASE" ? "lease" : "sale"} in ${p.locality}, ${p.city} — ₹${Number(p.price).toLocaleString("en-IN")}`;
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const property = (await loadListing(params.id))?.property;
  if (!property || property.status !== PropertyStatus.ACTIVE) return { title: "Property not found" };
  const title = property.title;
  const description = describe(property);
  const image = property.media?.find((m) => m.type === "IMAGE")?.url || `${SITE_URL}/icons/icon.svg`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/properties/${property.id}` },
    openGraph: { title, description, url: `${SITE_URL}/properties/${property.id}`, images: [{ url: image, width: 1200, height: 630 }], locale: "en_IN", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PropertyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // ./layout.tsx has already answered 404 when this is null.
  const listing = await loadListing(params.id);
  if (!listing) notFound();
  const { property, agent } = listing;

  if (agent) {
    return (
      <PropertyDetail
        property={property}
        contact={{ name: agent.displayName, subtitle: agent.agencyName || `Property agent, ${agent.city}`, phone: waNumber(agent.whatsapp), photoUrl: agent.photoUrl }}
        source="AGENT_PAGE"
        shareUrl={`${SITE_URL}/a/${agent.slug}/${property.id}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Properties", href: "/properties" }]}
        privacyNote={`Your enquiry goes straight to ${agent.displayName}.`}
      />
    );
  }

  const site = await getSiteConfig();
  return (
    <PropertyDetail
      property={property}
      contact={{ name: BRAND.name, subtitle: `Listed by ${BRAND.name}`, phone: waNumber(site.brokerWhatsapp) }}
      source="WEB"
      shareUrl={`${SITE_URL}/properties/${property.id}`}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Properties", href: "/properties" }]}
      privacyNote={`Your enquiry goes to the ${BRAND.name} team. Owner contact details are never shared publicly.`}
    />
  );
}
