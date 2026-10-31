import { BRAND } from "@/lib/brand";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAgentById, getPropertyById, getSiteConfig } from "@/lib/firestore";
import { getServerUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { isPlanLive, waNumber } from "@/lib/plans";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { PropertyStatus, UserRole } from "@/types";

export const revalidate = 60;

function describe(p: { bedrooms?: number | null; type: string; listingType: string; locality: string; city: string; price: number }) {
  const kind = `${p.bedrooms ? `${p.bedrooms}BHK ` : ""}${p.type.replace("_", " ").toLowerCase()}`;
  return `${kind} for ${p.listingType === "RENT" ? "rent" : p.listingType === "LEASE" ? "lease" : "sale"} in ${p.locality}, ${p.city} — ₹${Number(p.price).toLocaleString("en-IN")}`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await getPropertyById(params.id);
  if (!property || property.status !== PropertyStatus.ACTIVE) return { title: "Property not found" };
  const title = property.title;
  const description = describe(property);
  const image = property.media?.find((m) => m.type === "IMAGE")?.url || `${SITE_URL}/icons/icon.svg`;
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/properties/${property.id}`, images: [{ url: image, width: 1200, height: 630 }], locale: "en_IN", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = await getPropertyById(params.id);
  if (!property) notFound();

  const isPublic = property.status === PropertyStatus.ACTIVE;
  if (!isPublic) {
    const session = await getServerUser();
    if (!session || (session.role !== UserRole.ADMIN && session.uid !== property.postedById)) notFound();
  }

  // Agent listings on the main site are boosted ones; calls go to the agent.
  if (property.ownerType === "AGENT") {
    const agent = await getAgentById(property.postedById);
    if (!agent || !isPlanLive(agent.plan)) notFound();
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
