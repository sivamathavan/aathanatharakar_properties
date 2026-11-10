import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getOwnerProperties } from "@/lib/firestore";
import { getAgentDaily } from "@/lib/stats";
import { serverT } from "@/lib/i18n/server";
import { StatsChart } from "@/components/dashboard/StatsChart";
import { PropertyStatus } from "@/types";
import { ST } from "@/components/ui/stack-table";

export const metadata = { title: "Stats" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { agent, limits } = await requireAgentPage();
  const t = await serverT();
  const [properties, daily] = await Promise.all([getOwnerProperties(agent.id), getAgentDaily(agent.id, 30)]);
  const pro = limits.viewStats;
  const sum = (k: "pageViews" | "listingViews" | "waTaps" | "callTaps" | "enquiries") => daily.reduce((s, d) => s + (d[k] || 0), 0);
  const rows = properties
    .filter((p) => p.status !== PropertyStatus.SOLD && p.status !== PropertyStatus.RENTED)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  const tiles = [
    { label: t("Page visits"), value: sum("pageViews") },
    { label: t("Listing views"), value: sum("listingViews") },
    { label: t("Enquiries"), value: sum("enquiries") },
    ...(pro ? [{ label: t("WhatsApp taps"), value: sum("waTaps") }, { label: t("Call taps"), value: sum("callTaps") }] : []),
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Stats")}</h1>
        <p className="text-sm text-navy-700">{t("How many people open your page and listings, and contact you. Last 30 days, India time.")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map((x) => (
          <div key={x.label} className="bg-white rounded-card border border-[#E4DED2] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-600">{x.label}</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{x.value}</p>
          </div>
        ))}
      </div>

      {pro ? (
        <div className="grid md:grid-cols-2 gap-4">
          <StatsChart title={t("Listing views")} unit={t("views")} data={daily.map((d) => ({ date: d.date, value: d.listingViews }))} />
          <StatsChart title={t("Enquiries")} unit={t("enquiries")} data={daily.map((d) => ({ date: d.date, value: d.enquiries }))} />
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-navy-200 bg-navy-50/40 p-5 text-sm text-navy-800 flex items-start gap-3">
          <Lock className="w-5 h-5 text-gold-600 shrink-0" />
          <p>{t("The day-by-day chart and WhatsApp and call taps come with the Pro plan.")} <Link href="/dashboard/billing" className="underline font-semibold">{t("See plans")}</Link></p>
        </div>
      )}

      <div className="bg-white rounded-card border border-[#E4DED2] p-5">
        <h2 className="font-bold text-navy-900 mb-3">{t("Each listing (all time)")}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-navy-700">{t("Add a listing to start seeing views.")}</p>
        ) : (
          <table className={ST.table}>
            <thead className={ST.thead}>
              <tr className="text-left text-xs uppercase text-navy-600">
                <th className="py-2 pr-4">{t("Listing")}</th>
                <th className="py-2 pr-4 text-right">{t("Views")}</th>
                <th className="py-2 pr-4 text-right">{t("Enquiries")}</th>
                {pro && <th className="py-2 pr-4 text-right">WhatsApp</th>}
                {pro && <th className="py-2 pr-4 text-right">{t("Calls")}</th>}
                {pro && <th className="py-2 text-right">{t("Shares")}</th>}
              </tr>
            </thead>
            <tbody className={ST.tbody}>
              {rows.map((p) => (
                <tr key={p.id} className={ST.tr}>
                  <td className={`${ST.td} w-full md:w-auto md:py-2 md:pr-4 md:max-w-[14rem] truncate`}><Link href={`/a/${agent.slug}/${p.id}`} target="_blank" className="underline">{p.title}</Link></td>
                  <td className={`${ST.td} md:py-2 md:pr-4 md:text-right`}><span className={ST.label}>{t("Views")}</span>{p.viewCount || 0}</td>
                  <td className={`${ST.td} md:py-2 md:pr-4 md:text-right`}><span className={ST.label}>{t("Enquiries")}</span>{p.enquiryCount || 0}</td>
                  {pro && <td className={`${ST.td} md:py-2 md:pr-4 md:text-right`}><span className={ST.label}>WhatsApp</span>{p.waTaps || 0}</td>}
                  {pro && <td className={`${ST.td} md:py-2 md:pr-4 md:text-right`}><span className={ST.label}>{t("Calls")}</span>{p.callTaps || 0}</td>}
                  {pro && <td className={`${ST.td} md:py-2 md:text-right`}><span className={ST.label}>{t("Shares")}</span>{p.shareTaps || 0}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
