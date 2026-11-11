"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { compressImage } from "@/components/ui/FirebaseUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TN_CITIES } from "@/lib/constants";
import { useT } from "@/components/i18n/I18nProvider";

interface AgentLite {
  id: string;
  displayName: string;
  agencyName?: string | null;
  phone: string;
  whatsapp: string;
  city: string;
  bio?: string | null;
  reraNumber?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
}

export function ProfileForm({ agent }: { agent: AgentLite }) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"photo" | "logo" | null>(null);
  const [v, setV] = useState({
    displayName: agent.displayName,
    agencyName: agent.agencyName || "",
    whatsapp: agent.whatsapp,
    city: agent.city,
    bio: agent.bio || "",
    reraNumber: agent.reraNumber || "",
    photoUrl: agent.photoUrl || "",
    logoUrl: agent.logoUrl || "",
  });

  const upload = async (kind: "photo" | "logo", file?: File) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return void toast.error(t("Choose a photo (JPG or PNG)."));
    setUploading(kind);
    try {
      const blob = await compressImage(file, 600);
      const snap = await uploadBytes(ref(storage, `agents/${agent.id}/${kind}-${Date.now()}.jpg`), blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(snap.ref);
      setV((p) => ({ ...p, [kind === "photo" ? "photoUrl" : "logoUrl"]: url }));
    } catch {
      toast.error(t("Upload failed. Check your connection and try again."));
    } finally {
      setUploading(null);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agent/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (!res.ok) return void toast.error(await errorText(res, t("Could not save.")));
      toast.success(t("Profile saved."));
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const imagePicker = (kind: "photo" | "logo", url: string, label: string) => (
    <div className="flex items-center gap-4">
      <div className={`relative w-20 h-20 overflow-hidden flex items-center justify-center font-display text-2xl shrink-0 ${kind === "logo" ? "rounded-lg bg-white border border-[#E4DED2] text-navy-400" : "rounded-full bg-navy-900 text-gold-500"}`}>
        {url ? <Image src={url} alt={label} fill className={kind === "logo" ? "object-contain p-1" : "object-cover"} sizes="80px" /> : kind === "logo" ? <span className="text-xs font-sans">{t("No logo")}</span> : v.displayName.charAt(0)}
      </div>
      <div className="space-y-1">
        <label className="inline-flex h-9 px-3 items-center rounded-btn border text-sm font-semibold cursor-pointer">
          {uploading === kind ? t("Uploading…") : url ? t(kind === "logo" ? "Change logo" : "Change photo") : t(kind === "logo" ? "Add logo" : "Add photo")}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(kind, e.target.files?.[0])} disabled={!!uploading} />
        </label>
        {url && (
          <button type="button" className="block text-xs text-red-700 underline" onClick={() => setV((p) => ({ ...p, [kind === "photo" ? "photoUrl" : "logoUrl"]: "" }))}>
            {t("Remove")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={save} className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {imagePicker("photo", v.photoUrl, t("Photo"))}
        {imagePicker("logo", v.logoUrl, t("Logo"))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pr-name">{t("Your name")}</Label>
          <Input id="pr-name" value={v.displayName} onChange={(e) => setV({ ...v, displayName: e.target.value })} required maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-agency">{t("Agency name")}</Label>
          <Input id="pr-agency" value={v.agencyName} onChange={(e) => setV({ ...v, agencyName: e.target.value })} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-wa">{t("WhatsApp number for clients")}</Label>
          <Input id="pr-wa" type="tel" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-city">{t("City")}</Label>
          <select id="pr-city" className="w-full h-10 px-3 border rounded-md bg-white text-sm" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}>
            {[v.city, ...TN_CITIES.filter((c) => c !== v.city)].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pr-rera">{t("RERA number (optional)")}</Label>
          <Input id="pr-rera" value={v.reraNumber} onChange={(e) => setV({ ...v, reraNumber: e.target.value })} maxLength={60} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pr-bio">{t("About you")}</Label>
          <Textarea id="pr-bio" rows={3} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} maxLength={600} placeholder={t("e.g. 10 years helping families in Coimbatore buy plots and homes.")} />
        </div>
      </div>
      <p className="text-xs text-navy-600">{t("Login phone: {phone}. Your page link stays the same when you change your name.", { phone: agent.phone })}</p>
      <Button type="submit" disabled={saving || !!uploading} className="h-11 bg-navy-900 text-gold-500 font-bold">{saving ? t("Saving…") : t("Save profile")}</Button>
    </form>
  );
}
