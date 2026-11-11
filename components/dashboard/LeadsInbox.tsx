"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast, errorText } from "@/lib/notify";
import { FaWhatsapp } from "react-icons/fa";
import { Phone, ChevronDown, ChevronUp, CalendarClock, CalendarPlus, MapPin, UserPlus, Search, X, Users } from "lucide-react";
import { waNumber } from "@/lib/plans";
import { followUpState, friendlyDay, istDayStart, istDaysFromToday, istTime } from "@/lib/dates";
import { useT } from "@/components/i18n/I18nProvider";
import { parseWhatsAppPaste } from "@/lib/wa-paste";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: string;
  source?: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  nextFollowUpAt?: string | null;
  siteVisitDate?: string | null;
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
  NEGOTIATION: "bg-amber-100 text-amber-900",
  CLOSED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

const SOURCE_LABEL: Record<string, string> = { WEB: "Website", AGENT_PAGE: "Your page", DIRECT: "Phone / walk-in", WHATSAPP: "WhatsApp", REFERRAL: "Referral" };
const OPEN = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION"];

/** "2026-11-08T11:00" in the browser's time (IST on the agent's phone) → ISO. */
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);
const isoToLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** 10 am IST, n days from today. */
const daysAhead = (n: number) => new Date(istDayStart(new Date(), n).getTime() + 10 * 3600 * 1000).toISOString();

