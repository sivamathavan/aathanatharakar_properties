"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { CheckCircle2, Mail, RotateCcw, Trash2 } from "lucide-react";
import { toast, errorText } from "@/lib/notify";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { waNumber } from "@/lib/plans";
import { BRAND } from "@/lib/brand";

interface Message {
  id: string;
  message: string;
  name: string;
  phone: string;
  email: string | null;
  agentId: string | null;
  agentSlug: string | null;
  planStatus: string | null;
  page: string;
  topic: string | null;
  status: "NEW" | "DONE";
  createdAt: string;
}

const FILTERS = [
  { key: "NEW", label: "New" },
  { key: "DONE", label: "Done" },
  { key: "ALL", label: "All" },
] as const;

const PLAN_STYLE: Record<string, string> = {
  TRIAL: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  GRACE: "bg-amber-100 text-amber-900",
  EXPIRED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-200 text-gray-700",
};

export function SupportInbox({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("NEW");
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const shown = messages.filter((m) => filter === "ALL" || m.status === filter);
  const count = (k: string) => (k === "ALL" ? messages.length : messages.filter((m) => m.status === k).length);

  const setStatus = async (m: Message, status: "NEW" | "DONE") => {
    setBusy(m.id);
    const res = await fetch(`/api/admin/support/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) return void toast.error(res ? await errorText(res, "Could not update the message.") : "No internet connection. Please try again.");
    toast.success(status === "DONE" ? "Marked as done." : "Moved back to New.");
    router.refresh();
  };

  const remove = async (m: Message) => {
    const res = await fetch(`/api/admin/support/${m.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await errorText(res, "Could not delete the message."));
      return false;
    }
    toast.success("Message deleted.");
    router.refresh();
  };

  const reply = (m: Message) => `Hi ${m.name.split(/\s+/)[0]}, this is the ${BRAND.name} team about your message: "${m.message.slice(0, 120)}${m.message.length > 120 ? "…" : ""}"\n\n`;

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Show" className="inline-flex rounded-pill border border-[#E4DED2] bg-white p-0.5">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className={`h-9 px-4 rounded-pill text-sm font-semibold ${filter === f.key ? "bg-navy-900 text-gold-500" : "text-navy-800"}`}>
            {f.label} ({count(f.key)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="bg-white rounded-card border border-[#E4DED2] p-8 text-center text-sm text-navy-600">{filter === "NEW" ? "No new messages." : "Nothing here."}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.id} className={`bg-white rounded-card border p-4 space-y-3 ${m.status === "NEW" ? "border-gold-400" : "border-[#E4DED2]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-navy-900 flex flex-wrap items-center gap-2">
                    {m.agentSlug ? (
                      <a href={`/a/${m.agentSlug}`} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{m.name}</a>
                    ) : (
                      m.name
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-pill ${m.agentId ? PLAN_STYLE[m.planStatus || ""] || "bg-navy-50 text-navy-800" : "bg-gray-100 text-gray-700"}`}>
                      {m.agentId ? `Agent · ${m.planStatus || "?"}` : "Visitor"}
                    </span>
                  </p>
                  <p className="text-xs text-navy-600 break-all">
                    {[m.phone, m.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-xs text-navy-600 shrink-0">{new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <p className="text-sm text-navy-900 whitespace-pre-wrap break-words">{m.message}</p>
              {(m.page || m.topic) && (
                <p className="text-xs text-navy-600">
                  {m.page && <>Sent from <span className="font-mono">{m.page}</span></>}
                  {m.page && m.topic && " · "}
                  {m.topic && <>after reading “{m.topic}”</>}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {m.phone && waNumber(m.phone).length >= 10 && (
                  <a href={`https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(reply(m))}`} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-btn bg-[#25D366] text-[#0B3B1E] text-sm font-semibold inline-flex items-center gap-1.5">
                    <FaWhatsapp className="w-4 h-4" aria-hidden /> Reply on WhatsApp
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`${BRAND.name} support`)}&body=${encodeURIComponent(reply(m))}`} className="h-9 px-3 rounded-btn border border-navy-300 text-navy-900 text-sm font-semibold inline-flex items-center gap-1.5">
                    <Mail className="w-4 h-4" aria-hidden /> Email
                  </a>
                )}
                {m.status === "NEW" ? (
                  <button type="button" disabled={busy === m.id} onClick={() => setStatus(m, "DONE")} className="h-9 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" aria-hidden /> Mark done
                  </button>
                ) : (
                  <button type="button" disabled={busy === m.id} onClick={() => setStatus(m, "NEW")} className="h-9 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
                    <RotateCcw className="w-4 h-4" aria-hidden /> Move to New
                  </button>
                )}
                <button type="button" onClick={() => setDeleting(m)} className="h-9 px-3 rounded-btn text-red-700 text-sm inline-flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" aria-hidden /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete the message from ${deleting?.name || ""}?`}
        description="It is removed from the inbox for good. Mark it done instead if you may need it later."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        onConfirm={() => (deleting ? remove(deleting) : undefined)}
      />
    </div>
  );
}
