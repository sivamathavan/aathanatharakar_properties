"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/notify";
import { FileText, Lock } from "lucide-react";
import { canvasesToPdf, downloadBlob, drawBrochure, type KitAgent } from "@/components/dashboard/kit/canvasKit";
import { listingArea, listingKind, shortPrice } from "@/lib/listing-text";
import { slugify } from "@/lib/plans";
import { useT } from "@/components/i18n/I18nProvider";

const AREA: Record<string, string> = { SQFT: "sq.ft", CENT: "cents", ACRE: "acres", GROUND: "grounds" };

/** Two-page A4 brochure for one listing, with the agent's logo and a QR to the listing. Pro. */
export function BrochureButton({ propertyId, agent, url, pro }: { propertyId: string; agent: KitAgent; url: string; pro: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (!pro) {
    return (
      <Link href="/dashboard/billing" className="h-9 px-3 rounded-btn border border-dashed inline-flex items-center justify-center gap-1.5 text-navy-700" title={t("Brochure PDF comes with the Pro plan")}>
        <Lock className="w-4 h-4" /> {t("Brochure")}
      </Link>
    );
  }

  const make = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) throw new Error();
      const p = await res.json();
      const facts = [
        { label: t("Area"), value: `${Number(p.area).toLocaleString("en-IN")} ${AREA[p.areaUnit || "SQFT"] || ""}` },
        p.bedrooms ? { label: t("Bedrooms"), value: `${p.bedrooms} BHK` } : null,
        p.bathrooms ? { label: t("Bathrooms"), value: String(p.bathrooms) } : null,
        p.roadFacing ? { label: t("Road"), value: p.roadFacing } : null,
      ].filter(Boolean) as { label: string; value: string }[];
      const pages = await drawBrochure(
        agent,
        {
          title: p.title,
          priceText: shortPrice(p),
          kindText: listingKind(p),
          areaText: listingArea(p),
          place: `${p.locality}, ${p.city}`,
          description: p.description,
          amenities: p.amenities || [],
          facts,
          photos: (p.media || []).filter((m: any) => m.type === "IMAGE").map((m: any) => m.url),
          url,
        },
        { scanTitle: "", scanHint: "", cardScan: "", online: t("See photos and enquire online"), amenities: t("Amenities") }
      );
      downloadBlob(await canvasesToPdf(pages, 210, 297), `${slugify(p.title) || "property"}-brochure.pdf`);
    } catch {
      toast.error(t("Could not make the brochure. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={make} disabled={busy} className="h-9 px-3 rounded-btn border inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
      <FileText className="w-4 h-4" /> {busy ? t("Making PDF…") : t("Brochure")}
    </button>
  );
}