function calendarLink(lead: Lead, when: string) {
  const start = new Date(when);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Site visit: ${lead.name}${lead.propertyTitle ? ` — ${lead.propertyTitle}` : ""}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Client: ${lead.name}, ${lead.phone}`,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Enquiry list with follow-ups, site visits, notes and call/WhatsApp. Used by agents and admin. */
export function LeadsInbox({
  leads: initial,
  propertyBase,
  apiBase = "/api/leads",
  extraActions,
  listings = [],
  initialView = "ALL",
  buyersEnabled = false,
  selfName,
}: {
  leads: Lead[];
  propertyBase: string;
  apiBase?: string;
  extraActions?: (lead: Lead) => React.ReactNode;
  listings?: { id: string; title: string }[];
  initialView?: string;
  buyersEnabled?: boolean;
  /** The agent's own name, so their messages in a pasted WhatsApp chat aren't taken for the client's. */
  selfName?: string;
}) {
  const t = useT();
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState(initialView);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [panel, setPanel] = useState<{ id: string; kind: "follow" | "visit" } | null>(null);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const words = { today: t("Today"), tomorrow: t("Tomorrow"), yesterday: t("Yesterday") };

  const isToday = (l: Lead) =>
    (OPEN.includes(l.status) && ["overdue", "today"].includes(followUpState(l.nextFollowUpAt) || "")) ||
    (!!l.siteVisitDate && istDaysFromToday(l.siteVisitDate) === 0);

  const patch = async (id: string, body: object) => {
    const res = await fetch(`${apiBase}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return void toast.error(await errorText(res, t("Could not update.")));
    const updated = await res.json();
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: updated.status, nextFollowUpAt: updated.nextFollowUpAt, siteVisitDate: updated.siteVisitDate } : l)));
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

  const setFollowUp = async (id: string, iso: string | null) => {
    if (await patch(id, { nextFollowUpAt: iso })) {
      toast.success(iso ? t("Follow-up set for {day}.", { day: friendlyDay(iso, new Date(), words) }) : t("Follow-up cleared."));
      setPanel(null);
    }
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = leads;
    if (filter === "TODAY") list = list.filter(isToday);
    else if (filter !== "ALL") list = list.filter((l) => l.status === filter);
    // Phone numbers match on digits only, so "98401 23456" finds "+91 9840123456".
    const digits = needle.replace(/\D/g, "");
    if (needle) list = list.filter((l) => `${l.name} ${l.phone} ${l.propertyTitle || ""}`.toLowerCase().includes(needle) || (digits.length >= 5 && l.phone.replace(/\D/g, "").includes(digits.slice(-10))));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, filter, q]);

  const todayCount = leads.filter(isToday).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{t("Search enquiries")}</span>
          <Search className="w-4 h-4 text-navy-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search name, phone or listing")} className="w-full h-11 pl-9 pr-3 rounded-btn border border-[#E4DED2] bg-white text-sm" />
        </label>
        <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding} className="h-11 px-4 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold inline-flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" /> {t("Add a client")}
        </button>
      </div>

      {adding && (
        <AddClientForm
          listings={listings}
          selfName={selfName}
          onCancel={() => setAdding(false)}
          onShowExisting={(phone) => {
            setAdding(false);
            setFilter("ALL");
            setQ(phone);
          }}
          onAdded={(lead) => {
            setLeads((ls) => [lead, ...ls]);
            setAdding(false);
            setFilter("ALL");
          }}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("Filter enquiries")}>
        {[{ value: "TODAY", label: "Today" }, { value: "ALL", label: "All" }, ...LEAD_STATUSES].map((s) => {
          const count = s.value === "ALL" ? leads.length : s.value === "TODAY" ? todayCount : leads.filter((l) => l.status === s.value).length;
          return (
            <button key={s.value} type="button" aria-pressed={filter === s.value} onClick={() => setFilter(s.value)} className={`px-3 h-9 rounded-pill text-xs font-semibold whitespace-nowrap border ${filter === s.value ? "bg-navy-900 text-gold-500 border-navy-900" : "bg-white text-navy-800"}`}>
              {t(s.label)} ({count})
            </button>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-card border border-[#E4DED2] p-10 text-center text-sm text-navy-700 space-y-2">
          <p className="font-semibold text-navy-900">{t("No enquiries yet")}</p>
          <p>{t("They appear here as soon as someone fills the form on your listings. You can also add clients who phone you.")}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-card border border-[#E4DED2] p-8 text-center text-sm text-navy-700">
          {filter === "TODAY" ? t("Nothing due today. Set a follow-up date on any enquiry and it shows up here.") : t("No enquiries match.")}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((l) => {
            const fu = followUpState(l.nextFollowUpAt);
            const wa = `https://wa.me/${waNumber(l.phone)}?text=${encodeURIComponent(t("Hi {name}, thanks for your enquiry about \"{listing}\".", { name: l.name, listing: l.propertyTitle || t("the property") }))}`;
            return (
              <li key={l.id} className="bg-white rounded-card border border-[#E4DED2] p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{l.name}</p>
                    <p className="text-sm text-navy-700">{l.phone}{l.email ? ` · ${l.email}` : ""}</p>
                    {l.propertyId ? (
                      <Link href={`${propertyBase}/${l.propertyId}`} target="_blank" className="text-xs underline text-navy-600 truncate block">{l.propertyTitle || t("View listing")}</Link>
                    ) : (
                      <p className="text-xs text-navy-600">{t(SOURCE_LABEL[l.source || ""] || "Added by you")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-navy-600">{new Date(l.createdAt).toLocaleDateString("en-IN")}</span>
                    <label className="sr-only" htmlFor={`st-${l.id}`}>{t("Status")}</label>
                    <select id={`st-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })} className={`h-9 px-2 rounded-pill text-xs font-bold border-0 ${STATUS_STYLE[l.status] || ""}`}>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{t(s.label)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {l.message && <p className="text-sm text-navy-800 italic">&ldquo;{l.message}&rdquo;</p>}

                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={() => setPanel(panel?.id === l.id && panel.kind === "follow" ? null : { id: l.id, kind: "follow" })} className={`h-9 px-3 rounded-pill border inline-flex items-center gap-1.5 font-semibold ${fu === "overdue" ? "border-red-300 bg-red-50 text-red-800" : fu === "today" ? "border-gold-400 bg-gold-50 text-navy-900" : "border-[#E4DED2] text-navy-800"}`}>
                    <CalendarClock className="w-4 h-4" />
                    {l.nextFollowUpAt ? `${t(fu === "overdue" ? "Overdue" : "Follow up")}: ${friendlyDay(l.nextFollowUpAt, new Date(), words)}` : t("Set follow-up")}
                  </button>
                  <button type="button" onClick={() => setPanel(panel?.id === l.id && panel.kind === "visit" ? null : { id: l.id, kind: "visit" })} className={`h-9 px-3 rounded-pill border inline-flex items-center gap-1.5 font-semibold ${l.siteVisitDate ? "border-purple-300 bg-purple-50 text-purple-900" : "border-[#E4DED2] text-navy-800"}`}>
                    <MapPin className="w-4 h-4" />
                    {l.siteVisitDate ? `${t("Site visit")}: ${friendlyDay(l.siteVisitDate, new Date(), words)} ${istTime(l.siteVisitDate)}` : t("Book site visit")}
                  </button>
                  {l.siteVisitDate && istDaysFromToday(l.siteVisitDate) >= 0 && (
                    <a href={calendarLink(l, l.siteVisitDate)} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-pill border border-[#E4DED2] inline-flex items-center gap-1.5 font-semibold text-navy-800">
                      <CalendarPlus className="w-4 h-4" /> {t("Add to calendar")}
                    </a>
                  )}
                </div>

                {panel?.id === l.id && panel.kind === "follow" && (
                  <div className="rounded-lg bg-navy-50/60 border border-[#E4DED2] p-3 space-y-2">
                    <p className="text-xs font-semibold text-navy-800">{t("Remind me to follow up")}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Today", n: 0 },
                        { label: "Tomorrow", n: 1 },
                        { label: "In 3 days", n: 3 },
                        { label: "Next week", n: 7 },
                      ].map((o) => (
                        <button key={o.n} type="button" onClick={() => setFollowUp(l.id, daysAhead(o.n))} className="h-9 px-3 rounded-btn bg-white border text-sm font-semibold">{t(o.label)}</button>
                      ))}
                      <label className="h-9 inline-flex items-center gap-2 text-sm">
                        <span className="sr-only">{t("Pick a date")}</span>
                        <input type="date" className="h-9 px-2 border rounded-md bg-white" onChange={(e) => e.target.value && setFollowUp(l.id, new Date(`${e.target.value}T10:00:00+05:30`).toISOString())} />
                      </label>
                      {l.nextFollowUpAt && (
                        <button type="button" onClick={() => setFollowUp(l.id, null)} className="h-9 px-3 rounded-btn text-sm text-red-700 inline-flex items-center gap-1"><X className="w-4 h-4" /> {t("Clear")}</button>
                      )}
                    </div>
                  </div>
                )}
                {panel?.id === l.id && panel.kind === "visit" && (
                  <form
                    className="rounded-lg bg-navy-50/60 border border-[#E4DED2] p-3 flex flex-wrap items-end gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const value = (new FormData(e.currentTarget).get("when") as string) || "";
                      if (await patch(l.id, { siteVisitDate: localToIso(value) })) {
                        toast.success(value ? t("Site visit saved.") : t("Site visit removed."));
                        setPanel(null);
                      }
                    }}
                  >
                    <label className="text-xs font-semibold text-navy-800 space-y-1">
                      <span className="block">{t("Date and time")}</span>
                      <input name="when" type="datetime-local" defaultValue={isoToLocal(l.siteVisitDate)} className="h-10 px-2 border rounded-md bg-white text-sm" required={!l.siteVisitDate} />
                    </label>
                    <button type="submit" className="h-10 px-3 rounded-btn bg-navy-900 text-gold-500 text-sm font-semibold">{t("Save")}</button>
                    {l.siteVisitDate && (
                      <button type="button" onClick={async () => (await patch(l.id, { siteVisitDate: null })) && setPanel(null)} className="h-10 px-3 rounded-btn text-sm text-red-700">{t("Remove visit")}</button>
                    )}
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${l.phone}`} onClick={() => patch(l.id, { contacted: true })} className="h-10 px-3 rounded-btn bg-navy-900 text-gold-500 text-sm font-semibold inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {t("Call")}</a>
                  <a href={wa} onClick={() => patch(l.id, { contacted: true })} target="_blank" rel="noopener noreferrer" className="h-10 px-3 rounded-btn bg-[#25D366] text-[#0B3B1E] text-sm font-semibold inline-flex items-center gap-1.5"><FaWhatsapp className="w-4 h-4" /> WhatsApp</a>
                  <button type="button" onClick={() => toggle(l.id)} aria-expanded={open === l.id} className="h-10 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5">
                    {t("Notes")} {open === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {buyersEnabled && (
                    <Link href={`/dashboard/buyers?fromLead=${l.id}`} className="h-10 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {t("Save as buyer")}</Link>
                  )}
                  {extraActions?.(l)}
                </div>
                {open === l.id && (
                  <div className="border-t border-[#E4DED2] pt-3 space-y-2">
                    {(notes[l.id] || []).length === 0 && <p className="text-xs text-navy-600">{t("No notes yet.")}</p>}
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
                      <label className="sr-only" htmlFor={`note-${l.id}`}>{t("Add a note")}</label>
                      <input id={`note-${l.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Add a note (e.g. wants east facing)")} className="flex-1 min-w-0 h-10 px-3 border rounded-md text-sm" />
                      <button type="submit" className="h-10 px-3 rounded-btn bg-navy-900 text-gold-500 text-sm font-semibold">{t("Save")}</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddClientForm({ listings, selfName, onAdded, onCancel, onShowExisting }: { listings: { id: string; title: string }[]; selfName?: string; onAdded: (lead: Lead) => void; onCancel: () => void; onShowExisting: (phone: string) => void }) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState({ name: "", phone: "", message: "", source: "DIRECT" });
  const [pasted, setPasted] = useState("");
  const [pasteNote, setPasteNote] = useState("");
  const [duplicate, setDuplicate] = useState<{ name: string } | null>(null);

  // Fill the fields from a copied WhatsApp message or contact; the agent checks them before saving.
  const fillFrom = (text: string) => {
    if (!text.trim()) return;
    const r = parseWhatsAppPaste(text, selfName ? [selfName] : []);
    setV((cur) => ({ name: r.name || cur.name, phone: r.phone || cur.phone, message: r.message || cur.message, source: "WHATSAPP" }));
    setPasteNote(r.name || r.phone ? t("Filled from WhatsApp. Check the name and number.") : t("No name or number found. Type them below."));
  };

  const save = async (form: HTMLFormElement, allowDuplicate = false) => {
    const f = new FormData(form);
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          phone: v.phone,
          message: v.message,
          source: v.source,
          propertyId: f.get("propertyId") || null,
          nextFollowUpAt: f.get("followUp") ? daysAhead(Number(f.get("followUp"))) : null,
          allowDuplicate,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => null);
        if (data?.duplicate) return void setDuplicate(data.duplicate);
      }
      if (!res.ok) return void toast.error(await errorText(res, t("Could not add the client.")));
      const lead = await res.json();
      toast.success(t("Client added."));
      onAdded({ ...lead, createdAt: new Date(lead.createdAt).toISOString(), nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString() : null });
    } finally {
      setSaving(false);
    }
  };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDuplicate(null);
    void save(e.currentTarget);
  };
  const field = "w-full h-11 px-3 border border-input rounded-md bg-white text-sm";
  return (
    <form onSubmit={submit} className="bg-white rounded-card border border-gold-300 p-4 grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 font-semibold text-navy-900">{t("Add a client who phoned or walked in")}</p>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium flex items-center gap-1.5"><FaWhatsapp className="w-4 h-4 text-[#128C7E]" aria-hidden /> {t("Paste from WhatsApp (optional)")}</span>
        <textarea
          data-no-voice
          rows={2}
          maxLength={4000}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          onPaste={(e) => fillFrom(e.clipboardData.getData("text"))}
          onBlur={() => !v.name && !v.phone && fillFrom(pasted)}
          placeholder={t("Long-press the client's message or contact in WhatsApp, copy it, and paste it here.")}
          className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm"
        />
        {pasteNote && <span className="block text-xs text-navy-700" role="status">{pasteNote}</span>}
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Name")}</span>
        <input name="name" required minLength={2} maxLength={120} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={field} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Phone")}</span>
        <input name="phone" type="tel" inputMode="tel" required value={v.phone} onChange={(e) => { setV({ ...v, phone: e.target.value }); setDuplicate(null); }} className={field} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("How they found you")}</span>
        <select name="source" className={field} value={v.source} onChange={(e) => setV({ ...v, source: e.target.value })}>
          <option value="DIRECT">{t("Phone / walk-in")}</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="REFERRAL">{t("Referral")}</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Interested in (optional)")}</span>
        <select name="propertyId" className={field} defaultValue="">
          <option value="">{t("No particular listing")}</option>
          {listings.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium">{t("What they want")}</span>
        <input name="message" maxLength={2000} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder={t("e.g. 2 BHK near school, budget 50 L")} className={field} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Follow up")}</span>
        <select name="followUp" className={field} defaultValue="1">
          <option value="">{t("No reminder")}</option>
          <option value="0">{t("Today")}</option>
          <option value="1">{t("Tomorrow")}</option>
          <option value="3">{t("In 3 days")}</option>
          <option value="7">{t("Next week")}</option>
        </select>
      </label>
      {duplicate && (
        <div role="alert" className="sm:col-span-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-navy-900 space-y-2">
          <p>{t("{name} is already in your enquiries with this number.", { name: duplicate.name })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onShowExisting(v.phone)} className="h-10 px-3 rounded-btn bg-navy-900 text-gold-500 font-semibold">{t("Show them")}</button>
            <button type="button" disabled={saving} onClick={(e) => { const form = e.currentTarget.form; setDuplicate(null); if (form) void save(form, true); }} className="h-10 px-3 rounded-btn border">{t("Add anyway")}</button>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button type="submit" disabled={saving} className="h-11 px-4 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold disabled:opacity-60">{saving ? t("Saving…") : t("Add client")}</button>
        <button type="button" onClick={onCancel} className="h-11 px-4 rounded-btn border text-sm">{t("Cancel")}</button>
      </div>
    </form>
  );
}
