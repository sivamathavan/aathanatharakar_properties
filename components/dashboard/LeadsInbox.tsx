"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import { Phone, ChevronDown, ChevronUp } from "lucide-react";
import { waNumber } from "@/lib/plans";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  createdAt: string;
}

interface Note {
  id: string;
  note: string;
  createdAt: string;
}

export const LEAD_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "SITE_VISIT", label: "Site visit" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CLOSED", label: "Closed" },
  { value: "LOST", label: "Lost" },
];

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  SITE_VISIT: "bg-purple-100 text-purple-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  CLOSED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

/** Enquiry list with status, notes, and call/WhatsApp buttons. Used by agents and admin. */
export function LeadsInbox({
  leads: initial,
  propertyBase,
  apiBase = "/api/leads",
  extraActions,
}: {
  leads: Lead[];
  propertyBase: string;
  apiBase?: string;
  extraActions?: (lead: Lead) => React.ReactNode;
}) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [draft, setDraft] = useState("");

  const patch = async (id: string, body: object) => {
    const res = await fetch(`${apiBase}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return void toast.error((await res.text()) || "Could not update.");
    const updated = await res.json();
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: updated.status } : l)));
    setNotes((n) => ({ ...n, [id]: updated.notes || [] }));
    return updated;
  };

  const toggle = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setDraft("");
    if (!notes[id]) {
      const res = await fetch(`${apiBase}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNotes((n) => ({ ...n, [id]: data.notes || [] }));
      }
    }
  };

  const shown = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  if (leads.length === 0) {
    return <div className="bg-white rounded-card border border-[#E8E0D0] p-10 text-center text-sm text-navy-700">No enquiries yet. They appear here as soon as someone fills the form on your listings.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ value: "ALL", label: "All" }, ...LEAD_STATUSES].map((s) => (
          <button key={s.value} type="button" onClick={() => setFilter(s.value)} className={`px-3 h-8 rounded-pill text-xs font-semibold whitespace-nowrap border ${filter === s.value ? "bg-navy-900 text-gold-500 border-navy-900" : "bg-white text-navy-800"}`}>
            {s.label} ({s.value === "ALL" ? leads.length : leads.filter((l) => l.status === s.value).length})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {shown.map((l) => (
          <li key={l.id} className="bg-white rounded-card border border-[#E8E0D0] p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-navy-900">{l.name}</p>
                <p className="text-sm text-navy-700">{l.phone}{l.email ? ` · ${l.email}` : ""}</p>
                {l.propertyId && (
                  <Link href={`${propertyBase}/${l.propertyId}`} target="_blank" className="text-xs underline text-navy-600 truncate block">{l.propertyTitle || "View listing"}</Link>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-500">{new Date(l.createdAt).toLocaleDateString("en-IN")}</span>
                <label className="sr-only" htmlFor={`st-${l.id}`}>Status</label>
                <select id={`st-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })} className={`h-8 px-2 rounded-pill text-xs font-bold border-0 ${STATUS_STYLE[l.status] || ""}`}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {l.message && <p className="text-sm text-navy-800 italic">&ldquo;{l.message}&rdquo;</p>}
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${l.phone}`} className="h-9 px-3 rounded-btn bg-navy-900 text-gold-500 text-sm font-semibold inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> Call</a>
              <a href={`https://wa.me/${waNumber(l.phone)}?text=${encodeURIComponent(`Hi ${l.name}, thanks for your enquiry about "${l.propertyTitle || "the property"}".`)}`} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-btn bg-[#25D366] text-white text-sm font-semibold inline-flex items-center gap-1.5"><FaWhatsapp className="w-4 h-4" /> WhatsApp</a>
              <button type="button" onClick={() => toggle(l.id)} className="h-9 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5">
                Notes {open === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {extraActions?.(l)}
            </div>
            {open === l.id && (
              <div className="border-t border-[#E8E0D0] pt-3 space-y-2">
                {(notes[l.id] || []).map((n) => (
                  <p key={n.id} className="text-sm text-navy-800"><span className="text-xs text-navy-500 mr-2">{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>{n.note}</p>
                ))}
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    if (await patch(l.id, { note: draft.trim() })) setDraft("");
                  }}
                >
                  <label className="sr-only" htmlFor={`note-${l.id}`}>Add a note</label>
                  <input id={`note-${l.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note (e.g. visit on Sunday)" className="flex-1 h-9 px-3 border rounded-md text-sm" />
                  <button type="submit" className="h-9 px-3 rounded-btn bg-navy-900 text-gold-500 text-sm font-semibold">Save</button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
