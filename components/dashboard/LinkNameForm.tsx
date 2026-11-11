"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { slugify } from "@/lib/plans";
import { useT } from "@/components/i18n/I18nProvider";

/** Choose the page link name once. The old link keeps working. */
export function LinkNameForm({ slug, siteUrl, locked }: { slug: string; siteUrl: string; locked: boolean }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(slug);
  const [check, setCheck] = useState<{ slug: string; ok: boolean; error: string | null } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const wanted = slugify(value);

  useEffect(() => {
    if (locked || wanted === slug || wanted.length < 3) return setCheck(null);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/agent/slug?slug=${encodeURIComponent(wanted)}`);
      if (res.ok) setCheck(await res.json());
    }, 350);
    return () => clearTimeout(timer);
  }, [wanted, slug, locked]);

  const save = async () => {
    const res = await fetch("/api/agent/slug", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: wanted }) });
    if (!res.ok) {
      toast.error(await errorText(res, t("Could not change your link.")));
      return false;
    }
    toast.success(t("Your new link is ready. The old one still works."));
    router.refresh();
  };

  if (locked) {
    return (
      <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-2">
        <h2 className="font-bold text-navy-900">{t("Your link")}</h2>
        <p className="font-mono text-sm break-all text-navy-900">{siteUrl}/a/{slug}</p>
        <p className="text-xs text-navy-600">{t("You have chosen your link name. Old links you shared still open this page.")}</p>
      </div>
    );
  }

  const ready = wanted !== slug && check?.slug === wanted && check.ok;
  return (
    <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-3">
      <div>
        <h2 className="font-bold text-navy-900">{t("Choose your link name")}</h2>
        <p className="text-sm text-navy-700">{t("Pick a short name clients will remember. You can choose it once; links you already shared keep working.")}</p>
      </div>
      <label htmlFor="slug-input" className="sr-only">{t("Link name")}</label>
      <div className="flex items-stretch rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-gold-500">
        <span className="px-3 flex items-center bg-navy-50 text-xs text-navy-700 shrink-0 max-w-[45%] truncate">{siteUrl.replace(/^https?:\/\//, "")}/a/</span>
        <input id="slug-input" value={value} onChange={(e) => { setValue(e.target.value); setConfirming(false); }} className="flex-1 min-w-0 h-11 px-3 text-sm outline-none" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={40} />
      </div>
      <div aria-live="polite" className="min-h-5 text-sm">
        {wanted !== value.trim() && wanted && <p className="text-navy-700">{t("Your link will be")}: <span className="font-mono">{wanted}</span></p>}
        {check?.slug === wanted && check.ok && <p className="text-green-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t("Available")}</p>}
        {check?.slug === wanted && !check.ok && <p className="text-red-700 flex items-center gap-1"><XCircle className="w-4 h-4" /> {check.error}</p>}
      </div>
      <Button type="button" disabled={!ready} onClick={() => setConfirming(true)} className="h-11 bg-navy-900 text-gold-500 font-bold disabled:opacity-50">{t("Use this link")}</Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="default"
        title={t("Change your link to {link}? You can do this only once.", { link: `/a/${wanted}` })}
        confirmLabel={t("Yes, change it")}
        busyLabel={t("Saving…")}
        onConfirm={save}
      />
    </div>
  );
}
