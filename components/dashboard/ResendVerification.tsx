"use client";

import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useT } from "@/components/i18n/I18nProvider";

export function ResendVerification() {
  const t = useT();
  const [sent, setSent] = useState(false);
  return (
    <button
      type="button"
      disabled={sent}
      className="text-sm underline font-semibold disabled:no-underline disabled:text-navy-500"
      onClick={async () => {
        if (!auth.currentUser) return void toast.error(t("Sign in again to resend the email."));
        try {
          await sendEmailVerification(auth.currentUser);
          setSent(true);
          toast.success(t("Email sent. Check your inbox and spam folder."));
        } catch {
          toast.error(t("Could not send the email. Try again in a few minutes."));
        }
      }}
    >
      {sent ? t("Email sent") : t("Resend email")}
    </button>
  );
}
