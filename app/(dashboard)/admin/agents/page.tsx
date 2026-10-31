import { BRAND } from "@/lib/brand";
import { listAgents, propertiesCol } from "@/lib/firestore";
import { AgentsTable } from "@/components/admin/AgentsTable";
import { SITE_URL } from "@/lib/site";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Agents · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const agents = await listAgents();
  // One query for all agent listing counts (max 100 each, so this stays small).
  const snap = await propertiesCol().where("ownerType", "==", "AGENT").select("postedById", "status").get();
  const counts: Record<string, { total: number; live: number }> = {};
  snap.docs.forEach((d) => {
    const { postedById, status } = d.data();
    counts[postedById] ||= { total: 0, live: 0 };
    counts[postedById].total++;
    if (status === PropertyStatus.ACTIVE) counts[postedById].live++;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E4DED2] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Agents</h1>
        <p className="text-xs text-navy-700 mt-0.5">Everyone using {BRAND.name} for their own property page.</p>
      </div>
      <AgentsTable agents={JSON.parse(JSON.stringify(agents))} counts={counts} siteUrl={SITE_URL} />
    </div>
  );
}
