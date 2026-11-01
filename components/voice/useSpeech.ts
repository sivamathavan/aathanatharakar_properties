"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The browser's built-in speech recognition (Chrome on Android/desktop, Safari
// on iPhone). Free to use; audio is processed by Google or Apple.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export type VoiceLang = "ta-IN" | "en-IN";

const LANG_KEY = "voice_lang";

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function readVoiceLang(): VoiceLang {
  try {
    return localStorage.getItem(LANG_KEY) === "en-IN" ? "en-IN" : "ta-IN";
  } catch {
    return "ta-IN";
  }
}

export function saveVoiceLang(lang: VoiceLang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Allow microphone access for this site in your browser settings.",
  "service-not-allowed": "Allow microphone access for this site in your browser settings.",
  "no-speech": "Didn't hear anything. Hold the phone closer and try again.",
  "audio-capture": "No microphone found on this device.",
  network: "Voice typing needs an internet connection.",
  "language-not-supported": "This browser can't do Tamil voice typing. Switch to English, or use Chrome.",
};

/**
 * Speech to text. `onFinal` gets each finished phrase; `interim` shows the
 * words still being recognised.
 */
export function useSpeech({ lang, continuous, onFinal }: { lang: VoiceLang; continuous: boolean; onFinal: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  useEffect(() => {
    setSupported(!!recognitionCtor());
    return () => recRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        if (r.isFinal) finalRef.current(text);
        else pending += (pending ? " " : "") + text;
      }
      setInterim(pending);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] || "Voice typing stopped. Try again.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Couldn't start the microphone. Try again.");
    }
  }, [lang, continuous]);

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) };
}
