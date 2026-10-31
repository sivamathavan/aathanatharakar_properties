import { getPlansConfig, getSiteConfig } from "@/lib/firestore";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Plans & settings | DK Promoters Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [plans, site] = await Promise.all([getPlansConfig(), getSiteConfig()]);
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Plans &amp; settings</h1>
        <p className="text-xs text-navy-700 mt-0.5">New prices apply to the next payment. Agents already paid keep their time.</p>
      </div>
      <SettingsForm plans={plans} site={site} />
    </div>
  );
}
