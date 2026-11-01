"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { markShared } from "@/components/dashboard/markShared";

/** Copies the agent's link; the first copy counts as "shared" for onboarding. */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        markShared();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt(t("Copy this link:"), text);
        }
      }}
      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-btn border border-navy-700 text-navy-900 text-sm font-semibold hover:bg-navy-50"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      <span aria-live="polite">{copied ? t("Copied") : label || t("Copy link")}</span>
    </button>
  );
}
