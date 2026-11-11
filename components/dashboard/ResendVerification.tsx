"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "@/lib/notify";
import { auth } from "@/lib/firebase";
import { confirmLinkSettings, syncEmailVerified } from "@/lib/auth-client";
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
          await sendEmailVerification(auth.currentUser, confirmLinkSettings());
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

/**
 * Notices by itself when the agent has clicked the confirm link: on load, and
 * whenever they come back to this tab. The button checks on demand.
 */
export function EmailConfirmedCheck() {
  const t = useT();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const check = useCallback(
    async (asked: boolean) => {
      setChecking(true);
      try {
        if (await syncEmailVerified()) {
          toast.success(t("Email confirmed. Your page is public now."));
          router.refresh();
        } else if (asked) {
          toast.error(t("Not confirmed yet. Open the link in the email first."));
        }
      } catch {
        if (asked) toast.error(t("No internet connection. Please try again."));
      } finally {
        setChecking(false);
      }
    },
    [router, t]
  );

  useEffect(() => {
    void check(false);
    const onVisible = () => document.visibilityState === "visible" && void check(false);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check]);

  return (
    <button type="button" disabled={checking} onClick={() => check(true)} className="text-sm underline font-semibold disabled:text-navy-500">
      {checking ? t("Checking…") : t("I've confirmed my email")}
    </button>
  );
}
