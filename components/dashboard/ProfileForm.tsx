"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { compressImage } from "@/components/ui/FirebaseUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TN_CITIES } from "@/lib/constants";

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

export function ProfileForm({ agent, canBrand }: { agent: AgentLite; canBrand: boolean }) {
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
    if (!/^image\//.test(file.type)) return void toast.error("Choose a photo (JPG or PNG).");
    setUploading(kind);
    try {
      const blob = await compressImage(file, 600);
      const snap = await uploadBytes(ref(storage, `agents/${agent.id}/${kind}-${Date.now()}.jpg`), blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(snap.ref);
      setV((p) => ({ ...p, [kind === "photo" ? "photoUrl" : "logoUrl"]: url }));
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(null);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agent/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (!res.ok) return void toast.error((await res.text()) || "Could not save.");
      toast.success("Profile saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const imagePicker = (kind: "photo" | "logo", url: string, label: string) => (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-navy-900 text-gold-500 flex items-center justify-center font-display text-2xl shrink-0">
        {url ? <Image src={url} alt={label} fill className="object-cover" sizes="80px" /> : v.displayName.charAt(0)}
      </div>
      <div className="space-y-1">
        <label className="inline-flex h-9 px-3 items-center rounded-btn border text-sm font-semibold cursor-pointer">
          {uploading === kind ? "Uploading…" : url ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(kind, e.target.files?.[0])} disabled={!!uploading} />
        </label>
        {url && (
          <button type="button" className="block text-xs text-red-700 underline" onClick={() => setV((p) => ({ ...p, [kind === "photo" ? "photoUrl" : "logoUrl"]: "" }))}>
            Remove
          </button>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={save} className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-5">
      {imagePicker("photo", v.photoUrl, "Photo")}
      {canBrand ? imagePicker("logo", v.logoUrl, "Logo") : <p className="text-xs text-navy-600">Add your agency logo on the Pro plan.</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pr-name">Your name</Label>
          <Input id="pr-name" value={v.displayName} onChange={(e) => setV({ ...v, displayName: e.target.value })} required maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-agency">Agency name</Label>
          <Input id="pr-agency" value={v.agencyName} onChange={(e) => setV({ ...v, agencyName: e.target.value })} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-wa">WhatsApp number for clients</Label>
          <Input id="pr-wa" type="tel" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-city">City</Label>
          <select id="pr-city" className="w-full h-10 px-3 border rounded-md bg-white text-sm" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}>
            {[v.city, ...TN_CITIES.filter((c) => c !== v.city)].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pr-rera">RERA number (optional)</Label>
          <Input id="pr-rera" value={v.reraNumber} onChange={(e) => setV({ ...v, reraNumber: e.target.value })} maxLength={60} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pr-bio">About you</Label>
          <Textarea id="pr-bio" rows={3} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} maxLength={600} placeholder="e.g. 10 years helping families in Coimbatore buy plots and homes." />
        </div>
      </div>
      <p className="text-xs text-navy-600">Login phone: {agent.phone}. Your page link stays the same when you change your name.</p>
      <Button type="submit" disabled={saving || !!uploading} className="h-11 bg-navy-900 text-gold-500 font-bold">{saving ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
