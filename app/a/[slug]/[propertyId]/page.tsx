import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicAgent } from "@/lib/agent-public";
import { getPlansConfig, getPropertyById } from "@/lib/firestore";
import { SITE_URL } from "@/lib/site";
import { formatINR, waNumber } from "@/lib/plans";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { AgentPaused, PoweredBy } from "@/components/agent/AgentChrome";
import { PropertyStatus } from "@/types";

export const revalidate = 60;

// Rendered on first visit, then cached and refreshed every 60s or when the agent edits.
export async function generateStaticParams() {
  return [];
}

async function load(slug: string, propertyId: string) {
  const { agent, live } = await loadPublicAgent(slug);
  if (!agent) return null;
  const property = await getPropertyById(propertyId);
  if (!property || property.postedById !== agent.id || property.status !== PropertyStatus.ACTIVE) return { agent, live, property: null };
  return { agent, live, property };
}

// The WhatsApp preview (photo, price, place) comes from these tags.
export async function generateMetadata({ params }: { params: { slug: string; propertyId: string } }): Promise<Metadata> {
  const data = await load(params.slug, params.propertyId);
  if (!data?.property) return { title: "Property not found" };
  const { agent, property, live } = data;
  const title = `${property.title} — ${formatINR(property.price)}`;
  const description = `${property.locality}, ${property.city} · ${agent.displayName}${agent.agencyName ? `, ${agent.agencyName}` : ""}`;
  const image = property.media?.find((m) => m.type === "IMAGE")?.url;
  return {
    title,
    description,
    robots: live ? undefined : { index: false },
    openGraph: { title, description, url: `${SITE_URL}/a/${agent.slug}/${property.id}`, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function AgentPropertyPage({ params }: { params: { slug: string; propertyId: string } }) {
  const data = await load(params.slug, params.propertyId);
  if (!data) notFound();
  const { agent, live, property } = data;
  if (!live) return <AgentPaused agent={agent} />;
  if (!property) notFound();
  const def = (await getPlansConfig()).plans[agent.plan.id];

  return (
    <>
      <div className="bg-navy-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl h-12 flex items-center justify-between text-sm">
          <Link href={`/a/${agent.slug}`} className="font-semibold text-gold-400 hover:underline">← All properties from {agent.displayName}</Link>
        </div>
      </div>
      <PropertyDetail
        property={property}
        contact={{ name: agent.displayName, subtitle: agent.agencyName || `Property agent, ${agent.city}`, phone: waNumber(agent.whatsapp), photoUrl: agent.photoUrl, verified: def.verifiedBadge }}
        source="AGENT_PAGE"
        shareUrl={`${SITE_URL}/a/${agent.slug}/${property.id}`}
        breadcrumbs={[{ label: agent.displayName, href: `/a/${agent.slug}` }]}
        privacyNote={`Your enquiry goes straight to ${agent.displayName}. Owner details are kept private.`}
      />
      <PoweredBy />
    </>
  );
}
