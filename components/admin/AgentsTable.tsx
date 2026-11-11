"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FaWhatsapp } from "react-icons/fa";
import { daysLeft, effectiveStatus, graceDaysLeft, waNumber } from "@/lib/plans";
import { renewalWhatsappText } from "@/lib/reminder-text";
import { ST } from "@/components/ui/stack-table";

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
  GRACE: "bg-amber-100 text-amber-900",
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

export function AgentsTable({ agents, counts, siteUrl, renewPrice }: { agents: Agent[]; counts: Record<string, { total: number; live: number }>; siteUrl: string; renewPrice: Record<string, number> }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [recording, setRecording] = useState<Agent | null>(null);
  const [form, setForm] = useState({ planId: "STARTER", period: "MONTHLY", reference: "" });
  const [busy, setBusy] = useState(false);
  const [suspending, setSuspending] = useState<Agent | null>(null);

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return agents.filter((a) => {
      const st = effectiveStatus(a.plan as any);
      if (filter === "EXPIRING" && !(st === "GRACE" || (st !== "EXPIRED" && st !== "SUSPENDED" && daysLeft(a.plan as any) <= 7))) return false;
      if (!["ALL", "EXPIRING"].includes(filter) && st !== filter) return false;
      return !needle || `${a.displayName} ${a.agencyName || ""} ${a.phone} ${a.email} ${a.city}`.toLowerCase().includes(needle);
    });
  }, [agents, filter, q]);

  const act = async (id: string, body: object, done: string) => {
    setBusy(true);
    const res = await fetch(`/api/admin/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      toast.error(res ? await errorText(res, "Could not update the agent.") : "No internet connection. Please try again.");
      return false;
    }
    toast.success(done);
    router.refresh();
    return true;
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
        <table className={`${ST.table} md:min-w-[860px]`}>
          <thead className={`${ST.thead} bg-navy-50 text-left text-xs uppercase text-navy-700`}>
            <tr>
              <th className="p-3">Agent</th><th className="p-3">Phone</th><th className="p-3">Plan</th><th className="p-3">Ends</th><th className="p-3">Listings</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className={ST.tbody}>
            {rows.map((a) => {
              const st = effectiveStatus(a.plan as any);
              const left = daysLeft(a.plan as any);
              const reminder = renewalWhatsappText(a.displayName, a.plan.expiresAt, renewPrice[a.plan.id] || renewPrice.STARTER);
              return (
                <tr key={a.id} className={`${ST.tr} px-4 md:px-0 md:align-top`}>
                  <td className={`${ST.td} w-full md:w-auto md:p-3`}>
                    <a href={`/a/${a.slug}`} target="_blank" className="font-semibold text-navy-900 underline-offset-2 hover:underline">{a.displayName}</a>
                    <p className="text-xs text-navy-600">{a.agencyName || "—"} · {a.city}</p>
                    {!a.emailVerified && <p className="text-xs text-amber-700">Email not confirmed</p>}
                  </td>
                  <td className={`${ST.td} w-full md:w-auto md:p-3 whitespace-nowrap`}>{a.phone}<p className="text-xs text-navy-600 break-all whitespace-normal md:break-normal md:whitespace-nowrap">{a.email}</p></td>
                  <td className={`${ST.td} md:p-3`}><span className={`text-[11px] font-bold px-2 py-0.5 rounded-pill ${STATUS_STYLE[st]}`}>{st === "ACTIVE" ? a.plan.id : st}</span></td>
                  <td className={`${ST.td} md:p-3 whitespace-nowrap`}><span className={ST.label}>Ends</span>{new Date(a.plan.expiresAt).toLocaleDateString("en-IN")}<p className="text-xs text-navy-600 inline md:block"> {st === "EXPIRED" ? "ended" : st === "GRACE" ? `ended, page pauses in ${graceDaysLeft(a.plan as any)} days` : `${left} days left`}</p></td>
                  <td className={`${ST.td} md:p-3 whitespace-nowrap`}><span className={ST.label}>Listings</span>{counts[a.id]?.live || 0} live / {counts[a.id]?.total || 0}</td>
                  <td className={`${ST.td} w-full md:w-auto pt-1 md:p-3`}>
                    <div className="flex flex-wrap gap-2">
                      <a href={`https://wa.me/${waNumber(a.phone)}?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noopener noreferrer" className="h-8 px-2 rounded-btn bg-[#25D366] text-[#0B3B1E] text-xs font-semibold inline-flex items-center gap-1"><FaWhatsapp /> Remind</a>
                      <button type="button" onClick={() => setRecording(a)} className="h-8 px-2 rounded-btn border text-xs font-semibold">Record payment</button>
                      {st === "SUSPENDED" ? (
                        <button type="button" disabled={busy} onClick={() => act(a.id, { action: "restore" }, "Agent restored.")} className="h-8 px-2 rounded-btn border text-xs">Restore</button>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => setSuspending(a)} className="h-8 px-2 rounded-btn border border-red-300 text-red-700 text-xs">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr className="block md:table-row"><td colSpan={6} className="block md:table-cell p-8 text-center text-navy-600">No agents match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!suspending}
        onOpenChange={(o) => !o && setSuspending(null)}
        title={`Suspend ${suspending?.displayName || "this agent"}?`}
        description="Their page is paused for buyers and they can't add listings. Nothing is deleted; Restore brings it all back."
        confirmLabel="Suspend"
        busyLabel="Suspending…"
        onConfirm={() => (suspending ? act(suspending.id, { action: "suspend" }, "Agent suspended. Their page is paused.") : undefined)}
      />

      <ConfirmDialog
        open={!!recording}
        onOpenChange={(o) => !o && setRecording(null)}
        tone="default"
        title={`Record a payment from ${recording?.displayName || ""}`}
        description="For cash or bank transfers you received directly. Adds the time on top of what's left."
        confirmLabel="Record payment"
        busyLabel="Saving…"
        onConfirm={() => (recording ? act(recording.id, { action: "record-payment", ...form }, "Payment recorded. Plan extended.") : undefined)}
      >
        <div className="space-y-3">
          <label className="block text-sm space-y-1">
            <span>Plan</span>
            <select className="w-full h-11 px-3 border rounded-md bg-white" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
            </select>
          </label>
          <label className="block text-sm space-y-1">
            <span>Period</span>
            <select className="w-full h-11 px-3 border rounded-md bg-white" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
              <option value="MONTHLY">1 month</option>
              <option value="YEARLY">1 year</option>
            </select>
          </label>
          <label className="block text-sm space-y-1">
            <span>Reference (optional)</span>
            <input className="w-full h-11 px-3 border rounded-md" maxLength={30} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. cash receipt 104" />
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
