"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FaWhatsapp } from "react-icons/fa";
import { Phone, Pencil, Trash2, UserPlus, Archive, RotateCcw, Sparkles } from "lucide-react";
import { matchesFor, matchLabel } from "@/lib/match";
import { shortPrice } from "@/lib/listing-text";
import { waNumber } from "@/lib/plans";
import { PROPERTY_TYPES, TN_CITIES } from "@/lib/constants";
import { useT } from "@/components/i18n/I18nProvider";

export interface BuyerRow {
  id: string;
  name: string;
  phone: string;
  listingType: "BUY" | "RENT";
  types: string[];
  city?: string | null;
  localities: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  bedrooms?: number | null;
  notes?: string | null;
  status: "ACTIVE" | "CLOSED";
  leadId?: string | null;
}

export interface MatchListing {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  type: string;
  listingType: string;
  city: string;
  locality: string;
  address: string;
  bedrooms?: number | null;
  area: number;
  areaUnit?: string | null;
  photo?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartment", VILLA: "Villa", HOUSE: "House", PLOT: "Plot", COMMERCIAL: "Commercial", WAREHOUSE: "Warehouse", FARM_LAND: "Farm land", PG_HOSTEL: "PG / hostel",
};

const rupees = (n?: number | null) => (n ? shortPrice({ price: n, type: "HOUSE", listingType: "BUY", area: 0 }) : "");

