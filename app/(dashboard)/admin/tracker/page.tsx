import { getSiteConfig } from "@/lib/firestore";
import { TrackerDashboard } from "@/components/tracker/TrackerDashboard";

export const metadata = { title: "Tracker | DK Promoters Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTrackerPage() {
  const site = await getSiteConfig();
  return (
    <div className="space-y-4">
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Tracker</h1>
        <p className="text-xs text-navy-700 mt-0.5">Your private back office: people, deals, documents, matching and money. Only admins can see it.</p>
      </div>
      <TrackerDashboard gstRegistered={!!site.gstin} />
    </div>
  );
}
