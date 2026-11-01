import { requireAgentPage } from "@/lib/agent-session";
import { getLeadsForOwner, getOwnerProperties } from "@/lib/firestore";
import { serverT } from "@/lib/i18n/server";
import { LeadsInbox } from "@/components/dashboard/LeadsInbox";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

export default async function EnquiriesPage({ searchParams }: { searchParams: { view?: string } }) {
  const { agent } = await requireAgentPage();
  const t = serverT();
  const [leads, properties] = await Promise.all([getLeadsForOwner(agent.id), getOwnerProperties(agent.id)]);
  const listings = properties.filter((p) => p.status === PropertyStatus.ACTIVE || p.status === PropertyStatus.INACTIVE).map((p) => ({ id: p.id, title: p.title }));
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Enquiries")}</h1>
        <p className="text-sm text-navy-700">{t("People who asked about your listings. Call or WhatsApp them, set a follow-up date, book site visits.")}</p>
      </div>
      <LeadsInbox
        leads={JSON.parse(JSON.stringify(leads))}
        propertyBase={`/a/${agent.slug}`}
        listings={listings}
        initialView={searchParams.view === "today" ? "TODAY" : "ALL"}
        buyersEnabled
      />
    </div>
  );
}
