"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { errorText } from "@/lib/notify";

export interface HelpAgent {
  name: string;
  phone: string;
  email: string;
}

/**
 * "Send us a message": lands in Admin → Support. Signed-in agents only write
 * the message (the server attaches their account); visitors leave a name and
 * a phone number for the reply. Errors show inline (role=alert) inside the help
 * panel, where focus is, rather than as a toast outside it.
 */
export function SupportForm({ agent, initialMessage = "", topic, onSent }: { agent?: HelpAgent | null; initialMessage?: string; topic?: string | null; onSent?: () => void }) {
  const t = useT();
  const [v, setV] = useState({ name: "", phone: "", email: "", message: initialMessage, website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const field = "w-full h-11 px-3 rounded-btn border border-[#E4DED2] bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (v.message.trim().length < 10) return setError(t("Write a little more so we can help (at least 10 letters)."));
    if (!agent && v.name.trim().length < 2) return setError(t("Enter your name."));
    if (!agent && v.phone.replace(/[^0-9]/g, "").length < 10) return setError(t("Enter a valid 10-digit phone number so we can reply."));
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, email: v.email || null, page: window.location.pathname, topic: topic || null }),
      });
      if (!res.ok) return setError(await errorText(res, t("Could not send your message. Please try again.")));
      setSent(true);
      onSent?.();
    } catch {
      setError(t("No internet connection. Please try again."));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-card border border-navy-200 bg-white p-4 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-navy-600 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-navy-900">{t("Message sent.")}</p>
          <p className="text-navy-700">
            {agent ? t("We'll reply to {phone} or {email}.", { phone: agent.phone, email: agent.email }) : t("We'll reply on the phone number you gave.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {!agent && (
        <>
          <div className="space-y-1">
            <label htmlFor="support-name" className="text-sm font-medium text-navy-900">{t("Your name")}</label>
            <input id="support-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" maxLength={120} required data-no-voice className={field} />
          </div>
          <div className="space-y-1">
            <label htmlFor="support-phone" className="text-sm font-medium text-navy-900">{t("Phone number (for our reply)")}</label>
            <input id="support-phone" type="tel" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} autoComplete="tel" maxLength={20} required data-no-voice className={field} />
          </div>
          <div className="space-y-1">
            <label htmlFor="support-email" className="text-sm font-medium text-navy-900">{t("Email (optional)")}</label>
            <input id="support-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" maxLength={160} data-no-voice className={field} />
          </div>
        </>
      )}
      <div className="space-y-1">
        <label htmlFor="support-message" className="text-sm font-medium text-navy-900">{t("Your message")}</label>
        <textarea
          id="support-message"
          value={v.message}
          onChange={(e) => setV({ ...v, message: e.target.value })}
          rows={4}
          maxLength={1500}
          required
          data-no-voice
          placeholder={t("What happened, and on which screen?")}
          className="w-full px-3 py-2 rounded-btn border border-[#E4DED2] bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        <p className="text-xs text-navy-600">{t("Don't include owners' phone numbers or other private details.")}</p>
      </div>
      {/* Honeypot: hidden from people and screen readers; bots fill it. */}
      <input type="text" name="website" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={sending} className="w-full h-11 rounded-btn bg-navy-900 text-gold-500 text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
        {sending ? t("Sending…") : t("Send message")}
      </button>
    </form>
  );
}
