"use client";

import { BRAND } from "@/lib/brand";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import { daysLeft, effectiveStatus, waNumber } from "@/lib/plans";

interface Agent {
  id: string;
  slug: string;
  displayName: string;
  agencyName?: string | null;
  email: string;
  phone: string;
  city: string;
  emailVerified: boolean;
  plan: { id: string; status: string; expiresAt: string };
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  TRIAL: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-200 text-gray-700",
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "EXPIRING", label: "Ending in 7 days" },
  { key: "TRIAL", label: "On trial" },
  { key: "ACTIVE", label: "Paying" },
  { key: "EXPIRED", label: "Ended" },
  { key: "SUSPENDED", label: "Suspended" },
];

export function AgentsTable({ agents, counts, siteUrl }: { agents: Agent[]; counts: Record<string, { total: number; live: number }>; siteUrl: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [recording, setRecording] = useState<Agent | null>(null);
  const [form, setForm] = useState({ planId: "STARTER", period: "MONTHLY", reference: "" });
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return agents.filter((a) => {
      const st = effectiveStatus(a.plan as any);
      if (filter === "EXPIRING" && !(st !== "EXPIRED" && st !== "SUSPENDED" && daysLeft(a.plan as any) <= 7)) return false;
      if (!["ALL", "EXPIRING"].includes(filter) && st !== filter) return false;
      return !needle || `${a.displayName} ${a.agencyName || ""} ${a.phone} ${a.email} ${a.city}`.toLowerCase().includes(needle);
    });
  }, [agents, filter, q]);

  const act = async (id: string, body: object, done: string) => {
    setBusy(true);
    const res = await fetch(`/api/admin/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) return void toast.error((await res.text()) || "Could not update.");
    toast.success(done);
    setRecording(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input aria-label="Search agents" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, city" className="h-10 px-3 rounded-btn border bg-white text-sm flex-1" />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`h-10 px-3 rounded-pill text-xs font-semibold whitespace-nowrap border ${filter === f.key ? "bg-navy-900 text-gold-500" : "bg-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#E4DED2] overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-navy-50 text-left text-xs uppercase text-navy-700">
            <tr>
              <th className="p-3">Agent</th><th className="p-3">Phone</th><th className="p-3">Plan</th><th className="p-3">Ends</th><th className="p-3">Listings</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const st = effectiveStatus(a.plan as any);
              const left = daysLeft(a.plan as any);
              const reminder = `Hi ${a.displayName}, your ${BRAND.name} property page ${st === "EXPIRED" ? "has paused" : `ends in ${left} days`}. Renew from Plan & billing to keep it live: ${siteUrl}/dashboard/billing`;
              return (
                <tr key={a.id} className="border-t border-[#E4DED2] align-top">
                  <td className="p-3">
                    <a href={`/a/${a.slug}`} target="_blank" className="font-semibold text-navy-900 underline-offset-2 hover:underline">{a.displayName}</a>
                    <p className="text-xs text-navy-600">{a.agencyName || "—"} · {a.city}</p>
                    {!a.emailVerified && <p className="text-xs text-amber-700">Email not confirmed</p>}
                  </td>
                  <td className="p-3 whitespace-nowrap">{a.phone}<p className="text-xs text-navy-600">{a.email}</p></td>
                  <td className="p-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-pill ${STATUS_STYLE[st]}`}>{st === "ACTIVE" ? a.plan.id : st}</span></td>
                  <td className="p-3 whitespace-nowrap">{new Date(a.plan.expiresAt).toLocaleDateString("en-IN")}<p className="text-xs text-navy-600">{st === "EXPIRED" ? "ended" : `${left} days left`}</p></td>
                  <td className="p-3">{counts[a.id]?.live || 0} live / {counts[a.id]?.total || 0}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <a href={`https://wa.me/${waNumber(a.phone)}?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noopener noreferrer" className="h-8 px-2 rounded-btn bg-[#25D366] text-white text-xs font-semibold inline-flex items-center gap-1"><FaWhatsapp /> Remind</a>
                      <button type="button" onClick={() => setRecording(a)} className="h-8 px-2 rounded-btn border text-xs font-semibold">Record payment</button>
                      {st === "SUSPENDED" ? (
                        <button type="button" disabled={busy} onClick={() => act(a.id, { action: "restore" }, "Agent restored.")} className="h-8 px-2 rounded-btn border text-xs">Restore</button>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => act(a.id, { action: "suspend" }, "Agent suspended. Their page is paused.")} className="h-8 px-2 rounded-btn border border-red-300 text-red-700 text-xs">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-navy-600">No agents match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {recording && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Record payment">
          <form
            className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              act(recording.id, { action: "record-payment", ...form }, "Payment recorded. Plan extended.");
            }}
          >
            <h2 className="text-lg font-bold text-navy-900">Record a payment from {recording.displayName}</h2>
            <p className="text-xs text-navy-600">For cash or bank transfers you received directly. Adds the time on top of what's left.</p>
            <label className="block text-sm space-y-1">
              <span>Plan</span>
              <select className="w-full h-10 px-3 border rounded-md" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
              </select>
            </label>
            <label className="block text-sm space-y-1">
              <span>Period</span>
              <select className="w-full h-10 px-3 border rounded-md" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                <option value="MONTHLY">1 month</option>
                <option value="YEARLY">1 year</option>
              </select>
            </label>
            <label className="block text-sm space-y-1">
              <span>Reference (optional)</span>
              <input className="w-full h-10 px-3 border rounded-md" maxLength={30} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. cash receipt 104" />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 h-10 rounded-btn bg-navy-900 text-gold-500 font-bold">Save</button>
              <button type="button" onClick={() => setRecording(null)} className="flex-1 h-10 rounded-btn border">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
