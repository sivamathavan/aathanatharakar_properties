"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, LifeBuoy, MessageSquareText, SendHorizontal, X } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { SupportLinks, hasSupport } from "@/components/support/SupportLinks";
import { SupportForm, type HelpAgent } from "@/components/help/SupportForm";
import type { HelpView } from "@/components/help/open-help";
import { STARTERS, helpTopics, type HelpLink, type HelpSurface } from "@/lib/help/topics";
import { findTopics } from "@/lib/help/search";
import type { PlansConfig } from "@/types";

interface Msg {
  id: number;
  from: "bot" | "me";
  text: string;
  link?: HelpLink;
  /** Follow-up questions (topic ids) offered under this answer. */
  chips?: string[];
  offerContact?: boolean;
}

export interface HelpPanelProps {
  open: boolean;
  view: HelpView;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: HelpView) => void;
  surface: HelpSurface;
  brand: string;
  plans?: PlansConfig | null;
  agent?: HelpAgent | null;
  /** Where focus goes when the panel closes: the Help button (hidden while open, so it must be named). */
  returnFocus?: React.RefObject<HTMLElement | null>;
}

/**
 * The help chat: answers come from lib/help/topics.ts, matched in the browser.
 * A Base UI Dialog, so focus stays inside, Esc closes and focus returns to the
 * Help button. New answers are announced through the role="log" region.
 */
