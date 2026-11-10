import { requireAgentPage } from "@/lib/agent-session";
import { getLeadById, getOwnerProperties } from "@/lib/firestore";
import { getBuyersForOwner } from "@/lib/buyers";
import { SITE_URL } from "@/lib/site";
import { serverT } from "@/lib/i18n/server";
import { BuyersBoard, type BuyerRow, type MatchListing } from "@/components/dashboard/BuyersBoard";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Buyers" };
export const dynamic = "force-dynamic";

export default async function BuyersPage(props: { searchParams: Promise<{ fromLead?: string }> }) {
  const searchParams = await props.searchParams;
  const { agent } = await requireAgentPage();
  const t = await serverT();
  const [buyers, properties, lead] = await Promise.all([
    getBuyersForOwner(agent.id),
    getOwnerProperties(agent.id, { activeOnly: true }),
    searchParams.fromLead ? getLeadById(searchParams.fromLead) : Promise.resolve(null),
  ]);
  const listings: MatchListing[] = properties
    .filter((p) => p.status === PropertyStatus.ACTIVE)
    .map((p) => ({ id: p.id, title: p.title, price: p.price, priceUnit: p.priceUnit, type: p.type, listingType: p.listingType, city: p.city, locality: p.locality, address: p.address, bedrooms: p.bedrooms ?? null, area: p.area, areaUnit: p.areaUnit ?? null, photo: p.media[0]?.url || null }));
  // "Save as buyer" from an enquiry fills in the name, phone and what they said.
  const prefill = lead && lead.ownerId === agent.id ? { name: lead.name, phone: lead.phone, notes: lead.message || null, leadId: lead.id, listingType: "BUY" as const, types: [], localities: [], status: "ACTIVE" as const } : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Buyers")}</h1>
        <p className="text-sm text-navy-700">{t("What each client wants, and which of your listings match. Only you can see this list.")}</p>
      </div>
      <BuyersBoard buyers={JSON.parse(JSON.stringify(buyers)) as BuyerRow[]} listings={listings} pageBase={`${SITE_URL}/a/${agent.slug}`} prefill={prefill} />
    </div>
  );
}
