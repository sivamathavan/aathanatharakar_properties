"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FileCheck2, Paperclip, Lock, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import { DOC_ITEMS } from "@/lib/doc-items";
import { useT } from "@/components/i18n/I18nProvider";

type Status = "PENDING" | "RECEIVED" | "VERIFIED";
type Item = { status: Status; fileUrl?: string | null; filePath?: string | null };

const STATUS_STYLE: Record<Status, string> = {
  PENDING: "bg-white text-navy-800 border-[#E4DED2]",
  RECEIVED: "bg-amber-50 text-amber-900 border-amber-300",
  VERIFIED: "bg-green-50 text-green-800 border-green-300",
};

/** Patta, Chitta, EC… for one listing. Private: only the agent sees it. */
export function DocsChecklist({ propertyId, uid, initial }: { propertyId: string; uid: string; initial: Partial<Record<string, Item>> }) {
  const t = useT();
  const [items, setItems] = useState<Partial<Record<string, Item>>>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const done = DOC_ITEMS.filter((d) => items[d]?.status === "VERIFIED").length;

  const save = async (next: Partial<Record<string, Item>>, name: string) => {
    setBusy(name);
    const res = await fetch(`/api/properties/${propertyId}/docs`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: next }) });
    setBusy(null);
    if (!res.ok) return void toast.error((await res.text()) || t("Could not save."));
    setItems(next);
  };

  const setStatus = (name: string, status: Status) => save({ ...items, [name]: { ...(items[name] || {}), status } }, name);

  const upload = async (name: string, file?: File) => {
    if (!file) return;
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) return void toast.error(t("Choose a PDF or a photo."));
    if (file.size > 10 * 1024 * 1024) return void toast.error(t("The file must be under 10 MB."));
    setBusy(name);
    try {
      const path = `agent-docs/${uid}/${propertyId}/${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}.${file.type === "application/pdf" ? "pdf" : "jpg"}`;
      const snap = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(snap.ref);
      const current = items[name]?.status;
      await save({ ...items, [name]: { status: current === "VERIFIED" ? "VERIFIED" : "RECEIVED", fileUrl: url, filePath: path } }, name);
    } catch {
      toast.error(t("Upload failed. Check your connection and try again."));
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="docs-heading" className="bg-white rounded-card border border-[#E4DED2] p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="docs-heading" className="text-lg font-bold flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-gold-600" /> {t("Title documents")}</h2>
        <span className="text-sm font-semibold text-navy-800">{t("{done} of {total} verified", { done, total: DOC_ITEMS.length })}</span>
      </div>
      <p className="text-xs text-navy-700 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t("Only you can see these. They are never shown to buyers.")}</p>
      <ul className="divide-y divide-[#E4DED2]">
        {DOC_ITEMS.map((name) => {
          const it = items[name];
          const status = it?.status || "PENDING";
          return (
            <li key={name} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium text-sm text-navy-900 flex-1">{t(name)}</span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`doc-${name}`}>{t("Status of {doc}", { doc: t(name) })}</label>
                <select id={`doc-${name}`} value={status} disabled={busy === name} onChange={(e) => setStatus(name, e.target.value as Status)} className={`h-10 px-2 rounded-md border text-sm font-semibold ${STATUS_STYLE[status]}`}>
                  <option value="PENDING">{t("Not received")}</option>
                  <option value="RECEIVED">{t("Received")}</option>
                  <option value="VERIFIED">{t("Verified")}</option>
                </select>
                {it?.fileUrl ? (
                  <>
                    <a href={it.fileUrl} target="_blank" rel="noopener noreferrer" className="h-10 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5 underline">{t("Open file")}</a>
                    <button type="button" aria-label={t("Remove file for {doc}", { doc: t(name) })} onClick={() => save({ ...items, [name]: { status, fileUrl: null, filePath: null } }, name)} className="h-10 w-10 rounded-btn text-red-700 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <label className={`h-10 px-3 rounded-btn border text-sm inline-flex items-center gap-1.5 cursor-pointer ${busy === name ? "opacity-50" : ""}`}>
                    <Paperclip className="w-4 h-4" /> {busy === name ? t("Uploading…") : t("Attach")}
                    <input type="file" accept="application/pdf,image/*" className="sr-only" disabled={busy === name} onChange={(e) => upload(name, e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
