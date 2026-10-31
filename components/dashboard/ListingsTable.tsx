"use client";

import { BRAND } from "@/lib/brand";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import { Pencil, Trash2, Rocket, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/plans";
import { PaymentRequestForm, type UpiInfo } from "@/components/dashboard/PaymentRequestForm";

interface Row {
  id: string;
  title: string;
  price: number;
  locality: string;
  city: string;
  status: string;
  viewCount: number;
  boostUntil?: string | null;
  media: { url: string; type: string }[];
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  SOLD: "bg-navy-100 text-navy-800",
  RENTED: "bg-navy-100 text-navy-800",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Live", INACTIVE: "Hidden", SOLD: "Sold", RENTED: "Rented" };

export function ListingsTable({
  properties,
  agentSlug,
  boostPricePerWeek,
  showViews,
  upi,
  siteUrl,
}: {
  properties: Row[];
  agentSlug: string;
  boostPricePerWeek: number;
  showViews: boolean;
  upi: UpiInfo;
  siteUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [boosting, setBoosting] = useState<Row | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    const res = await fetch(`/api/properties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (!res.ok) return void toast.error((await res.text()) || "Could not update.");
    toast.success(status === "ACTIVE" ? "Listing is live." : status === "INACTIVE" ? "Listing hidden." : "Marked as sold.");
    router.refresh();
  };

  const remove = async (id: string) => {
    setBusy(id);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setBusy(null);
    setConfirmDelete(null);
    if (!res.ok) return void toast.error((await res.text()) || "Could not delete.");
    toast.success("Listing deleted.");
    router.refresh();
  };

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-card border border-[#E4DED2] p-10 text-center space-y-3">
        <p className="font-semibold text-navy-900">No listings yet</p>
        <p className="text-sm text-navy-700">Add your first property. It appears on your page straight away.</p>
        <Link href="/dashboard/properties/new" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">Add property</Link>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {properties.map((p) => {
          const link = `${siteUrl}/a/${agentSlug}/${p.id}`;
          const boostedUntil = p.boostUntil && new Date(p.boostUntil) > new Date() ? new Date(p.boostUntil) : null;
          const wa = `https://wa.me/?text=${encodeURIComponent(`${p.title} — ${formatINR(p.price)}\n${p.locality}, ${p.city}\n${link}`)}`;
          return (
            <li key={p.id} className="bg-white rounded-card border border-[#E4DED2] p-3 sm:p-4 flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-32 h-40 sm:h-24 rounded-lg overflow-hidden bg-navy-50 shrink-0">
                {p.media[0] && <Image src={p.media[0].url} alt="" fill className="object-cover" sizes="160px" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-pill ${STATUS_STYLE[p.status] || "bg-gray-100"}`}>{STATUS_LABEL[p.status] || p.status}</span>
                  {boostedUntil && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-pill bg-gold-100 text-gold-800">On home page until {boostedUntil.toLocaleDateString("en-IN")}</span>}
                </div>
                <p className="font-semibold text-navy-900 truncate">{p.title}</p>
                <p className="text-sm text-navy-700">{formatINR(p.price)} · {p.locality}, {p.city}</p>
                {showViews && <p className="text-xs text-navy-500">{p.viewCount || 0} views</p>}
              </div>
              <div className="flex flex-wrap sm:flex-col gap-2 sm:w-44 shrink-0 text-sm">
                {confirmDelete === p.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-xs text-red-700">Delete for good? Photos are removed too.</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(p.id)} disabled={busy === p.id} className="flex-1 h-9 rounded-btn bg-red-600 text-white font-semibold">Delete</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 h-9 rounded-btn border">Keep</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-btn bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-1.5">
                      <FaWhatsapp className="w-4 h-4" /> Share
                    </a>
                    <Link href={`/dashboard/properties/${p.id}/edit`} className="h-9 px-3 rounded-btn border border-navy-700 text-navy-900 font-semibold inline-flex items-center justify-center gap-1.5">
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    {p.status === "ACTIVE" ? (
                      <>
                        <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, "SOLD")} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Mark sold
                        </button>
                        <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, "INACTIVE")} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                          <EyeOff className="w-4 h-4" /> Hide
                        </button>
                        {!boostedUntil && (
                          <button type="button" onClick={() => setBoosting(p)} className="h-9 px-3 rounded-btn bg-gold-500 text-navy-900 font-semibold inline-flex items-center justify-center gap-1.5">
                            <Rocket className="w-4 h-4" /> Boost
                          </button>
                        )}
                      </>
                    ) : (
                      <button type="button" disabled={busy === p.id} onClick={() => setStatus(p.id, "ACTIVE")} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4" /> Make live
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirmDelete(p.id)} className="h-9 px-3 rounded-btn text-red-700 inline-flex items-center justify-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {boosting && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Boost listing">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-navy-900">Show on the {BRAND.name} home page</h2>
              <p className="text-sm text-navy-700">
                &ldquo;{boosting.title}&rdquo; appears on the {BRAND.name} home page and search, with your number, for the weeks you pay for. {formatINR(boostPricePerWeek)} per week.
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
            <button type="button" onClick={() => setBoosting(null)} className="w-full h-10 rounded-btn border text-sm">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
