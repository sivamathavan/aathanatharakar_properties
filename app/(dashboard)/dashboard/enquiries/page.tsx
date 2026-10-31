import { requireAgentPage } from "@/lib/agent-session";
import { getLeadsForOwner } from "@/lib/firestore";
import { LeadsInbox } from "@/components/dashboard/LeadsInbox";

export const metadata = { title: "Enquiries | DK Promoters" };
export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const { agent } = await requireAgentPage();
  const leads = await getLeadsForOwner(agent.id);
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Enquiries</h1>
        <p className="text-sm text-navy-700">People who asked about your listings. Call or WhatsApp them, then update the status.</p>
      </div>
      <LeadsInbox leads={JSON.parse(JSON.stringify(leads))} propertyBase={`/a/${agent.slug}`} />
    </div>
  );
}
