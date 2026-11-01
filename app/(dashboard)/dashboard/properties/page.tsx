import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { adminDb } from "@/lib/firebase-admin";
import { getOwnerProperties, getSiteConfig, privateDetailsRef } from "@/lib/firestore";
import { getBuyersForOwner } from "@/lib/buyers";
import { scoreMatch, MATCH_MIN } from "@/lib/match";
import { waNumber } from "@/lib/plans";
import { DOC_ITEMS } from "@/lib/doc-items";
import { serverT } from "@/lib/i18n/server";
import { ListingsTable } from "@/components/dashboard/ListingsTable";
import { SITE_URL } from "@/lib/site";
import { PropertyStatus } from "@/types";

export const metadata = { title: "My properties" };
export const dynamic = "force-dynamic";

export default async function MyPropertiesPage() {
  const { agent, limits, plans } = await requireAgentPage();
  const t = serverT();
  const [properties, site, buyers] = await Promise.all([getOwnerProperties(agent.id), getSiteConfig(), getBuyersForOwner(agent.id)]);
  const privates = properties.length ? await adminDb.getAll(...properties.map((p) => privateDetailsRef(p.id))) : [];
  const verified = new Map(privates.map((d) => [d.ref.parent.parent!.id, Object.values((d.data()?.docChecklist || {}) as Record<string, { status: string }>).filter((v) => v.status === "VERIFIED").length]));
  const activeBuyers = buyers.filter((b) => b.status === "ACTIVE");
  const used = properties.filter((p) => p.status !== PropertyStatus.SOLD && p.status !== PropertyStatus.RENTED).length;
  const full = used >= limits.listingLimit;

  const rows = properties.map((p) => ({
    ...JSON.parse(JSON.stringify(p)),
    docsVerified: verified.get(p.id) || 0,
    buyerMatches: p.status === PropertyStatus.ACTIVE ? activeBuyers.filter((b) => scoreMatch(b, p) >= MATCH_MIN).length : 0,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t("My properties")}</h1>
          <p className="text-sm text-navy-700">{t("{used} of {limit} listings used on your plan. Sold and rented ones don't count.", { used, limit: limits.listingLimit })}</p>
        </div>
        {full ? (
          <Link href="/dashboard/billing" className="h-10 px-4 rounded-btn bg-gold-500 text-navy-900 font-bold text-sm inline-flex items-center">{t("Upgrade for more listings")}</Link>
        ) : (
          <Link href="/dashboard/properties/new" className="h-10 px-4 rounded-btn bg-navy-900 text-gold-500 font-bold text-sm inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> {t("Add property")}
          </Link>
        )}
      </div>
      <ListingsTable
        properties={rows}
        agentSlug={agent.slug}
        boostPricePerWeek={plans.boostPricePerWeek}
        showTaps={limits.viewStats}
        pro={limits.branding}
        upi={{ id: site.upiId, name: site.upiName }}
        siteUrl={SITE_URL}
        buyerNames={activeBuyers.map((b) => b.name)}
        docTotal={DOC_ITEMS.length}
        agent={{
          displayName: agent.displayName,
          agencyName: agent.agencyName,
          tagline: agent.tagline,
          phone: waNumber(agent.whatsapp),
          city: agent.city,
          officeAddress: agent.officeAddress,
          reraNumber: agent.reraNumber,
          photoUrl: agent.photoUrl,
          logoUrl: agent.logoUrl,
          brandColor: agent.brandColor,
        }}
      />
    </div>
  );
}
