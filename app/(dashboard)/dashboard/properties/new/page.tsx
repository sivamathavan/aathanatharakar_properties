import Link from "next/link";
import { requireAgentPage } from "@/lib/agent-session";
import { countOwnerProperties } from "@/lib/firestore";
import { hasPlanTime } from "@/lib/plans";
import { PropertyForm } from "@/components/property/PropertyForm";
import { serverT } from "@/lib/i18n/server";

export const metadata = { title: "Add property" };
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const { agent, limits } = await requireAgentPage();
  const used = await countOwnerProperties(agent.id);
  const t = await serverT();

  if (!hasPlanTime(agent.plan) || used >= limits.listingLimit) {
    return (
      <div className="max-w-xl bg-white rounded-card border border-[#E4DED2] p-6 space-y-3">
        <h1 className="text-xl font-bold text-navy-900">{t("You can't add more listings right now")}</h1>
        <p className="text-sm text-navy-700">
          {hasPlanTime(agent.plan)
            ? t("Your {plan} plan allows {limit} listings and you have {used}. Mark sold ones as sold, delete an old one, or upgrade.", { plan: limits.name, limit: limits.listingLimit, used })
            : t("Your plan has ended. Renew it to add listings.")}
        </p>
        <Link href="/dashboard/billing" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">{t("See plans")}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Add property")}</h1>
        <p className="text-sm text-navy-700">{t("It goes live on your page as soon as you publish.")}</p>
      </div>
      <PropertyForm storageFolder={`properties/${agent.id}`} photoLimit={limits.photoLimit} doneHref="/dashboard/properties" />
    </div>
  );
}
