"use client";

import { useRef, useState } from "react";
import { toast, errorText } from "@/lib/notify";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Download, Trash2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useT } from "@/components/i18n/I18nProvider";

export function AccountPanel({ email }: { email: string }) {
  const t = useT();
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [asking, setAsking] = useState(false);
  const wordRef = useRef<HTMLInputElement>(null);

  const remove = async () => {
    if (word !== "DELETE") {
      toast.error(t("Type DELETE to confirm."));
      return false;
    }
    // A fresh sign-in proves it's really you.
    const cred = await signInWithEmailAndPassword(auth, email, password).catch(() => null);
    if (!cred) {
      toast.error(t("That password is not right."));
      return false;
    }
    const idToken = await cred.user.getIdToken(true);
    const res = await fetch("/api/agent/account", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ confirm: "DELETE" }) });
    if (!res.ok) {
      toast.error(await errorText(res, t("Could not delete your account.")));
      return false;
    }
    await signOut(auth).catch(() => {});
    window.location.href = "/account-deleted";
    // Stay open and busy while the browser leaves.
    return new Promise<boolean>(() => {});
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
        <button type="button" onClick={() => setAsking(true)} className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-btn bg-red-700 text-white text-sm font-bold">
          <Trash2 className="w-4 h-4" /> {t("Delete my account")}
        </button>
        <ConfirmDialog
          open={asking}
          onOpenChange={(o) => {
            setAsking(o);
            if (!o) setPassword("");
          }}
          title={t("Delete my account")}
          description={t("This removes your page, all listings and photos, documents, enquiries, buyers and stats, and your login. It cannot be undone.")}
          confirmLabel={t("Delete my account for good")}
          busyLabel={t("Deleting…")}
          confirmDisabled={word !== "DELETE" || !password}
          initialFocus={wordRef}
          onConfirm={remove}
        >
          <div className="grid gap-3">
            <div className="space-y-1">
              <label htmlFor="del-word" className="text-sm font-medium text-navy-900">{t("Type DELETE")}</label>
              <input id="del-word" ref={wordRef} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="characters" data-no-voice className="w-full h-11 px-3 border rounded-md" />
            </div>
            <div className="space-y-1">
              <label htmlFor="del-pass" className="text-sm font-medium text-navy-900">{t("Your password")}</label>
              <input id="del-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full h-11 px-3 border rounded-md" />
            </div>
          </div>
        </ConfirmDialog>
      </section>
    </div>
  );
}
