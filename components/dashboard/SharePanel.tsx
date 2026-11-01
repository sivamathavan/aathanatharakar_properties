"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import { Download, FileText, Share2 } from "lucide-react";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { markShared } from "@/components/dashboard/markShared";
import { useT } from "@/components/i18n/I18nProvider";
import { canvasBlob, canvasesToPdf, downloadBlob, drawCard, drawPoster, type KitAgent, type KitLabels } from "@/components/dashboard/kit/canvasKit";

type Kind = "poster" | "card";

export function SharePanel({ url, message, slug, agent }: { url: string; message: string; slug: string; agent: KitAgent }) {
  const t = useT();
  const [kind, setKind] = useState<Kind>("poster");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels: KitLabels = {
    scanTitle: t("Scan to see my properties"),
    scanHint: t("Point your phone camera at the code"),
    cardScan: t("Scan for all my properties"),
    online: t("See photos and enquire online"),
    amenities: t("Amenities"),
  };
  const labelKey = JSON.stringify(labels);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      if (!canvas.current) return;
      try {
        if (kind === "poster") await drawPoster(canvas.current, agent, url, labels);
        else await drawCard(canvas.current, agent, url, labels);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) toast.error(t("Could not draw the design. Please reload the page."));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, url, labelKey, JSON.stringify(agent)]);

  const save = async (format: "png" | "pdf") => {
    if (!canvas.current) return;
    setBusy(true);
    try {
      const name = `${slug}-${kind === "poster" ? "poster" : "visiting-card"}`;
      if (format === "png") downloadBlob(await canvasBlob(canvas.current), `${name}.png`);
      else downloadBlob(await canvasesToPdf([canvas.current], kind === "poster" ? 210 : 88.9, kind === "poster" ? 297 : 50.8), `${name}.pdf`);
      markShared();
    } catch {
      toast.error(t("Could not save the file."));
    } finally {
      setBusy(false);
    }
  };

  // Phones can send the image straight to WhatsApp (status or a chat).
  const shareImage = async () => {
    if (!canvas.current) return;
    try {
      const file = new File([await canvasBlob(canvas.current)], `${slug}-${kind}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        markShared();
      } else {
        await save("png");
      }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-navy-600">{t("Your link")}</p>
        <p className="font-mono text-sm break-all text-navy-900">{url}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={url} />
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} onClick={markShared} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 px-4 items-center gap-2 rounded-btn bg-[#25D366] text-[#0B3B1E] text-sm font-semibold">
            <FaWhatsapp className="w-4 h-4" /> {t("Send on WhatsApp")}
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 px-4 items-center rounded-btn border text-sm font-semibold">{t("Open page")}</a>
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-4">
        <div>
          <h2 className="font-bold text-navy-900">{t("Poster and visiting card")}</h2>
          <p className="text-sm text-navy-700">{t("With your logo, colour, phone number and a QR code to your page. Print it or post it on WhatsApp status.")}</p>
        </div>
        <div role="tablist" aria-label={t("Design")} className="inline-flex rounded-pill border border-[#E4DED2] p-0.5">
          {(["poster", "card"] as Kind[]).map((k) => (
            <button key={k} role="tab" aria-selected={kind === k} type="button" onClick={() => setKind(k)} className={`h-9 px-4 rounded-pill text-sm font-semibold ${kind === k ? "bg-navy-900 text-gold-500" : "text-navy-800"}`}>
              {k === "poster" ? t("A4 poster") : t("Visiting card")}
            </button>
          ))}
        </div>
        <div className="relative rounded-lg border border-[#E4DED2] bg-navy-50 p-3 flex justify-center">
          <canvas ref={canvas} aria-label={kind === "poster" ? t("A4 poster") : t("Visiting card")} className={`max-w-full h-auto shadow-sm bg-white ${kind === "poster" ? "w-[320px]" : "w-[420px]"} ${ready ? "" : "opacity-40"}`} />
          {!ready && <span className="absolute inset-0 flex items-center justify-center text-sm text-navy-700">{t("Drawing…")}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!ready || busy} onClick={() => save("png")} className="h-11 px-4 inline-flex items-center gap-2 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold disabled:opacity-50">
            <Download className="w-4 h-4" /> {t("Download image")}
          </button>
          <button type="button" disabled={!ready || busy} onClick={() => save("pdf")} className="h-11 px-4 inline-flex items-center gap-2 rounded-btn border border-navy-700 text-navy-900 text-sm font-semibold disabled:opacity-50">
            <FileText className="w-4 h-4" /> {t("Download PDF to print")}
          </button>
          <button type="button" disabled={!ready} onClick={shareImage} className="h-11 px-4 inline-flex items-center gap-2 rounded-btn border text-sm font-semibold disabled:opacity-50 md:hidden">
            <Share2 className="w-4 h-4" /> {t("Share image")}
          </button>
        </div>
        {!agent.logoUrl && <p className="text-xs text-navy-700">{t("Tip: add your logo in Profile & branding and it appears here.")}</p>}
      </div>
    </div>
  );
}
