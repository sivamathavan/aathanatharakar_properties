import { getPaymentRequests, getPlansConfig, leadsCol, listAgents, propertiesCol } from "@/lib/firestore";
import { effectiveStatus, formatINR } from "@/lib/plans";
import { FUNNEL_STEPS, funnelOf, monthlyRecurring, revenueByMonth, weeklyCohorts } from "@/lib/analytics";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Analytics · Admin" };
export const dynamic = "force-dynamic";

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "—");

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86400000);
  const [agents, plans, payments, listingSnap, leads30] = await Promise.all([
    listAgents(),
    getPlansConfig(),
    getPaymentRequests({ status: "APPROVED" }),
    propertiesCol().where("ownerType", "==", "AGENT").select("postedById", "status").get(),
    leadsCol().where("createdAt", ">=", since30).count().get(),
  ]);
  const hasListing = new Set(listingSnap.docs.map((d) => d.data().postedById as string));
  const paidIds = new Set(payments.filter((p) => p.kind === "PLAN").map((p) => p.agentId));
  const funnel = funnelOf(agents, hasListing, paidIds);
  const cohorts = weeklyCohorts(agents, hasListing, paidIds, 8, now);
  const statuses = agents.map((a) => effectiveStatus(a.plan, now));
  const liveListings = listingSnap.docs.filter((d) => d.data().status === PropertyStatus.ACTIVE).length;
  // Trial → paid, counted only for agents whose trial has had time to finish.
  const matured = agents.filter((a) => now.getTime() - new Date(a.createdAt).getTime() > plans.trialDays * 86400000);
  const maturedPaid = matured.filter((a) => a.firstPaidAt || paidIds.has(a.id)).length;
  const revenue = revenueByMonth(payments, 6, now);

  const tiles = [
    { label: "Agents", value: agents.length, sub: `${statuses.filter((s) => s === "TRIAL").length} on trial` },
    { label: "Paying now", value: statuses.filter((s) => s === "ACTIVE").length, sub: `${statuses.filter((s) => s === "EXPIRED").length} ended` },
    { label: "Monthly revenue", value: formatINR(monthlyRecurring(agents, plans, now)), sub: "from live paid plans" },
    { label: "Trial → paid", value: pct(maturedPaid, matured.length), sub: `${maturedPaid} of ${matured.length} finished trials` },
    { label: "Live agent listings", value: liveListings, sub: `${listingSnap.size} in total` },
    { label: "Enquiries", value: leads30.data().count, sub: "last 30 days" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-[#E4DED2] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Analytics</h1>
        <p className="text-xs text-navy-700 mt-0.5">How agents move from signing up to paying.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-card border border-[#E4DED2] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-600">{t.label}</p>
            <p className="text-2xl font-bold text-navy-900 font-display mt-1">{t.value}</p>
            <p className="text-[11px] text-navy-600">{t.sub}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-4" aria-labelledby="funnel-h">
        <h2 id="funnel-h" className="font-bold text-navy-900">Signup funnel (all agents)</h2>
        <ol className="space-y-3">
          {FUNNEL_STEPS.map((s, i) => {
            const n = funnel[s.key];
            const prev = i === 0 ? n : funnel[FUNNEL_STEPS[i - 1].key];
            return (
              <li key={s.key} className="grid grid-cols-[8.5rem,1fr] sm:grid-cols-[11rem,1fr,9rem] items-center gap-3 text-sm">
                <span className="font-medium text-navy-900">{s.label}</span>
                <span className="h-7 rounded bg-navy-50 overflow-hidden" aria-hidden>
                  <span className="block h-full rounded bg-navy-500" style={{ width: funnel.signedUp ? `${Math.max(2, (n / funnel.signedUp) * 100)}%` : "0%" }} />
                </span>
                <span className="text-navy-800 col-start-2 sm:col-start-auto">
                  <strong>{n}</strong> · {pct(n, funnel.signedUp)}{i > 0 && <span className="text-navy-600"> ({pct(n, prev)} of previous)</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-3" aria-labelledby="cohort-h">
        <h2 id="cohort-h" className="font-bold text-navy-900">Weekly signups (last 8 weeks)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase text-navy-600">
                <th className="py-2 pr-4">Week of</th>
                {FUNNEL_STEPS.map((s) => <th key={s.key} className="py-2 pr-4 text-right">{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.weekStart.toISOString()} className="border-t border-[#E4DED2]">
                  <td className="py-2 pr-4 whitespace-nowrap">{c.weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</td>
                  {FUNNEL_STEPS.map((s) => (
                    <td key={s.key} className="py-2 pr-4 text-right">{c[s.key]}{s.key !== "signedUp" && c.signedUp ? <span className="text-navy-600"> · {pct(c[s.key], c.signedUp)}</span> : null}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-3" aria-labelledby="rev-h">
        <h2 id="rev-h" className="font-bold text-navy-900">Payments approved, by month</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-navy-600"><th className="py-2 pr-4">Month</th><th className="py-2 pr-4 text-right">Plans</th><th className="py-2 pr-4 text-right">Boosts</th><th className="py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {revenue.map((r) => (
                <tr key={r.month} className="border-t border-[#E4DED2]">
                  <td className="py-2 pr-4">{new Date(`${r.month}-15T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</td>
                  <td className="py-2 pr-4 text-right">{formatINR(r.plans)}</td>
                  <td className="py-2 pr-4 text-right">{formatINR(r.boosts)}</td>
                  <td className="py-2 text-right font-semibold">{formatINR(r.plans + r.boosts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-navy-600">Amounts as paid by agents. GST and expenses are in the Tracker.</p>
      </section>
    </div>
  );
}
