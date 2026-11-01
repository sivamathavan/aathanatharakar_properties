"use client";

import { BRAND } from "@/lib/brand";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import { Pencil, Trash2, Rocket, Eye, EyeOff, CheckCircle2, FileCheck2, Users, RotateCcw } from "lucide-react";
import { formatINR } from "@/lib/plans";
import { PaymentRequestForm, type UpiInfo } from "@/components/dashboard/PaymentRequestForm";
import { BrochureButton } from "@/components/dashboard/BrochureButton";
import type { KitAgent } from "@/components/dashboard/kit/canvasKit";
import { useT } from "@/components/i18n/I18nProvider";

interface Row {
  id: string;
  title: string;
  price: number;
  locality: string;
  city: string;
  status: string;
  listingType: string;
  viewCount: number;
  enquiryCount?: number;
  waTaps?: number;
  callTaps?: number;
  boostUntil?: string | null;
  soldAt?: string | null;
  media: { url: string; type: string }[];
  docsVerified: number;
  buyerMatches: number;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  SOLD: "bg-navy-100 text-navy-800",
  RENTED: "bg-navy-100 text-navy-800",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Live", INACTIVE: "Hidden", SOLD: "Sold", RENTED: "Rented" };
const CLOSED = ["SOLD", "RENTED"];

export function ListingsTable({
  properties,
  agentSlug,
  boostPricePerWeek,
  showTaps,
  pro,
  upi,
  siteUrl,
  agent,
  buyerNames,
  docTotal,
}: {
  properties: Row[];
  agentSlug: string;
  boostPricePerWeek: number;
  showTaps: boolean;
  pro: boolean;
  upi: UpiInfo;
  siteUrl: string;
  agent: KitAgent;
  buyerNames: string[];
  docTotal: number;
}) {
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [boosting, setBoosting] = useState<Row | null>(null);
  const [selling, setSelling] = useState<Row | null>(null);
  const open = properties.filter((p) => !CLOSED.includes(p.status));
  const closed = properties.filter((p) => CLOSED.includes(p.status));
  const shown = tab === "OPEN" ? open : closed;

  const setStatus = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    const res = await fetch(`/api/properties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) return void toast.error((await res.text()) || t("Could not update."));
    toast.success(body.status === "ACTIVE" ? t("Listing is live.") : body.status === "INACTIVE" ? t("Listing hidden.") : body.status === "RENTED" ? t("Marked as rented.") : t("Marked as sold."));
    router.refresh();
    return true;
  };

  const remove = async (id: string) => {
    setBusy(id);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setBusy(null);
    setConfirmDelete(null);
    if (!res.ok) return void toast.error((await res.text()) || t("Could not delete."));
    toast.success(t("Listing deleted."));
    router.refresh();
  };

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-card border border-[#E4DED2] p-10 text-center space-y-3">
        <p className="font-semibold text-navy-900">{t("No listings yet")}</p>
        <p className="text-sm text-navy-700">{t("Add your first property. It appears on your page straight away.")}</p>
        <Link href="/dashboard/properties/new" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">{t("Add property")}</Link>
      </div>
    );
  }

  return (
    <>
      <div role="group" aria-label={t("Show")} className="inline-flex rounded-pill border border-[#E4DED2] bg-white p-0.5">
        {(["OPEN", "CLOSED"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`h-9 px-4 rounded-pill text-sm font-semibold ${tab === k ? "bg-navy-900 text-gold-500" : "text-navy-800"}`}>
            {k === "OPEN" ? t("Live & hidden") : t("Sold & rented")} ({k === "OPEN" ? open.length : closed.length})
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="bg-white rounded-card border border-[#E4DED2] p-8 text-center text-sm text-navy-700">
          {tab === "CLOSED" ? t("When you mark a listing sold or rented it moves here, keeps its history, and frees a slot in your plan.") : t("All your listings are sold or rented. Add a new one.")}
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((p) => {
          const link = `${siteUrl}/a/${agentSlug}/${p.id}`;
          const boostedUntil = p.boostUntil && new Date(p.boostUntil) > new Date() ? new Date(p.boostUntil) : null;
          const wa = `https://wa.me/?text=${encodeURIComponent(`${p.title} — ${formatINR(p.price)}\n${p.locality}, ${p.city}\n${link}`)}`;
          const isClosed = CLOSED.includes(p.status);
          return (
            <li key={p.id} className="bg-white rounded-card border border-[#E4DED2] p-3 sm:p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-32 h-40 sm:h-24 rounded-lg overflow-hidden bg-navy-50 shrink-0">
                {p.media[0] && <Image src={p.media[0].url} alt="" fill className={`object-cover ${isClosed ? "grayscale-[40%]" : ""}`} sizes="160px" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-pill ${STATUS_STYLE[p.status] || "bg-gray-100"}`}>{t(STATUS_LABEL[p.status] || p.status)}</span>
                  {boostedUntil && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-pill bg-gold-100 text-gold-800">{t("On home page until {date}", { date: boostedUntil.toLocaleDateString("en-IN") })}</span>}
                  {isClosed && p.soldAt && <span className="text-xs text-navy-600">{new Date(p.soldAt).toLocaleDateString("en-IN")}</span>}
                </div>
                <p className="font-semibold text-navy-900 truncate">{p.title}</p>
                <p className="text-sm text-navy-700">{formatINR(p.price)} · {p.locality}, {p.city}</p>
                <p className="text-xs text-navy-600">
                  {t(p.viewCount === 1 ? "1 view" : "{n} views", { n: p.viewCount || 0 })} · {t(p.enquiryCount === 1 ? "1 enquiry" : "{n} enquiries", { n: p.enquiryCount || 0 })}
                  {showTaps && <> · {t("{n} WhatsApp", { n: p.waTaps || 0 })} · {t(p.callTaps === 1 ? "1 call" : "{n} calls", { n: p.callTaps || 0 })}</>}
                </p>
                {!isClosed && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/dashboard/properties/${p.id}/edit#documents`} className={`text-[11px] font-semibold px-2 py-1 rounded-pill border inline-flex items-center gap-1 ${p.docsVerified === docTotal ? "border-green-300 text-green-800" : "border-[#E4DED2] text-navy-700"}`}>
                      <FileCheck2 className="w-3.5 h-3.5" /> {t("{done}/{total} documents", { done: p.docsVerified, total: docTotal })}
                    </Link>
                    {p.buyerMatches > 0 && (
                      <Link href="/dashboard/buyers" className="text-[11px] font-semibold px-2 py-1 rounded-pill border border-gold-300 bg-gold-50 text-navy-900 inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {t(p.buyerMatches === 1 ? "1 buyer matches" : "{n} buyers match", { n: p.buyerMatches })}
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap sm:flex-col gap-2 sm:w-44 shrink-0 text-sm">
                {confirmDelete === p.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-xs text-red-700">{t("Delete for good? Photos are removed too.")}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(p.id)} disabled={busy === p.id} className="flex-1 h-9 rounded-btn bg-red-700 text-white font-semibold">{t("Delete")}</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 h-9 rounded-btn border">{t("Keep")}</button>
                    </div>
                  </div>
                ) : isClosed ? (
                  <>
                    <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, { status: "ACTIVE" })} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> {t("Make live again")}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(p.id)} className="h-9 px-3 rounded-btn text-red-700 inline-flex items-center justify-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> {t("Delete")}
                    </button>
                  </>
                ) : (
                  <>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-btn bg-[#25D366] text-[#0B3B1E] font-semibold inline-flex items-center justify-center gap-1.5">
                      <FaWhatsapp className="w-4 h-4" /> {t("Share")}
                    </a>
                    <Link href={`/dashboard/properties/${p.id}/edit`} className="h-9 px-3 rounded-btn border border-navy-700 text-navy-900 font-semibold inline-flex items-center justify-center gap-1.5">
                      <Pencil className="w-4 h-4" /> {t("Edit")}
                    </Link>
                    <BrochureButton propertyId={p.id} agent={agent} url={link} pro={pro} />
                    {p.status === "ACTIVE" ? (
                      <>
                        <button type="button" disabled={busy === p.id} onClick={() => setSelling(p)} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {p.listingType === "RENT" || p.listingType === "LEASE" ? t("Mark rented") : t("Mark sold")}
                        </button>
                        <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, { status: "INACTIVE" })} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                          <EyeOff className="w-4 h-4" /> {t("Hide")}
                        </button>
                        {!boostedUntil && (
                          <button type="button" onClick={() => setBoosting(p)} className="h-9 px-3 rounded-btn bg-gold-500 text-navy-900 font-semibold inline-flex items-center justify-center gap-1.5">
                            <Rocket className="w-4 h-4" /> {t("Boost")}
                          </button>
                        )}
                      </>
                    ) : (
                      <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, { status: "ACTIVE" })} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4" /> {t("Make live")}
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirmDelete(p.id)} className="h-9 px-3 rounded-btn text-red-700 inline-flex items-center justify-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> {t("Delete")}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {selling && (
        <SoldDialog
          row={selling}
          buyerNames={buyerNames}
          onClose={() => setSelling(null)}
          onSave={async (body) => {
            if (await setStatus(selling.id, body)) setSelling(null);
          }}
        />
      )}

      {boosting && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={t("Boost listing")} onKeyDown={(e) => e.key === "Escape" && setBoosting(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-navy-900">{t("Show on the {brand} home page", { brand: BRAND.name })}</h2>
              <p className="text-sm text-navy-700">
                {t("“{title}” appears on the {brand} home page and search, with your number, for the weeks you pay for. {price} per week.", { title: boosting.title, brand: BRAND.name, price: formatINR(boostPricePerWeek) })}
              </p>
            </div>
            <PaymentRequestForm
              kind="BOOST"
              upi={upi}
              propertyId={boosting.id}
              boostPricePerWeek={boostPricePerWeek}
              onDone={() => {
                setBoosting(null);
                router.refresh();
              }}
            />
            <button type="button" onClick={() => setBoosting(null)} className="w-full h-11 rounded-btn border text-sm">{t("Cancel")}</button>
          </div>
        </div>
      )}
    </>
  );
}

