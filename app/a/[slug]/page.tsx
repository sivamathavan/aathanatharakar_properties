import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { loadPublicAgent } from "@/lib/agent-public";
import { getOwnerProperties, getPlansConfig } from "@/lib/firestore";
import { SITE_URL } from "@/lib/site";
import { AgentContactCard, AgentHeader, AgentPaused, PoweredBy } from "@/components/agent/AgentChrome";
import { AgentListings } from "@/components/agent/AgentListings";
import { JsonLd } from "@/components/seo/JsonLd";
import { PagePing } from "@/components/agent/PagePing";
import { PropertyStatus } from "@/types";

export const revalidate = 60;

// Rendered on first visit, then cached and refreshed every 60s or when the agent edits.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { agent, live } = await loadPublicAgent(params.slug);
  if (!agent) return { title: "Page not found" };
  const title = `${agent.displayName}${agent.agencyName ? ` — ${agent.agencyName}` : ""} | Properties in ${agent.city}`;
  const description = agent.tagline || agent.bio || `Browse properties from ${agent.displayName} in ${agent.city}. Call or WhatsApp directly.`;
  const url = `${SITE_URL}/a/${agent.slug}`;
  // The preview image comes from ./opengraph-image.tsx.
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: live ? undefined : { index: false },
    openGraph: { title, description, url, type: "profile" },
  };
}

export default async function AgentPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { agent, live } = await loadPublicAgent(params.slug);
  if (!agent) notFound();
  if (agent.slug !== params.slug.toLowerCase()) permanentRedirect(`/a/${agent.slug}`);
  if (!live) return <AgentPaused agent={agent} />;

  const [all, plans] = await Promise.all([getOwnerProperties(agent.id), getPlansConfig()]);
  const def = plans.plans[agent.plan.id];
  const properties = all.filter((p) => p.status === PropertyStatus.ACTIVE);
  const sold = agent.showSold
    ? all
        .filter((p) => p.status === PropertyStatus.SOLD || p.status === PropertyStatus.RENTED)
        .sort((a, b) => new Date(b.soldAt || b.updatedAt).getTime() - new Date(a.soldAt || a.updatedAt).getTime())
        .slice(0, 6)
    : [];
  const url = `${SITE_URL}/a/${agent.slug}`;

  return (
    <div className="min-h-screen bg-warm-cream">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: agent.agencyName || agent.displayName,
          ...(agent.agencyName ? { employee: { "@type": "Person", name: agent.displayName } } : {}),
          url,
          telephone: `+${agent.whatsapp.replace(/[^0-9]/g, "")}`,
          image: agent.logoUrl || agent.photoUrl || undefined,
          description: agent.tagline || agent.bio || undefined,
          address: { "@type": "PostalAddress", streetAddress: agent.officeAddress || undefined, addressLocality: agent.city, addressRegion: "Tamil Nadu", addressCountry: "IN" },
          areaServed: agent.city,
          knowsLanguage: agent.languages?.length ? agent.languages : undefined,
          sameAs: Object.values(agent.social || {}).filter(Boolean),
        }}
      />
      <PagePing agentId={agent.id} />
      <AgentHeader agent={agent} verified={def.verifiedBadge} pro={def.branding} />
      <div className="container mx-auto px-4 max-w-6xl py-6 md:py-10 space-y-10">
        <AgentListings properties={JSON.parse(JSON.stringify(properties))} slug={agent.slug} phone={agent.whatsapp} name={agent.displayName} agentId={agent.id} />
        {sold.length > 0 && (
          <section aria-labelledby="sold-heading" className="space-y-4">
            <h2 id="sold-heading" className="font-display text-xl font-bold text-navy-900">Recently sold &amp; rented</h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sold.map((p) => (
                <li key={p.id} className="bg-white rounded-card border border-[#E4DED2] overflow-hidden">
                  <div className="relative aspect-[4/3] bg-navy-50">
                    {p.media[0] && <Image src={p.media[0].url} alt="" fill className="object-cover grayscale-[40%]" sizes="(max-width: 768px) 50vw, 33vw" />}
                    <span className="absolute top-2 left-2 text-[11px] font-bold uppercase px-2 py-0.5 rounded-pill bg-navy-900 text-white">{p.status === PropertyStatus.RENTED ? "Rented" : "Sold"}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-navy-900 truncate">{p.title}</p>
                    <p className="text-xs text-navy-700 truncate">{p.locality}, {p.city}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <AgentContactCard agent={agent} />
      <PoweredBy hidden={def.branding && agent.hideFooter} />
    </div>
  );
}
