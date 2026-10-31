import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getOwnerProperties, getSiteConfig } from "@/lib/firestore";
import { ListingsTable } from "@/components/dashboard/ListingsTable";
import { SITE_URL } from "@/lib/site";

export const metadata = { title: "My properties | DK Promoters" };
export const dynamic = "force-dynamic";

export default async function MyPropertiesPage() {
  const { agent, limits, plans } = await requireAgentPage();
  const [properties, site] = await Promise.all([getOwnerProperties(agent.id), getSiteConfig()]);
  const full = properties.length >= limits.listingLimit;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My properties</h1>
          <p className="text-sm text-navy-700">{properties.length} of {limits.listingLimit} listings used on your plan.</p>
        </div>
        {full ? (
          <Link href="/dashboard/billing" className="h-10 px-4 rounded-btn bg-gold-500 text-navy-900 font-bold text-sm inline-flex items-center">Upgrade for more listings</Link>
        ) : (
          <Link href="/dashboard/properties/new" className="h-10 px-4 rounded-btn bg-navy-900 text-gold-500 font-bold text-sm inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add property
          </Link>
        )}
      </div>
      <ListingsTable
        properties={JSON.parse(JSON.stringify(properties))}
        agentSlug={agent.slug}
        boostPricePerWeek={plans.boostPricePerWeek}
        showViews={limits.viewStats}
        upi={{ id: site.upiId, name: site.upiName }}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