function SoldDialog({ row, buyerNames, onClose, onSave }: { row: Row; buyerNames: string[]; onClose: () => void; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const t = useT();
  const rent = row.listingType === "RENT" || row.listingType === "LEASE";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="sold-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <form
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setSaving(true);
          await onSave({
            status: rent ? "RENTED" : "SOLD",
            soldAt: new Date(`${f.get("date")}T12:00:00+05:30`).toISOString(),
            soldPrice: f.get("price") ? Number(f.get("price")) : null,
            soldTo: (f.get("buyer") as string) || null,
          });
          setSaving(false);
        }}
      >
        <div>
          <h2 id="sold-title" className="text-lg font-bold text-navy-900">{rent ? t("Mark as rented") : t("Mark as sold")}</h2>
          <p className="text-sm text-navy-700">{t("“{title}” moves to Sold & rented, its link shows it as sold, and it stops using a slot in your plan.", { title: row.title })}</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t("Date")}</span>
          <input name="date" type="date" required defaultValue={today} max={today} className="w-full h-11 px-3 border rounded-md" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{rent ? t("Final rent (₹, private)") : t("Final price (₹, private)")}</span>
          <input name="price" inputMode="numeric" pattern="[0-9]*" placeholder={String(row.price)} className="w-full h-11 px-3 border rounded-md" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{rent ? t("Tenant (optional, private)") : t("Buyer (optional, private)")}</span>
          <input name="buyer" list="sold-buyers" maxLength={120} className="w-full h-11 px-3 border rounded-md" />
          <datalist id="sold-buyers">
            {buyerNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 h-11 rounded-btn bg-navy-900 text-gold-500 font-bold disabled:opacity-60">{saving ? t("Saving…") : rent ? t("Mark rented") : t("Mark sold")}</button>
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-btn border">{t("Cancel")}</button>
        </div>
      </form>
    </div>
  );
}
