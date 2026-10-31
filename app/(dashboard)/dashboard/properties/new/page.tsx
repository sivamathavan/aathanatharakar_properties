import Link from "next/link";
import { requireAgentPage } from "@/lib/agent-session";
import { countOwnerProperties } from "@/lib/firestore";
import { isPlanLive } from "@/lib/plans";
import { PropertyForm } from "@/components/property/PropertyForm";

export const metadata = { title: "Add property | DK Promoters" };
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const { agent, limits } = await requireAgentPage();
  const used = await countOwnerProperties(agent.id);

  if (!isPlanLive(agent.plan) || used >= limits.listingLimit) {
    return (
      <div className="max-w-xl bg-white rounded-card border border-[#E8E0D0] p-6 space-y-3">
        <h1 className="text-xl font-bold text-navy-900">You can&apos;t add more listings right now</h1>
        <p className="text-sm text-navy-700">
          {isPlanLive(agent.plan)
            ? `Your ${limits.name} plan allows ${limits.listingLimit} listings and you have ${used}. Delete an old one or upgrade.`
            : "Your plan has ended. Renew it to add listings."}
        </p>
        <Link href="/dashboard/billing" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">See plans</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Add property</h1>
        <p className="text-sm text-navy-700">It goes live on your page as soon as you publish.</p>
      </div>
      <PropertyForm storageFolder={`properties/${agent.id}`} photoLimit={limits.photoLimit} doneHref="/dashboard/properties" />
    </div>
  );
}
