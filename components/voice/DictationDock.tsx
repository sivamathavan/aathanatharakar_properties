"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { readVoiceLang, saveVoiceLang, useSpeech, type VoiceLang } from "@/components/voice/useSpeech";

type Field = HTMLInputElement | HTMLTextAreaElement;

const TEXT_INPUTS = new Set(["text", "search", ""]);

function isDictatable(el: Element | null): el is Field {
  if (!el || (el as HTMLElement).dataset?.noVoice !== undefined) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) return TEXT_INPUTS.has(el.type) && !el.readOnly && !el.disabled;
  return false;
}

/** Insert at the cursor through the native setter so React's onChange sees it. */
function insertText(el: Field, text: string) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const spacer = before && !/\s$/.test(before) ? " " : "";
  const next = `${before}${spacer}${text}${after}`;
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  const caret = before.length + spacer.length + text.length;
  el.setSelectionRange(caret, caret);
}

/**
 * A mic button that floats above the keyboard whenever a text box is focused,
 * and types what you say into that box. Mounted once per dashboard layout, so
 * every text box gets voice typing without wiring each one.
 */
export function DictationDock({ mobileBottom = 16 }: { mobileBottom?: number }) {
  const [field, setField] = useState<Field | null>(null);
  const [lang, setLang] = useState<VoiceLang>("ta-IN");
  const [bottom, setBottom] = useState(16);
  const fieldRef = useRef<Field | null>(null);
  fieldRef.current = field;

  const speech = useSpeech({
    lang,
    continuous: true,
    onFinal: (text) => {
      const el = fieldRef.current;
      if (el && el.isConnected) insertText(el, text);
    },
  });

  useEffect(() => setLang(readVoiceLang()), []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const onFocusIn = (e: FocusEvent) => {
      clearTimeout(hideTimer);
      setField(isDictatable(e.target as Element) ? (e.target as Field) : null);
    };
    const onFocusOut = () => {
      hideTimer = setTimeout(() => {
        if (!isDictatable(document.activeElement)) setField(null);
      }, 150);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      clearTimeout(hideTimer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Stop listening when the user leaves the box.
  useEffect(() => {
    if (!field && speech.listening) speech.stop();
  }, [field, speech]);

  // Sit just above the on-screen keyboard on phones.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Above the keyboard when it's open; otherwise clear of any bottom tab bar.
    const place = () => {
      const keyboard = window.innerHeight - (vv.height + vv.offsetTop);
      const base = window.innerWidth < 768 ? mobileBottom : 16;
      setBottom(keyboard > 80 ? keyboard + 16 : base);
    };
    place();
    vv.addEventListener("resize", place);
    vv.addEventListener("scroll", place);
    return () => {
      vv.removeEventListener("resize", place);
      vv.removeEventListener("scroll", place);
    };
  }, [mobileBottom]);

  if (!speech.supported || !field) return null;

  // Keep focus in the text box when the dock is tapped.
  const keepFocus = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();

  return (
    <div className="fixed right-4 z-[65] flex flex-col items-end gap-2" style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom, 0px))` }} onPointerDown={keepFocus} onMouseDown={keepFocus}>
      {(speech.interim || speech.error) && (
        <p role="status" className={`max-w-[16rem] rounded-xl px-3 py-2 text-xs shadow-lg ${speech.error ? "bg-red-600 text-white" : "bg-white text-navy-800 border border-[#E4DED2]"}`}>
          {speech.error || speech.interim}
        </p>
      )}
      <div className="flex items-center gap-2 rounded-full bg-navy-900 p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => {
            const next: VoiceLang = lang === "ta-IN" ? "en-IN" : "ta-IN";
            setLang(next);
            saveVoiceLang(next);
            if (speech.listening) speech.stop();
          }}
          className="h-9 min-w-[3.25rem] rounded-full px-2 text-xs font-bold text-gold-400 hover:bg-navy-800"
          aria-label={`Voice language: ${lang === "ta-IN" ? "Tamil" : "English"}. Tap to switch.`}
        >
          {lang === "ta-IN" ? "தமிழ்" : "EN"}
        </button>
        <button
          type="button"
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
          className={`h-11 w-11 rounded-full flex items-center justify-center ${speech.listening ? "bg-red-600 text-white animate-pulse" : "bg-gold-500 text-navy-900"}`}
          aria-label={speech.listening ? "Stop voice typing" : "Start voice typing"}
          aria-pressed={speech.listening}
        >
          {speech.listening ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
