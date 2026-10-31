import Link from "next/link";
import { Building, Users2, IndianRupee, Zap, AlarmClock, BadgeCheck } from "lucide-react";
import { getAdminLeads, getPaymentRequests, listAgents, propertiesCol } from "@/lib/firestore";
import { daysLeft, effectiveStatus, formatINR } from "@/lib/plans";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

function Tile({ href, label, value, sub, icon: Icon, alert }: { href: string; label: string; value: string | number; sub: string; icon: typeof Building; alert?: boolean }) {
  return (
    <Link href={href} className={`bg-white rounded-card border p-5 hover:shadow-sm ${alert ? "border-gold-500" : "border-[#E4DED2]"}`}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-navy-600">
        {label} <Icon className="w-4 h-4 text-gold-600" />
      </div>
      <p className="text-2xl font-bold text-navy-900 font-display mt-2">{value}</p>
      <p className="text-[11px] text-navy-600">{sub}</p>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const now = new Date();
  const [agents, pending, payments, leads, myActive] = await Promise.all([
    listAgents(),
    getPaymentRequests({ status: "PENDING" }),
    getPaymentRequests({ status: "APPROVED" }),
    getAdminLeads(200),
    propertiesCol().where("ownerType", "==", "ADMIN").where("status", "==", PropertyStatus.ACTIVE).count().get(),
  ]);

  const statuses = agents.map((a) => effectiveStatus(a.plan, now));
  const paying = statuses.filter((s) => s === "ACTIVE").length;
  const trials = statuses.filter((s) => s === "TRIAL").length;
  const expiring = agents.filter((a) => {
    const s = effectiveStatus(a.plan, now);
    return (s === "ACTIVE" || s === "TRIAL") && daysLeft(a.plan, now) <= 7;
  }).length;
  const thisMonth = payments
    .filter((p) => p.decidedAt && new Date(p.decidedAt).getMonth() === now.getMonth() && new Date(p.decidedAt).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + p.amount, 0);
  const newLeads = leads.filter((l) => l.status === "NEW");

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-[#E4DED2] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Overview</h1>
        <p className="text-xs text-navy-700 mt-0.5">Your listings, your agents and what they paid.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Tile href="/admin/payments" label="Collected" value={formatINR(thisMonth)} sub="approved this month" icon={IndianRupee} />
        <Tile href="/admin/payments" label="To check" value={pending.length} sub="payments waiting" icon={BadgeCheck} alert={pending.length > 0} />
        <Tile href="/admin/agents" label="Paying agents" value={paying} sub={`${agents.length} agents in total`} icon={Users2} />
        <Tile href="/admin/agents" label="On trial" value={trials} sub="could become paying" icon={Users2} />
        <Tile href="/admin/agents" label="Ending soon" value={expiring} sub="in the next 7 days" icon={AlarmClock} alert={expiring > 0} />
        <Tile href="/admin/properties" label="Your listings" value={myActive.data().count} sub="live on the main site" icon={Building} />
      </div>

      <div className="bg-white rounded-card border border-[#E4DED2] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900 flex items-center gap-2"><Zap className="w-4 h-4 text-gold-600" /> New website enquiries ({newLeads.length})</h2>
          <Link href="/admin/leads" className="text-sm underline text-navy-700">All enquiries</Link>
        </div>
        {newLeads.length === 0 ? (
          <p className="text-sm text-navy-600 text-center py-6">No new enquiries.</p>
        ) : (
          <ul className="divide-y divide-[#E4DED2]">
            {newLeads.slice(0, 6).map((l) => (
              <li key={l.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-navy-900">{l.name} · <a href={`tel:${l.phone}`} className="underline">{l.phone}</a></p>
                  <p className="text-xs text-navy-600 truncate">{l.propertyTitle}</p>
                </div>
                <span className="text-xs text-navy-500 shrink-0">{new Date(l.createdAt).toLocaleDateString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
