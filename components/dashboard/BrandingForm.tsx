"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Lock, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { compressImage } from "@/components/ui/FirebaseUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGENT_LANGUAGES, BRAND_PRESETS, brandPreset, SOCIAL_KEYS } from "@/lib/agent-brand";
import { useT } from "@/components/i18n/I18nProvider";

interface AgentBrandLite {
  id: string;
  displayName: string;
  agencyName?: string | null;
  city: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  tagline?: string | null;
  officeAddress?: string | null;
  languages?: string[];
  social?: Partial<Record<string, string>>;
  coverUrl?: string | null;
  hideFooter?: boolean;
  showSold?: boolean;
}

const SOCIAL_LABEL: Record<string, string> = { website: "Website", facebook: "Facebook page", instagram: "Instagram", youtube: "YouTube channel" };

export function BrandingForm({ agent, pro }: { agent: AgentBrandLite; pro: boolean }) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [v, setV] = useState({
    brandColor: agent.brandColor || "teal",
    tagline: agent.tagline || "",
    officeAddress: agent.officeAddress || "",
    languages: agent.languages?.length ? agent.languages : ["Tamil", "English"],
    social: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, agent.social?.[k] || ""])) as Record<string, string>,
    coverUrl: agent.coverUrl || "",
    hideFooter: !!agent.hideFooter,
    showSold: !!agent.showSold,
  });
  const theme = brandPreset(v.brandColor);

  const uploadCover = async (file?: File) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return void toast.error(t("Choose a photo (JPG or PNG)."));
    setUploading(true);
    try {
      const blob = await compressImage(file, 1600);
      const snap = await uploadBytes(ref(storage, `agents/${agent.id}/cover-${Date.now()}.jpg`), blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(snap.ref);
      setV((p) => ({ ...p, coverUrl: url }));
    } catch {
      toast.error(t("Upload failed. Check your connection and try again."));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agent/branding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (!res.ok) return void toast.error((await res.text()) || t("Could not save."));
      toast.success(t("Branding saved."));
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleLang = (l: string) =>
    setV((p) => ({ ...p, languages: p.languages.includes(l) ? p.languages.filter((x) => x !== l) : [...p.languages, l] }));

  return (
    <form onSubmit={save} className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-6">
      {/* Live preview of the top of the public page */}
      <div aria-label={t("Preview of your page header")} className="rounded-xl overflow-hidden relative" style={{ backgroundColor: theme.bg, color: "#fff" }}>
        {pro && v.coverUrl && (
          <>
            <Image src={v.coverUrl} alt="" fill className="object-cover" sizes="640px" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.bg}99 0%, ${theme.bg}F2 70%)` }} />
          </>
        )}
        <div className={`relative p-4 ${pro && v.coverUrl ? "pt-16" : ""} space-y-3`}>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl shrink-0 border-2" style={{ backgroundColor: theme.accent, borderColor: theme.accent, color: "#111" }}>
              {agent.photoUrl ? <Image src={agent.photoUrl} alt="" fill className="object-cover" sizes="56px" /> : agent.displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold truncate">{agent.displayName}</p>
              {agent.agencyName && <p className="text-sm font-semibold truncate" style={{ color: theme.accent }}>{agent.agencyName}</p>}
              {v.tagline && <p className="text-xs text-white/90 truncate">{v.tagline}</p>}
              <p className="text-[11px] text-white/80 flex items-center gap-1"><MapPin className="w-3 h-3" /> {agent.city}{v.languages.length ? ` · ${v.languages.join(", ")}` : ""}</p>
            </div>
            {agent.logoUrl && (
              <div className="relative w-12 h-12 bg-white rounded-lg shrink-0">
                <Image src={agent.logoUrl} alt="" fill className="object-contain p-1" sizes="48px" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <span className="h-9 rounded-btn bg-[#25D366] text-[#0B3B1E] inline-flex items-center justify-center gap-1.5"><FaWhatsapp className="w-4 h-4" /> WhatsApp</span>
            <span className="h-9 rounded-btn inline-flex items-center justify-center gap-1.5" style={{ backgroundColor: theme.accent, color: theme.bg }}><Phone className="w-4 h-4" /> {t("Call")}</span>
          </div>
        </div>
      </div>
      {!agent.logoUrl && <p className="text-xs text-navy-700">{t("Add your logo in the Profile card above. It shows on your page, listings, WhatsApp previews and poster.")}</p>}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy-900">{t("Page colour")}</legend>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {BRAND_PRESETS.map((p) => (
            <label key={p.id} className="relative cursor-pointer" title={p.name}>
              <input type="radio" name="brandColor" value={p.id} checked={v.brandColor === p.id} onChange={() => setV({ ...v, brandColor: p.id })} className="sr-only peer" />
              <span className="block h-11 rounded-lg border-2 border-transparent peer-checked:border-navy-900 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500 overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.bg} 60%, ${p.accent} 60%)` }}>
                {v.brandColor === p.id && <Check className="w-4 h-4 text-white absolute top-1 left-1" aria-hidden />}
              </span>
              <span className="sr-only">{p.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-navy-600">{t("Every colour keeps your phone number easy to read.")}</p>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="br-tagline">{t("Tagline")}</Label>
          <Input id="br-tagline" value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} maxLength={80} placeholder={t("e.g. DTCP plots and homes in Coimbatore since 2010")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="br-office">{t("Office address")}</Label>
          <Input id="br-office" value={v.officeAddress} onChange={(e) => setV({ ...v, officeAddress: e.target.value })} maxLength={200} placeholder={t("e.g. 12, Cross Cut Road, Gandhipuram, Coimbatore")} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy-900">{t("Languages you speak")}</legend>
        <div className="flex flex-wrap gap-2">
          {AGENT_LANGUAGES.map((l) => (
            <label key={l} className={`h-10 px-3 inline-flex items-center gap-2 rounded-pill border text-sm cursor-pointer ${v.languages.includes(l) ? "bg-navy-900 text-white border-navy-900" : "bg-white text-navy-800"}`}>
              <input type="checkbox" className="sr-only" checked={v.languages.includes(l)} onChange={() => toggleLang(l)} />
              {v.languages.includes(l) && <Check className="w-4 h-4" aria-hidden />} {l}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-navy-900">{t("Social links (optional)")}</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {SOCIAL_KEYS.map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`br-${k}`} className="text-xs">{SOCIAL_LABEL[k]}</Label>
              <Input id={`br-${k}`} type="url" inputMode="url" value={v.social[k]} onChange={(e) => setV({ ...v, social: { ...v.social, [k]: e.target.value } })} placeholder="https://" maxLength={300} />
            </div>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-navy-900">
        <input type="checkbox" className="mt-1 w-4 h-4" checked={v.showSold} onChange={(e) => setV({ ...v, showSold: e.target.checked })} />
        <span>{t("Show my recently sold and rented properties on my page")}</span>
      </label>

      <div className={`rounded-lg border p-4 space-y-3 ${pro ? "border-[#E4DED2]" : "border-dashed border-navy-200 bg-navy-50/40"}`}>
        <p className="text-sm font-semibold text-navy-900 flex items-center gap-2">{!pro && <Lock className="w-4 h-4 text-gold-600" />} {t("Pro extras")}</p>
        {!pro && (
          <p className="text-xs text-navy-700">
            {t("Cover photo, property brochure PDF and removing the footer come with the Pro plan.")} <Link href="/dashboard/billing" className="underline font-semibold">{t("See plans")}</Link>
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="relative w-32 h-16 rounded-md overflow-hidden bg-navy-50 shrink-0">
            {v.coverUrl && <Image src={v.coverUrl} alt={t("Cover photo")} fill className="object-cover" sizes="128px" />}
          </div>
          <div className="space-y-1">
            <label className={`inline-flex h-10 px-3 items-center rounded-btn border text-sm font-semibold ${pro ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
              {uploading ? t("Uploading…") : v.coverUrl ? t("Change cover photo") : t("Add cover photo")}
              <input type="file" accept="image/*" className="sr-only" disabled={!pro || uploading} onChange={(e) => uploadCover(e.target.files?.[0])} />
            </label>
            {v.coverUrl && pro && (
              <button type="button" className="block text-xs text-red-700 underline" onClick={() => setV({ ...v, coverUrl: "" })}>{t("Remove")}</button>
            )}
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm text-navy-900">
          <input type="checkbox" className="mt-1 w-4 h-4" disabled={!pro} checked={v.hideFooter} onChange={(e) => setV({ ...v, hideFooter: e.target.checked })} />
          <span>{t("Hide the “Page made with” line at the bottom of my page")}</span>
        </label>
      </div>

      <Button type="submit" disabled={saving || uploading} className="h-11 bg-navy-900 text-gold-500 font-bold">{saving ? t("Saving…") : t("Save branding")}</Button>
    </form>
  );
}
