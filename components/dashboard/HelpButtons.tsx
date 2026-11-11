"use client";

import { MessageCircleQuestion, MessageSquareText } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { openHelp } from "@/components/help/open-help";

/** More → Help and the sidebar: open the help chat, or go straight to "Talk to us". */
export function HelpButtons() {
  const t = useT();
  const item = "w-full min-h-11 px-3 rounded-btn border border-[#E4DED2] bg-white text-sm font-semibold text-navy-900 inline-flex items-center gap-2 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";
  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => openHelp("chat")} aria-haspopup="dialog" className={item}>
        <MessageCircleQuestion className="w-4 h-4 text-gold-600 shrink-0" aria-hidden /> {t("Questions & answers")}
      </button>
      <button type="button" onClick={() => openHelp("contact")} aria-haspopup="dialog" className={item}>
        <MessageSquareText className="w-4 h-4 text-gold-600 shrink-0" aria-hidden /> {t("Send us a message")}
      </button>
    </div>
  );
}
