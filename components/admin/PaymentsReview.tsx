"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR } from "@/lib/plans";

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
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const decide = async (id: string, decision: "APPROVE" | "REJECT") => {
    setBusy(id);
    const res = await fetch(`/api/admin/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note: decision === "REJECT" ? note : null }) });
    setBusy(null);
    if (!res.ok) return void toast.error((await res.text()) || "Could not save.");
    const data = await res.json();
    toast.success(decision === "APPROVE" ? `Approved: ${data.summary}` : "Rejected. The agent has been emailed.");
    setRejecting(null);
    setNote("");
    router.refresh();
  };

  const total = decided.filter((d) => d.status === "APPROVED" && d.decidedAt && new Date(d.decidedAt).getMonth() === new Date().getMonth() && new Date(d.decidedAt).getFullYear() === new Date().getFullYear()).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-bold text-navy-900">Waiting for you ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-navy-600 bg-white rounded-card border border-[#E8E0D0] p-6 text-center">Nothing to check.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="bg-white rounded-card border border-[#E8E0D0] p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900">{p.agentName} · {formatINR(p.amount)}</p>
                  <p className="text-sm text-navy-700">{what(p)}</p>
                  <p className="text-xs text-navy-600">UTR <span className="font-mono font-semibold text-navy-900">{p.utr}</span> · {new Date(p.createdAt).toLocaleString("en-IN")}</p>
                </div>
                {rejecting === p.id ? (
                  <div className="flex flex-col sm:flex-row gap-2 md:w-96">
                    <input aria-label="Reason" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (sent to agent)" className="flex-1 h-9 px-3 border rounded-md text-sm" />
                    <button type="button" disabled={busy === p.id} onClick={() => decide(p.id, "REJECT")} className="h-9 px-3 rounded-btn bg-red-600 text-white text-sm font-semibold">Reject</button>
                    <button type="button" onClick={() => setRejecting(null)} className="h-9 px-3 rounded-btn border text-sm">Back</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy === p.id} onClick={() => decide(p.id, "APPROVE")} className="h-9 px-4 rounded-btn bg-green-600 text-white text-sm font-semibold">Approve</button>
                    <button type="button" onClick={() => setRejecting(p.id)} className="h-9 px-4 rounded-btn border border-red-300 text-red-700 text-sm">Not received</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-navy-900">History</h2>
          <p className="text-sm text-navy-700">Approved this month: <span className="font-bold text-navy-900">{formatINR(total)}</span></p>
        </div>
        <div className="bg-white rounded-card border border-[#E8E0D0] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-navy-50 text-left text-xs uppercase text-navy-700">
              <tr><th className="p-3">Date</th><th className="p-3">Agent</th><th className="p-3">For</th><th className="p-3">Amount</th><th className="p-3">UTR</th><th className="p-3">Result</th></tr>
            </thead>
            <tbody>
              {decided.map((p) => (
                <tr key={p.id} className="border-t border-[#E8E0D0]">
                  <td className="p-3 whitespace-nowrap">{new Date(p.decidedAt || p.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-3">{p.agentName}</td>
                  <td className="p-3">{what(p)}</td>
                  <td className="p-3 whitespace-nowrap">{formatINR(p.amount)}</td>
                  <td className="p-3 font-mono text-xs">{p.utr}</td>
                  <td className="p-3">{p.status === "APPROVED" ? "Approved" : `Rejected${p.note ? `: ${p.note}` : ""}`}</td>
                </tr>
              ))}
              {decided.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-navy-600">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