export default function HelpPanel({ open, view, onOpenChange, onViewChange, surface, brand, plans, agent, returnFocus }: HelpPanelProps) {
  const t = useT();
  const topics = useMemo(() => helpTopics(t, { surface, brand, plans }), [t, surface, brand, plans]);
  const byId = useMemo(() => new Map(topics.map((x) => [x.id, x])), [topics]);
  const firstName = agent?.name.split(/\s+/)[0];
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: 0,
      from: "bot",
      text: firstName
        ? t("Hi {name}. I can answer common questions about {brand}. Pick one below or type your own.", { name: firstName, brand })
        : t("Hi. I can answer common questions about {brand}. Pick one below or type your own.", { brand }),
      chips: STARTERS[surface],
      offerContact: true,
    },
  ]);
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const nextId = useRef(1);
  const logRef = useRef<HTMLDivElement>(null);
  const asked = useRef(new Set<string>());

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, view, open]);

  // Switching between questions and "Talk to us" removes the button that was
  // pressed, so move focus to the new view instead of losing it.
  const shownView = useRef(view);
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    if (open) logRef.current?.focus();
  }, [view, open]);

  const followUps = (exclude: string[]) =>
    [...STARTERS[surface], ...topics.map((x) => x.id)].filter((id, i, all) => all.indexOf(id) === i && !exclude.includes(id) && !asked.current.has(id)).slice(0, 3);

  const push = (...add: Omit<Msg, "id">[]) => setMessages((prev) => [...prev, ...add.map((m) => ({ ...m, id: nextId.current++ }))]);

  const answer = (id: string, related: string[] = []) => {
    const x = byId.get(id);
    if (!x) return;
    asked.current.add(id);
    setTopic(id);
    const chips = [...related.filter((r) => r !== id), ...followUps([id, ...related])].slice(0, 3);
    push({ from: "me", text: x.q }, { from: "bot", text: x.a, link: x.link, chips, offerContact: x.contact });
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    const found = findTopics(q, topics);
    if (found.length) {
      const [best, ...rest] = found;
      asked.current.add(best.id);
      setTopic(best.id);
      push(
        { from: "me", text: q },
        { from: "bot", text: best.a, link: best.link, chips: [...rest.map((r) => r.id), ...followUps([best.id, ...rest.map((r) => r.id)])].slice(0, 3), offerContact: best.contact }
      );
    } else {
      setDraft(q);
      setTopic(null);
      push(
        { from: "me", text: q },
        { from: "bot", text: t("I don't have an answer for that yet. Send your question to the {brand} team and we'll reply.", { brand }), offerContact: true, chips: followUps([]) }
      );
    }
  };

  const talk = () => onViewChange("contact");
  const close = () => onOpenChange(false);
  const last = messages[messages.length - 1];

  return (
    <Dialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-navy-950/40 md:bg-navy-950/10 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          data-help-panel
          initialFocus={logRef}
          finalFocus={returnFocus || true}
          className="fixed z-[70] inset-x-0 bottom-0 h-[88dvh] max-h-[720px] rounded-t-2xl md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[min(640px,calc(100dvh-48px))] md:rounded-card bg-cream-50 shadow-2xl flex flex-col overflow-hidden font-sans outline-none transition-[opacity,transform] duration-200 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0"
        >
          <header className="bg-navy-900 text-white px-3 py-3 flex items-center gap-2 shrink-0">
            {view === "contact" ? (
              <button type="button" onClick={() => onViewChange("chat")} className="h-10 w-10 rounded-full inline-flex items-center justify-center hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400" aria-label={t("Back to questions")}>
                <ArrowLeft className="w-5 h-5" aria-hidden />
              </button>
            ) : (
              <span className="h-10 w-10 rounded-full bg-navy-800 text-gold-400 inline-flex items-center justify-center shrink-0" aria-hidden>
                <LifeBuoy className="w-5 h-5" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <Dialog.Title className="font-display text-lg font-semibold leading-tight">{view === "contact" ? t("Talk to us") : t("Help")}</Dialog.Title>
              <Dialog.Description className="text-xs text-navy-100 truncate">
                {view === "contact" ? t("The {brand} team reads every message.", { brand }) : t("Answers from the {brand} guide", { brand })}
              </Dialog.Description>
            </div>
            <Dialog.Close className="h-10 w-10 rounded-full inline-flex items-center justify-center hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400" aria-label={t("Close help")}>
              <X className="w-5 h-5" aria-hidden />
            </Dialog.Close>
          </header>

          {view === "chat" ? (
            <>
              <div ref={logRef} role="log" aria-label={t("Help conversation")} tabIndex={-1} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 outline-none">
                {messages.map((m) =>
                  m.from === "me" ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        <span className="sr-only">{t("You asked")}: </span>
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div key={m.id} className="space-y-2">
                      <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white border border-[#E4DED2] px-3.5 py-2.5 text-sm leading-relaxed text-navy-900 space-y-2">
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        {m.link && (
                          <Link href={m.link.href} onClick={close} className="inline-flex items-center gap-1 font-semibold text-navy-700 underline underline-offset-2">
                            {m.link.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                          </Link>
                        )}
                      </div>
                      {(m.chips?.length || m.offerContact) && (
                        <div className="flex flex-wrap gap-2" role="group" aria-label={t("More questions")}>
                          {m.chips?.map((id) =>
                            byId.get(id) ? (
                              <button key={id} type="button" onClick={() => answer(id, m.chips)} className="min-h-10 px-3 py-2 rounded-pill border border-navy-200 bg-white text-left text-[13px] font-medium text-navy-800 hover:border-navy-400 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
                                {byId.get(id)!.q}
                              </button>
                            ) : null
                          )}
                          {m.offerContact && m === last && (
                            <button type="button" onClick={talk} className="min-h-10 px-3 py-2 rounded-pill bg-gold-100 border border-gold-300 text-[13px] font-semibold text-navy-900 inline-flex items-center gap-1.5 hover:bg-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500">
                              <MessageSquareText className="w-4 h-4" aria-hidden /> {t("Talk to a person")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
              <form onSubmit={ask} className="shrink-0 border-t border-[#E4DED2] bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center gap-2">
                <label htmlFor="help-question" className="sr-only">{t("Type your question")}</label>
                <input
                  id="help-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("Type your question")}
                  autoComplete="off"
                  enterKeyHint="send"
                  maxLength={300}
                  data-no-voice
                  className="flex-1 min-w-0 h-11 px-3 rounded-btn border border-[#E4DED2] bg-cream-50 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
                <button type="submit" disabled={!question.trim()} className="h-11 w-11 shrink-0 rounded-btn bg-navy-900 text-gold-500 inline-flex items-center justify-center disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400" aria-label={t("Ask")}>
                  <SendHorizontal className="w-5 h-5" aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <div ref={logRef} tabIndex={-1} className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(16px,env(safe-area-inset-bottom))] space-y-4 outline-none">
              {hasSupport() && (
                <section className="space-y-2">
                  <p className="text-sm text-navy-800">{t("Message us on WhatsApp or email:")}</p>
                  <SupportLinks
                    message={agent ? `Hi ${brand} team, I'm ${agent.name} (${agent.email}). I need help with: ${draft}` : `Hi ${brand} team, I need help with: ${draft}`}
                  />
                </section>
              )}
              <section className="space-y-3">
                <p className="text-sm text-navy-800">{hasSupport() ? t("Or send us a message here:") : t("Send us a message and we'll reply.")}</p>
                <SupportForm key={draft} agent={agent} initialMessage={draft} topic={topic} />
              </section>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
