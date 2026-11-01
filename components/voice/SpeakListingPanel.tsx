"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Square, Sparkles } from "lucide-react";
import { readVoiceLang, saveVoiceLang, useSpeech, type VoiceLang } from "@/components/voice/useSpeech";

export interface DraftValues {
  [field: string]: string;
}

const MISSING_LABEL: Record<string, string> = {
  type: "property type",
  listingType: "sale or rent",
  price: "price",
  area: "size",
  city: "city",
  locality: "locality",
};

/**
 * Talk for half a minute (or paste a WhatsApp message) and the property form
 * fills itself. The agent checks the result before publishing.
 */
export function SpeakListingPanel({ onFill }: { onFill: (values: DraftValues) => void }) {
  const [lang, setLang] = useState<VoiceLang>("ta-IN");
  const [text, setText] = useState("");
  const [writeIn, setWriteIn] = useState<"en" | "ta">("en");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ missing: string[]; remaining: number | null } | null>(null);

  const speech = useSpeech({
    lang,
    continuous: true,
    onFinal: (phrase) => setText((t) => (t ? `${t} ${phrase}` : phrase)),
  });

  useEffect(() => setLang(readVoiceLang()), []);

  const switchLang = (next: VoiceLang) => {
    setLang(next);
    saveVoiceLang(next);
    if (speech.listening) speech.stop();
  };

  const fill = async () => {
    if (speech.listening) speech.stop();
    setBusy(true);
    try {
      const res = await fetch("/api/ai/listing-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, writeIn }),
      });
      if (!res.ok) return void toast.error((await res.text()) || "Couldn't read that. Please try again.");
      const data = await res.json();
      onFill(data.values);
      setResult({ missing: data.missing, remaining: data.remaining });
      toast.success("Form filled. Check every field before publishing.");
    } catch {
      toast.error("No internet connection. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-card border-2 border-gold-300 bg-gold-50 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-600" /> Speak or paste your listing
          </h2>
          <p className="text-sm text-navy-700">Say the type, place, size, price and anything else. Or paste the owner&apos;s WhatsApp message. We fill the form for you.</p>
        </div>
        <div className="flex rounded-full border border-navy-200 bg-white p-0.5 text-xs font-semibold" role="group" aria-label="Speaking language">
          {(["ta-IN", "en-IN"] as VoiceLang[]).map((l) => (
            <button key={l} type="button" onClick={() => switchLang(l)} aria-pressed={lang === l} className={`h-8 px-3 rounded-full ${lang === l ? "bg-navy-900 text-gold-400" : "text-navy-700"}`}>
              {l === "ta-IN" ? "தமிழ்" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
        {speech.supported && (
          <button
            type="button"
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
            aria-pressed={speech.listening}
            className={`h-14 sm:w-14 shrink-0 rounded-full flex items-center justify-center gap-2 font-bold ${speech.listening ? "bg-red-600 text-white animate-pulse" : "bg-navy-900 text-gold-500"}`}
          >
            {speech.listening ? <Square className="w-5 h-5" /> : <Mic className="w-6 h-6" />}
            <span className="sm:hidden">{speech.listening ? "Stop" : "Tap and speak"}</span>
          </button>
        )}
        <div className="flex-1 space-y-1">
          <label htmlFor="voice-draft-text" className="sr-only">What you said or pasted</label>
          <textarea
            id="voice-draft-text"
            data-no-voice
            rows={4}
            maxLength={4000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={lang === "ta-IN" ? "எ.கா. வடவள்ளியில் 5 சென்ட் மனை, 30 அடி ரோடு, கிழக்கு பார்த்தது, 25 லட்சம், பட்டா ரெடி" : "e.g. 5 cent plot in Vadavalli, 30 ft road, east facing, 25 lakhs, patta ready"}
            className="w-full rounded-md border border-navy-200 bg-white p-3 text-sm"
          />
          {speech.listening && speech.interim && <p className="text-xs text-navy-500 italic">{speech.interim}…</p>}
          {speech.error && <p className="text-xs text-red-700">{speech.error}</p>}
          {!speech.supported && <p className="text-xs text-navy-600">Voice works in Chrome. You can still paste or type the details.</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={fill} disabled={busy || text.trim().length < 10} className="h-11 px-5 rounded-btn bg-gold-500 text-navy-900 font-bold inline-flex items-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "Reading…" : "Fill the form"}
        </button>
        <label className="text-sm text-navy-700 flex items-center gap-2">
          Description in
          <select value={writeIn} onChange={(e) => setWriteIn(e.target.value as "en" | "ta")} className="h-9 px-2 border rounded-md bg-white">
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>
        </label>
        {result?.remaining !== null && result?.remaining !== undefined && (
          <span className="text-xs text-navy-600">{result.remaining} left this month</span>
        )}
      </div>

      {result && result.missing.length > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Not mentioned: {result.missing.map((m) => MISSING_LABEL[m] || m).join(", ")}. Add {result.missing.length === 1 ? "it" : "them"} below.
        </p>
      )}
    </section>
  );
}
