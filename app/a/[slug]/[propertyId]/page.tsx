import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { loadPublicAgent } from "@/lib/agent-public";
import { getOwnerProperties, getPlansConfig, getPropertyById } from "@/lib/firestore";
import { SITE_URL } from "@/lib/site";
import { formatINR, waNumber } from "@/lib/plans";
import { listingArea, listingKind } from "@/lib/listing-text";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { AgentContactCard, AgentPaused, AgentTopBar, PoweredBy } from "@/components/agent/AgentChrome";
import { AgentListings } from "@/components/agent/AgentListings";
import { JsonLd } from "@/components/seo/JsonLd";
import { PropertyStatus } from "@/types";

export const revalidate = 60;

// Rendered on first visit, then cached and refreshed every 60s or when the agent edits.
export async function generateStaticParams() {
  return [];
}

const SHOWN = [PropertyStatus.ACTIVE, PropertyStatus.SOLD, PropertyStatus.RENTED];

async function load(slug: string, propertyId: string) {
  const { agent, live } = await loadPublicAgent(slug);
  if (!agent) return null;
  const property = await getPropertyById(propertyId);
  if (!property || property.postedById !== agent.id || !SHOWN.includes(property.status)) return { agent, live, property: null };
  return { agent, live, property };
}

// The WhatsApp preview image comes from ./opengraph-image.tsx (photo, price, place, agent logo).
export async function generateMetadata({ params }: { params: { slug: string; propertyId: string } }): Promise<Metadata> {
  const data = await load(params.slug, params.propertyId);
  if (!data?.property) return { title: "Property not found" };
  const { agent, property, live } = data;
  const sold = property.status !== PropertyStatus.ACTIVE;
  const title = `${sold ? "Sold: " : ""}${property.title} — ${formatINR(property.price)}`;
  const description = `${listingKind(property)}, ${listingArea(property)} · ${property.locality}, ${property.city} · ${agent.displayName}${agent.agencyName ? `, ${agent.agencyName}` : ""}`;
  const url = `${SITE_URL}/a/${agent.slug}/${property.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: live && !sold ? undefined : { index: false },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AgentPropertyPage({ params }: { params: { slug: string; propertyId: string } }) {
  const data = await load(params.slug, params.propertyId);
  if (!data) notFound();
  const { agent, live, property } = data;
  if (agent.slug !== params.slug.toLowerCase()) permanentRedirect(`/a/${agent.slug}/${params.propertyId}`);
  if (!live) return <AgentPaused agent={agent} />;
  if (!property) notFound();
  const def = (await getPlansConfig()).plans[agent.plan.id];
  const url = `${SITE_URL}/a/${agent.slug}/${property.id}`;

  // A sold link keeps working: it says so and shows the agent's other listings.
  if (property.status !== PropertyStatus.ACTIVE) {
    const others = (await getOwnerProperties(agent.id, { activeOnly: true })).slice(0, 12);
    const word = property.status === PropertyStatus.RENTED ? "rented" : "sold";
    return (
      <>
        <AgentTopBar agent={agent} />
        <div className="bg-warm-cream">
          <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
            <div className="bg-white rounded-card border border-[#E4DED2] p-4 flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-full sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-navy-50 shrink-0">
                {property.media[0] && <Image src={property.media[0].url} alt="" fill className="object-cover grayscale-[40%]" sizes="200px" />}
              </div>
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-bold uppercase px-2 py-0.5 rounded-pill bg-navy-900 text-white">This property is {word}</span>
                <h1 className="font-display text-xl font-bold text-navy-900">{property.title}</h1>
                <p className="text-sm text-navy-700">{property.locality}, {property.city}</p>
                <p className="text-sm text-navy-800 pt-2">Looking for something similar? Here is what {agent.displayName} has now.</p>
              </div>
            </div>
            <AgentListings properties={JSON.parse(JSON.stringify(others))} slug={agent.slug} phone={agent.whatsapp} name={agent.displayName} agentId={agent.id} />
          </div>
        </div>
        <AgentContactCard agent={agent} />
        <PoweredBy hidden={def.branding && agent.hideFooter} />
      </>
    );
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.title,
          description: property.description,
          url,
          datePosted: new Date(property.createdAt).toISOString(),
          image: property.media.filter((m) => m.type === "IMAGE").map((m) => m.url).slice(0, 6),
          offers: { "@type": "Offer", price: property.price, priceCurrency: "INR", availability: "https://schema.org/InStock", seller: { "@type": "RealEstateAgent", name: agent.agencyName || agent.displayName, url: `${SITE_URL}/a/${agent.slug}` } },
          contentLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: property.locality, addressRegion: "Tamil Nadu", postalCode: property.pincode || undefined, addressCountry: "IN" } },
        }}
      />
      <AgentTopBar agent={agent} />
      <PropertyDetail
        property={property}
        contact={{ name: agent.displayName, subtitle: agent.agencyName || `Property agent, ${agent.city}`, phone: waNumber(agent.whatsapp), photoUrl: agent.photoUrl, verified: def.verifiedBadge, agentId: agent.id }}
        source="AGENT_PAGE"
        shareUrl={url}
        breadcrumbs={[{ label: agent.displayName, href: `/a/${agent.slug}` }]}
        privacyNote={`Your enquiry goes straight to ${agent.displayName}. Owner details are kept private.`}
      />
      <AgentContactCard agent={agent} />
      <PoweredBy hidden={def.branding && agent.hideFooter} />
    </>
  );
}
