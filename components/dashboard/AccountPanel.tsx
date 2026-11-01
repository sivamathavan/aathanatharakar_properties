"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useT } from "@/components/i18n/I18nProvider";

export function AccountPanel({ email }: { email: string }) {
  const t = useT();
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (word !== "DELETE") return void toast.error(t("Type DELETE to confirm."));
    setBusy(true);
    try {
      // A fresh sign-in proves it's really you.
      const cred = await signInWithEmailAndPassword(auth, email, password).catch(() => null);
      if (!cred) return void toast.error(t("That password is not right."));
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/agent/account", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ confirm: "DELETE" }) });
      if (!res.ok) return void toast.error((await res.text()) || t("Could not delete your account."));
      await signOut(auth).catch(() => {});
      window.location.href = "/account-deleted";
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-3">
        <h2 className="font-bold text-navy-900">{t("Download my data")}</h2>
        <p className="text-sm text-navy-700">{t("One file with your profile, listings, private notes, documents list, enquiries, buyers, payments and stats.")}</p>
        <a href="/api/agent/export" download className="h-11 px-4 inline-flex items-center gap-2 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold">
          <Download className="w-4 h-4" /> {t("Download my data")}
        </a>
      </section>

      <section className="bg-white rounded-card border border-red-200 p-5 space-y-3">
        <h2 className="font-bold text-red-800">{t("Delete my account")}</h2>
        <p className="text-sm text-navy-800">{t("This removes your page, all listings and photos, documents, enquiries, buyers and stats, and your login. It cannot be undone.")}</p>
        <p className="text-sm text-navy-700">{t("We keep only your payment records (tax law) and a coded copy of your mobile number so the free trial can't be repeated.")}</p>
        <form onSubmit={remove} className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="del-word" className="text-sm font-medium">{t("Type DELETE")}</label>
            <input id="del-word" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="characters" className="w-full h-11 px-3 border rounded-md" />
          </div>
          <div className="space-y-1">
            <label htmlFor="del-pass" className="text-sm font-medium">{t("Your password")}</label>
            <input id="del-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full h-11 px-3 border rounded-md" />
          </div>
          <button type="submit" disabled={busy || word !== "DELETE" || !password} className="sm:col-span-2 h-11 px-4 inline-flex items-center justify-center gap-2 rounded-btn bg-red-700 text-white text-sm font-bold disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {busy ? t("Deleting…") : t("Delete my account for good")}
          </button>
        </form>
      </section>
    </div>
  );
}
