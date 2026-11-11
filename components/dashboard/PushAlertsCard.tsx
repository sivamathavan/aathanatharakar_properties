"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/notify";
import { BellRing, BellOff } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { pushState, turnOffPush, turnOnPush, type PushState } from "@/lib/push-client";

/** "Turn on enquiry alerts" for this phone. Shows nothing where alerts can't work. */
export function PushAlertsCard() {
  const t = useT();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pushState().then(setState).catch(() => setState("unavailable"));
  }, []);

  if (!state || state === "unavailable") return null;

  const turnOn = async () => {
    setBusy(true);
    try {
      const next = await turnOnPush();
      setState(next);
      if (next === "on") toast.success(t("Enquiry alerts are on for this phone."));
    } catch {
      toast.error(t("Could not turn on alerts. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (state === "on") {
    return (
      <p className="text-sm text-navy-800 flex flex-wrap items-center gap-x-2 gap-y-1">
        <BellRing className="w-4 h-4 text-green-700" aria-hidden /> {t("Enquiry alerts are on for this phone.")}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setState(await turnOffPush());
            setBusy(false);
          }}
          className="underline text-navy-700"
        >
          {t("Turn off")}
        </button>
      </p>
    );
  }

  return (
    <section aria-labelledby="alerts-heading" className="rounded-card border border-gold-300 bg-gold-50 p-4 flex items-start gap-3">
      {state === "blocked" ? <BellOff className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" aria-hidden /> : <BellRing className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" aria-hidden />}
      <div className="space-y-2 text-sm text-navy-900">
        <h2 id="alerts-heading" className="font-semibold">{t("Get a phone alert for every new enquiry")}</h2>
        {state === "off" && (
          <>
            <p>{t("Your phone shows a notification the moment a client sends an enquiry, even when PropPage is closed.")}</p>
            <button type="button" onClick={turnOn} disabled={busy} className="h-10 px-4 rounded-btn bg-navy-900 text-gold-500 font-bold disabled:opacity-60">
              {busy ? t("Turning on…") : t("Turn on enquiry alerts")}
            </button>
          </>
        )}
        {state === "blocked" && <p>{t("Alerts are blocked for this site. Allow notifications for PropPage in your browser's site settings, then open this page again.")}</p>}
        {state === "needs-install" && <p>{t("On iPhone, first add PropPage to your Home Screen (Share, then Add to Home Screen). Open it from there and turn on alerts here.")}</p>}
      </div>
    </section>
  );
}
