import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicAgent } from "@/lib/agent-public";
import { getOwnerProperties, getPlansConfig } from "@/lib/firestore";
import { SITE_URL } from "@/lib/site";
import { AgentHeader, AgentPaused, PoweredBy } from "@/components/agent/AgentChrome";
import { AgentListings } from "@/components/agent/AgentListings";

export const revalidate = 60;

// Rendered on first visit, then cached and refreshed every 60s or when the agent edits.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { agent, live } = await loadPublicAgent(params.slug);
  if (!agent) return { title: "Page not found" };
  const title = `${agent.displayName}${agent.agencyName ? ` — ${agent.agencyName}` : ""} | Properties in ${agent.city}`;
  const description = agent.bio || `Browse properties from ${agent.displayName} in ${agent.city}. Call or WhatsApp directly.`;
  return {
    title,
    description,
    robots: live ? undefined : { index: false },
    openGraph: { title, description, url: `${SITE_URL}/a/${agent.slug}`, images: agent.photoUrl ? [{ url: agent.photoUrl }] : undefined, type: "profile" },
  };
}

export default async function AgentPage({ params }: { params: { slug: string } }) {
  const { agent, live } = await loadPublicAgent(params.slug);
  if (!agent) notFound();
  if (!live) return <AgentPaused agent={agent} />;

  const [properties, plans] = await Promise.all([getOwnerProperties(agent.id, { activeOnly: true }), getPlansConfig()]);
  const def = plans.plans[agent.plan.id];

  return (
    <div className="min-h-screen bg-warm-cream">
      <AgentHeader agent={agent} showLogo={def.branding} verified={def.verifiedBadge} />
      <div className="container mx-auto px-4 max-w-6xl py-6 md:py-10">
        <AgentListings properties={JSON.parse(JSON.stringify(properties))} slug={agent.slug} phone={agent.whatsapp} name={agent.displayName} />
      </div>
      <PoweredBy />
    </div>
  );
}
