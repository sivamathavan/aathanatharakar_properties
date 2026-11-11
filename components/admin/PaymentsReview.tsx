"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatINR } from "@/lib/plans";
import { ST } from "@/components/ui/stack-table";

interface Payment {
  id: string;
  agentName: string;
  kind: "PLAN" | "BOOST";
  planId?: string | null;
  period?: string | null;
  propertyTitle?: string | null;
  weeks?: number | null;
  amount: number;
  utr: string;
  status: string;
  note?: string | null;
  createdAt: string;
  decidedAt?: string | null;
}

function what(p: Payment) {
  return p.kind === "PLAN" ? `${p.planId} · ${p.period === "YEARLY" ? "1 year" : "1 month"}` : `Boost ${p.weeks}w · ${p.propertyTitle}`;
}

export function PaymentsReview({ pending, decided }: { pending: Payment[]; decided: Payment[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Payment | null>(null);
  const [note, setNote] = useState("");

  const decide = async (id: string, decision: "APPROVE" | "REJECT") => {
    setBusy(id);
    const res = await fetch(`/api/admin/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note: decision === "REJECT" ? note : null }) }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) {
      toast.error(res ? await errorText(res, "Could not save the decision.") : "No internet connection. Please try again.");
      return false;
    }
    const data = await res.json();
    toast.success(decision === "APPROVE" ? `Approved: ${data.summary}.` : "Rejected. The agent has been emailed.");
    setNote("");
    router.refresh();
    return true;
  };

  const total = decided.filter((d) => d.status === "APPROVED" && d.decidedAt && new Date(d.decidedAt).getMonth() === new Date().getMonth() && new Date(d.decidedAt).getFullYear() === new Date().getFullYear()).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-bold text-navy-900">Waiting for you ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-navy-600 bg-white rounded-card border border-[#E4DED2] p-6 text-center">Nothing to check.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="bg-white rounded-card border border-[#E4DED2] p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900">{p.agentName} · {formatINR(p.amount)}</p>
                  <p className="text-sm text-navy-700">{what(p)}</p>
                  <p className="text-xs text-navy-600">UTR <span className="font-mono font-semibold text-navy-900">{p.utr}</span> · {new Date(p.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy === p.id} onClick={() => decide(p.id, "APPROVE")} className="h-9 px-4 rounded-btn bg-green-600 text-white text-sm font-semibold">Approve</button>
                  <button type="button" disabled={busy === p.id} onClick={() => setRejecting(p)} className="h-9 px-4 rounded-btn border border-red-300 text-red-700 text-sm">Not received</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setNote("");
          }
        }}
        title="Reject this payment?"
        description={rejecting ? `${rejecting.agentName} · ${formatINR(rejecting.amount)} · UTR ${rejecting.utr}. The agent is emailed that the payment wasn't found, with your reason.` : undefined}
        confirmLabel="Reject payment"
        busyLabel="Rejecting…"
        onConfirm={() => (rejecting ? decide(rejecting.id, "REJECT") : undefined)}
      >
        <label className="block text-sm space-y-1">
          <span className="font-medium text-navy-900">Reason (sent to the agent)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} placeholder="e.g. No payment with this UTR reached our account." className="w-full px-3 py-2 border rounded-md text-sm" />
        </label>
      </ConfirmDialog>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-navy-900">History</h2>
          <p className="text-sm text-navy-700">Approved this month: <span className="font-bold text-navy-900">{formatINR(total)}</span></p>
        </div>
        <div className="bg-white rounded-card border border-[#E4DED2] overflow-x-auto">
          <table className={`${ST.table} md:min-w-[640px]`}>
            <thead className={`${ST.thead} bg-navy-50 text-left text-xs uppercase text-navy-700`}>
              <tr><th className="p-3">Date</th><th className="p-3">Agent</th><th className="p-3">For</th><th className="p-3">Amount</th><th className="p-3">UTR</th><th className="p-3">Result</th></tr>
            </thead>
            <tbody className={ST.tbody}>
              {decided.map((p) => (
                <tr key={p.id} className={`${ST.tr} px-4 md:px-0`}>
                  <td className={`${ST.td} md:p-3 whitespace-nowrap`}>{new Date(p.decidedAt || p.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className={`${ST.td} md:p-3 font-semibold md:font-normal`}>{p.agentName}</td>
                  <td className={`${ST.td} w-full md:w-auto md:p-3`}>{what(p)}</td>
                  <td className={`${ST.td} md:p-3 whitespace-nowrap`}>{formatINR(p.amount)}</td>
                  <td className={`${ST.td} md:p-3 font-mono text-xs`}><span className={ST.label}>UTR</span>{p.utr}</td>
                  <td className={`${ST.td} w-full md:w-auto md:p-3`}>{p.status === "APPROVED" ? "Approved" : `Rejected${p.note ? `: ${p.note}` : ""}`}</td>
                </tr>
              ))}
              {decided.length === 0 && <tr className="block md:table-row"><td colSpan={6} className="block md:table-cell p-6 text-center text-navy-600">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
