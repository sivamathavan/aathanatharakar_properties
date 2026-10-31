import { getAdminLeads } from "@/lib/firestore";
import { AdminLeads } from "@/components/admin/AdminLeads";

export const metadata = { title: "Website enquiries · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await getAdminLeads();
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#E4DED2] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Website enquiries</h1>
        <p className="text-xs text-navy-700 mt-0.5">Buyers who asked about your listings on the main site. Agents' enquiries stay with the agents.</p>
      </div>
      <AdminLeads leads={JSON.parse(JSON.stringify(leads))} />
    </div>
  );
}
