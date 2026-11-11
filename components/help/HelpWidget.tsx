"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircleQuestion } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { OPEN_HELP_EVENT, type HelpView } from "@/components/help/open-help";
import type { HelpAgent } from "@/components/help/SupportForm";
import type { HelpSurface } from "@/lib/help/topics";
import type { PlansConfig } from "@/types";

const loadPanel = () => import("@/components/help/HelpPanel");
const HelpPanel = dynamic(loadPanel, { ssr: false });

const EDITABLE = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=''], [contenteditable='true']";

/**
 * The floating Help button and its chat panel (loaded on first use). On phones
 * it sits above the bottom menu; it steps aside while a text box is focused, so
 * it never covers the keyboard, the dictation mic or the field being typed in.
 */
export function HelpWidget({ surface, brand, plans, agent }: { surface: HelpSurface; brand: string; plans?: PlansConfig | null; agent?: HelpAgent | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const [view, setView] = useState<HelpView>("chat");
  const [typing, setTyping] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setView((e as CustomEvent<HelpView>).detail || "chat");
      setUsed(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_HELP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_HELP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const check = () => {
      const el = document.activeElement as HTMLElement | null;
      setTyping(!!el && el.matches(EDITABLE) && !el.closest("[data-help-panel]"));
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(check, 120);
    };
    document.addEventListener("focusin", check);
    document.addEventListener("focusout", later);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", check);
      document.removeEventListener("focusout", later);
    };
  }, []);

  // Fetch the panel's code once the page is idle, so the first tap opens at once.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void loadPanel());
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(() => void loadPanel(), 3000);
    return () => clearTimeout(id);
  }, []);

  const show = () => {
    setView("chat");
    setUsed(true);
    setOpen(true);
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        data-help-launcher
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${typing || open ? "hidden" : "inline-flex"} fixed right-4 md:right-6 bottom-[calc(84px_+_env(safe-area-inset-bottom))] md:bottom-6 z-[45] h-12 min-w-12 px-3 md:px-4 rounded-pill bg-navy-900 text-gold-400 border-2 border-white shadow-[0_6px_20px_rgba(12,43,41,0.35)] items-center justify-center gap-2 hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 print:hidden`}
      >
        <MessageCircleQuestion className="w-6 h-6" aria-hidden />
        <span className="sr-only md:not-sr-only text-sm font-bold text-white">{t("Help")}</span>
      </button>
      {used && (
        <HelpPanel open={open} onOpenChange={setOpen} view={view} onViewChange={setView} surface={surface} brand={brand} plans={plans} agent={agent} returnFocus={launcher} />
      )}
    </>
  );
}