export function BuyersBoard({ buyers, listings, pageBase, prefill }: { buyers: BuyerRow[]; listings: MatchListing[]; pageBase: string; prefill?: Partial<BuyerRow> | null }) {
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<"ACTIVE" | "CLOSED">("ACTIVE");
  const [editing, setEditing] = useState<Partial<BuyerRow> | null>(prefill || null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BuyerRow | null>(null);
  const shown = buyers.filter((b) => b.status === tab);

  const matches = useMemo(() => Object.fromEntries(buyers.map((b) => [b.id, matchesFor(b, listings)])), [buyers, listings]);

  const act = async (b: BuyerRow, body: Partial<BuyerRow> | "delete") => {
    const res = await fetch(`/api/buyers/${b.id}`, body === "delete" ? { method: "DELETE" } : { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...b, ...body }) }).catch(() => null);
    if (!res || !res.ok) {
      toast.error(res ? await errorText(res, t("Could not save.")) : t("No internet connection. Please try again."));
      return false;
    }
    toast.success(body === "delete" ? t("Buyer deleted.") : t("Saved."));
    router.refresh();
    return true;
  };

  const summary = (b: BuyerRow) =>
    [
      b.listingType === "RENT" ? t("Rent") : t("Buy"),
      b.types.length ? b.types.map((x) => t(TYPE_LABEL[x] || x)).join(", ") : t("Any type"),
      [b.localities.join(", "), b.city].filter(Boolean).join(" · ") || t("Any place"),
      b.budgetMin || b.budgetMax ? `${rupees(b.budgetMin) || "₹0"} – ${rupees(b.budgetMax) || t("any")}` : t("Any budget"),
      b.bedrooms ? `${b.bedrooms}+ BHK` : "",
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={t("Show")} className="inline-flex rounded-pill border border-[#E4DED2] bg-white p-0.5">
          {(["ACTIVE", "CLOSED"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={tab === s} onClick={() => setTab(s)} className={`h-9 px-4 rounded-pill text-sm font-semibold ${tab === s ? "bg-navy-900 text-gold-500" : "text-navy-800"}`}>
              {s === "ACTIVE" ? t("Looking") : t("Closed")} ({buyers.filter((b) => b.status === s).length})
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setEditing(editing && !editing.id ? null : { listingType: "BUY", types: [], localities: [], status: "ACTIVE" })} className="h-11 px-4 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold inline-flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> {t("Add a buyer")}
        </button>
      </div>

      {editing && (
        <BuyerForm
          initial={editing}
          onDone={() => {
            setEditing(null);
            // Drop ?fromLead= so a reload doesn't open the form again.
            router.replace("/dashboard/buyers");
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {shown.length === 0 ? (
        <div className="bg-white rounded-card border border-[#E4DED2] p-10 text-center space-y-2">
          <p className="font-semibold text-navy-900">{tab === "ACTIVE" ? t("No buyers saved yet") : t("No closed buyers")}</p>
          {tab === "ACTIVE" && <p className="text-sm text-navy-700">{t("Save what each client is looking for. We show which of your listings match, and you send them on WhatsApp in one tap.")}</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((b) => {
            const list = matches[b.id] || [];
            const visible = expanded === b.id ? list : list.slice(0, 3);
            return (
              <li key={b.id} className="bg-white rounded-card border border-[#E4DED2] p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{b.name}</p>
                    <p className="text-sm text-navy-700">{summary(b)}</p>
                    {b.notes && <p className="text-xs text-navy-600 mt-1">{b.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${b.phone}`} aria-label={t("Call {name}", { name: b.name })} className="h-10 w-10 rounded-btn bg-navy-900 text-gold-500 inline-flex items-center justify-center"><Phone className="w-4 h-4" /></a>
                    <a href={`https://wa.me/${waNumber(b.phone)}`} target="_blank" rel="noopener noreferrer" aria-label={t("WhatsApp {name}", { name: b.name })} className="h-10 w-10 rounded-btn bg-[#25D366] text-[#0B3B1E] inline-flex items-center justify-center"><FaWhatsapp className="w-4 h-4" /></a>
                  </div>
                </div>

                {b.status === "ACTIVE" && (
                  <div className="rounded-lg bg-navy-50/50 border border-[#E4DED2] p-3 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-gold-600" /> {t(list.length === 1 ? "1 matching listing" : "{n} matching listings", { n: list.length })}</p>
                    {list.length === 0 ? (
                      <p className="text-sm text-navy-700">{t("None of your live listings match yet. When you add one that does, it shows here.")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {visible.map(({ listing, score }) => {
                          const link = `${pageBase}/${listing.id}`;
                          const msg = t("Hi {name}, this property matches what you are looking for: {title} — {price}. See photos: {link}", { name: b.name, title: listing.title, price: shortPrice(listing), link });
                          return (
                            <li key={listing.id} className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-navy-100 shrink-0">
                                {listing.photo && <Image src={listing.photo} alt="" fill className="object-cover" sizes="56px" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-navy-900 truncate">{listing.title}</p>
                                <p className="text-xs text-navy-700">{shortPrice(listing)} · {listing.locality} · <span className="font-semibold text-gold-800">{t(matchLabel(score))}</span></p>
                              </div>
                              <a href={`https://wa.me/${waNumber(b.phone)}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="h-10 px-3 rounded-btn bg-[#25D366] text-[#0B3B1E] text-xs font-bold inline-flex items-center gap-1.5 shrink-0">
                                <FaWhatsapp className="w-4 h-4" /> {t("Send")}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {list.length > 3 && (
                      <button type="button" onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="text-sm underline text-navy-800">
                        {expanded === b.id ? t("Show fewer") : t("Show all {n}", { n: list.length })}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-sm">
                  <button type="button" onClick={() => setEditing(b)} className="h-10 px-3 rounded-btn border inline-flex items-center gap-1.5"><Pencil className="w-4 h-4" /> {t("Edit")}</button>
                  {b.status === "ACTIVE" ? (
                    <button type="button" onClick={() => act(b, { status: "CLOSED" })} className="h-10 px-3 rounded-btn border inline-flex items-center gap-1.5"><Archive className="w-4 h-4" /> {t("Found a property / close")}</button>
                  ) : (
                    <button type="button" onClick={() => act(b, { status: "ACTIVE" })} className="h-10 px-3 rounded-btn border inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> {t("Looking again")}</button>
                  )}
                  <button type="button" onClick={() => setDeleting(b)} className="h-10 px-3 rounded-btn text-red-700 inline-flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> {t("Delete")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete {name}?", { name: deleting?.name || "" })}
        description={t("Their search, budget and notes are removed. This cannot be undone.")}
        confirmLabel={t("Delete")}
        busyLabel={t("Deleting…")}
        cancelLabel={t("Keep")}
        onConfirm={() => (deleting ? act(deleting, "delete") : undefined)}
      />
    </div>
  );
}

function BuyerForm({ initial, onDone, onCancel }: { initial: Partial<BuyerRow>; onDone: () => void; onCancel: () => void }) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    listingType: initial.listingType || "BUY",
    types: initial.types || [],
    city: initial.city || "",
    localities: (initial.localities || []).join(", "),
    budgetMin: initial.budgetMin ? String(initial.budgetMin) : "",
    budgetMax: initial.budgetMax ? String(initial.budgetMax) : "",
    bedrooms: initial.bedrooms ? String(initial.bedrooms) : "",
    notes: initial.notes || "",
  });
  const field = "w-full h-11 px-3 border border-input rounded-md bg-white text-sm";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...v, localities: v.localities.split(",").map((s) => s.trim()).filter(Boolean), status: initial.status || "ACTIVE", leadId: initial.leadId || null };
      const res = await fetch(initial.id ? `/api/buyers/${initial.id}` : "/api/buyers", { method: initial.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) return void toast.error(await errorText(res, t("Could not save the buyer.")));
      toast.success(initial.id ? t("Buyer updated.") : t("Buyer saved. Matching listings are shown below."));
      onDone();
    } catch {
      toast.error(t("No internet connection. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-card border border-gold-300 p-4 grid sm:grid-cols-2 gap-3">
      <p className="sm:col-span-2 font-semibold text-navy-900">{initial.id ? t("Edit buyer") : t("What is this buyer looking for?")}</p>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Name")}</span>
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required minLength={2} maxLength={120} className={field} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Phone")}</span>
        <input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} type="tel" inputMode="tel" required className={field} />
      </label>
      <fieldset className="sm:col-span-2 space-y-1 text-sm">
        <legend className="font-medium">{t("Wants to")}</legend>
        <div className="flex gap-2">
          {(["BUY", "RENT"] as const).map((x) => (
            <label key={x} className={`h-10 px-4 inline-flex items-center rounded-pill border cursor-pointer ${v.listingType === x ? "bg-navy-900 text-white border-navy-900" : "bg-white"}`}>
              <input type="radio" name="listingType" className="sr-only" checked={v.listingType === x} onChange={() => setV({ ...v, listingType: x })} /> {x === "BUY" ? t("Buy") : t("Rent")}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="sm:col-span-2 space-y-1 text-sm">
        <legend className="font-medium">{t("Property types (leave empty for any)")}</legend>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((x) => (
            <label key={x} className={`h-10 px-3 inline-flex items-center rounded-pill border cursor-pointer ${v.types.includes(x) ? "bg-navy-900 text-white border-navy-900" : "bg-white"}`}>
              <input type="checkbox" className="sr-only" checked={v.types.includes(x)} onChange={() => setV({ ...v, types: v.types.includes(x) ? v.types.filter((y) => y !== x) : [...v.types, x] })} />
              {t(TYPE_LABEL[x] || x)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("City")}</span>
        <select value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} className={field}>
          <option value="">{t("Any city")}</option>
          {TN_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Areas (comma separated)")}</span>
        <input value={v.localities} onChange={(e) => setV({ ...v, localities: e.target.value })} placeholder={t("e.g. Vadavalli, RS Puram")} className={field} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{v.listingType === "RENT" ? t("Rent from (₹ / month)") : t("Budget from (₹)")}</span>
        <input value={v.budgetMin} onChange={(e) => setV({ ...v, budgetMin: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" className={field} />
        {v.budgetMin && <span className="text-xs text-navy-600">{rupees(Number(v.budgetMin))}</span>}
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{v.listingType === "RENT" ? t("Rent up to (₹ / month)") : t("Budget up to (₹)")}</span>
        <input value={v.budgetMax} onChange={(e) => setV({ ...v, budgetMax: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" className={field} />
        {v.budgetMax && <span className="text-xs text-navy-600">{rupees(Number(v.budgetMax))}</span>}
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{t("Bedrooms (at least)")}</span>
        <input value={v.bedrooms} onChange={(e) => setV({ ...v, bedrooms: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" className={field} />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-medium">{t("Notes")}</span>
        <input value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} maxLength={1000} placeholder={t("e.g. needs loan, wants east facing")} className={field} />
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={saving} className="h-11 px-4 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold disabled:opacity-60">{saving ? t("Saving…") : t("Save buyer")}</button>
        <button type="button" onClick={onCancel} className="h-11 px-4 rounded-btn border text-sm">{t("Cancel")}</button>
      </div>
    </form>
  );
}
