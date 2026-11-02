// Compares Claude models on "speak or paste your listing" using the real
// product call (lib/ai/listing-draft.ts) and the cases in listing-drafts.cases.ts.
// Spends real API money (about $1 for Opus + Haiku on all 20 cases; Gemini's free tier costs nothing).
//
//   ANTHROPIC_API_KEY and/or GEMINI_API_KEY in .env.eval.local (git-ignored), then:
//   npm run eval:drafts                                   # Opus 5.5 vs Haiku 5.5
//   npm run eval:drafts -- --models gemini-3.8-flash,gemini-3.5-flash-lite
//   npm run eval:drafts -- --models claude-haiku-5-5 --repeat 3
//
// Writes a report to tests/eval/results/ (git-ignored) and prints a summary.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fakeDraft, normalizeDraft, type NormalizedDraft } from "../../lib/ai/listing-draft";
import { draftListing } from "../../lib/ai/draft";
import { CASES, type DraftCase, type ExpectedArea } from "./listing-drafts.cases";

// $ per million tokens (input, output), from the Claude API price list.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  // Gemini paid-tier prices (the free tier costs nothing). 3.8 Flash doubles from 1 Jan 2027.
  "gemini-3.8-flash": [0.75, 3.75],
  "gemini-3.6-flash": [0.75, 3.75],
  "gemini-3.5-flash-lite": [0.3, 2.5],
};
const INR_PER_USD = Number(process.env.INR_PER_USD || 88);

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}
const MODELS = process.argv.includes("--dry") ? ["stand-in"] : arg("models", "claude-opus-5-5,claude-haiku-5-5").split(",");
const REPEAT = Number(arg("repeat", "1"));
const ONLY = arg("only", "");
// --dry scores the emulator stand-in (fakeDraft) instead of calling the API: free, checks the harness.
const DRY = process.argv.includes("--dry");

if (existsSync(".env.eval.local")) {
  for (const line of readFileSync(".env.eval.local", "utf8").split("\n")) {
    const m = line.match(/^\s*(ANTHROPIC_API_KEY|GEMINI_API_KEY)\s*=\s*"?([^"\s]+)"?/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const isGemini = (model: string) => model.startsWith("gemini-");
for (const [needed, key] of [[MODELS.some((m) => !isGemini(m)), "ANTHROPIC_API_KEY"], [MODELS.some(isGemini), "GEMINI_API_KEY"]] as const) {
  if (!DRY && needed && !process.env[key]) {
    console.error(`No ${key}. Put ${key}=... in .env.eval.local (git-ignored) and run again.`);
    process.exit(2);
  }
}
// The eval always calls the real API, never the emulator stand-in.
delete process.env.LISTING_AI_FAKE;

// ─── Scoring ─────────────────────────────────────────────────────────────────

const flat = (s: string) => s.toLowerCase().replace(/[\s.,]/g, "");
const anyOf = <T,>(v: T | T[]) => (Array.isArray(v) ? v : [v]);

interface Check {
  field: string;
  ok: boolean;
  got: string;
  want: string;
}

function score(c: DraftCase, { values }: NormalizedDraft): Check[] {
  const e = c.expect;
  const checks: Check[] = [];
  const add = (field: string, ok: boolean, got: unknown, want: unknown) => checks.push({ field, ok, got: String(got ?? ""), want: String(want ?? "(empty)") });
  const orNull = (s: string) => (s === "" ? null : s);

  add("type", anyOf(e.type).includes(orNull(values.type)), values.type, anyOf(e.type).join(" | "));
  add("listingType", anyOf(e.listingType).includes(orNull(values.listingType)), values.listingType, anyOf(e.listingType).join(" | "));
  const price = values.price === "" ? null : Number(values.price);
  add("price", price === e.price, values.price, e.price);
  if (e.price !== null && e.priceUnit) add("priceUnit", values.priceUnit === e.priceUnit, values.priceUnit, e.priceUnit);
  if (e.area !== undefined) {
    const got = values.area === "" ? null : { area: Number(values.area), unit: values.areaUnit };
    const ok = e.area === null ? got === null : anyOf(e.area as ExpectedArea | ExpectedArea[]).some((a) => got !== null && got.area === a.area && got.unit === a.unit);
    add("area", ok, got ? `${got.area} ${got.unit}` : "", e.area === null ? null : anyOf(e.area as ExpectedArea).map((a) => `${a.area} ${a.unit}`).join(" | "));
  }
  if (e.bedrooms !== undefined) add("bedrooms", (values.bedrooms === "" ? null : Number(values.bedrooms)) === e.bedrooms, values.bedrooms, e.bedrooms);
  if (e.bathrooms !== undefined) add("bathrooms", (values.bathrooms === "" ? null : Number(values.bathrooms)) === e.bathrooms, values.bathrooms, e.bathrooms);
  add("city", anyOf(e.city).includes(orNull(values.city)), values.city, anyOf(e.city).map((x) => x ?? "(empty)").join(" | "));
  if (e.locality) add("locality", e.locality.some((l) => flat(values.locality).includes(flat(l)) || flat(l).includes(flat(values.locality) || "\u0000")), values.locality, e.locality.join(" | "));
  if (e.ownerName !== undefined) add("ownerName", e.ownerName === null ? values.ownerName === "" : flat(values.ownerName).includes(flat(e.ownerName)), values.ownerName, e.ownerName);
  if (e.ownerPhone !== undefined) add("ownerPhone", e.ownerPhone === null ? values.ownerPhone === "" : values.ownerPhone.replace(/\D/g, "").endsWith(e.ownerPhone), values.ownerPhone, e.ownerPhone);
  if (e.surveyNumber) add("surveyNumber", values.surveyNumber.includes(e.surveyNumber), values.surveyNumber, e.surveyNumber);

  // Privacy: the owner's name and number never reach what buyers see.
  const publicText = `${values.title} ${values.description} ${values.address}`;
  const leaks = [
    e.ownerPhone && publicText.replace(/\D/g, "").includes(e.ownerPhone.slice(-6)) ? "phone" : "",
    e.ownerName && flat(publicText).includes(flat(e.ownerName)) ? "name" : "",
    e.surveyNumber && publicText.includes(e.surveyNumber) ? "survey number" : "",
  ].filter(Boolean);
  if (e.ownerName || e.ownerPhone || e.surveyNumber) add("privacy", leaks.length === 0, leaks.join("+") || "clean", "clean");
  // Description in the language asked for; title in English.
  const tamil = /[஀-௿]/.test(values.description);
  add("descLanguage", c.writeIn === "ta" ? tamil : !tamil, tamil ? "Tamil" : "English", c.writeIn === "ta" ? "Tamil" : "English");
  add("title", values.title.length > 5 && !/[஀-௿]/.test(values.title), values.title, "English title");
  return checks;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

interface Run {
  model: string;
  caseId: string;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  checks: Check[];
  values?: NormalizedDraft["values"];
  error?: string;
}

async function runOne(model: string, c: DraftCase): Promise<Run> {
  // Same switch the app uses (lib/ai/draft.ts).
  process.env.LISTING_AI_PROVIDER = isGemini(model) ? "gemini" : "claude";
  if (isGemini(model)) process.env.LISTING_AI_GEMINI_MODEL = model;
  else process.env.LISTING_AI_MODEL = model;
  const t0 = Date.now();
  try {
    const { draft, usage } = DRY ? { draft: fakeDraft(c.text), usage: { inputTokens: 0, outputTokens: 0 } } : await draftListing(c.text, c.writeIn);
    const [pin, pout] = PRICES[model] || [0, 0];
    const norm = normalizeDraft(draft);
    return {
      model, caseId: c.id, ms: Date.now() - t0, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
      usd: (usage.inputTokens * pin + usage.outputTokens * pout) / 1e6, checks: score(c, norm), values: norm.values,
    };
  } catch (err: any) {
    return { model, caseId: c.id, ms: Date.now() - t0, inputTokens: 0, outputTokens: 0, usd: 0, checks: [{ field: "call", ok: false, got: err?.message || String(err), want: "a draft" }], error: err?.message };
  }
}

async function main() {
  const cases = CASES.filter((c) => !ONLY || c.id === ONLY);
  const runs: Run[] = [];
  for (const model of MODELS) {
    for (let r = 0; r < REPEAT; r++) {
      // One model at a time (process.env.LISTING_AI_MODEL is shared). Claude: 4 cases in
      // parallel. Gemini's free tier allows few requests a minute: one every 5 s
      // (--gap to change), and a rate-limited case is retried once after a minute.
      const gemini = isGemini(model) && !DRY;
      const size = gemini ? 1 : 4;
      const gap = Number(arg("gap", gemini ? "5000" : "0"));
      for (let i = 0; i < cases.length; i += size) {
        const batch = await Promise.all(cases.slice(i, i + size).map((c) => runOne(model, c)));
        for (let k = 0; k < batch.length; k++) {
          if (gemini && batch[k].error?.startsWith("Too many requests")) {
            await new Promise((res) => setTimeout(res, 60000));
            batch[k] = await runOne(model, cases[i + k]);
          }
        }
        runs.push(...batch);
        process.stdout.write(".");
        if (gap) await new Promise((res) => setTimeout(res, gap));
      }
    }
  }
  console.log("\n");

  const lines: string[] = [`# Listing draft eval — ${new Date().toISOString()}`, "", `Cases: ${cases.length} × ${REPEAT} run(s). ₹ at ${INR_PER_USD}/$.`, ""];
  lines.push("| Model | Fields right | Listings fully right | Avg time | Avg tokens in/out | Cost per draft |", "|---|---|---|---|---|---|");
  for (const model of MODELS) {
    const mine = runs.filter((r) => r.model === model);
    const checks = mine.flatMap((r) => r.checks);
    const ok = checks.filter((c) => c.ok).length;
    const full = mine.filter((r) => r.checks.every((c) => c.ok)).length;
    const avg = (f: (r: Run) => number) => mine.reduce((s, r) => s + f(r), 0) / Math.max(1, mine.length);
    const usd = avg((r) => r.usd);
    lines.push(`| ${model} | ${ok}/${checks.length} (${Math.round((ok / checks.length) * 100)}%) | ${full}/${mine.length} | ${(avg((r) => r.ms) / 1000).toFixed(1)} s | ${Math.round(avg((r) => r.inputTokens))} / ${Math.round(avg((r) => r.outputTokens))} | $${usd.toFixed(4)} (₹${(usd * INR_PER_USD).toFixed(2)}) |`);
  }
  lines.push("", "## Mistakes", "");
  for (const r of runs) for (const c of r.checks.filter((x) => !x.ok)) lines.push(`- **${r.model}** · ${r.caseId} · ${c.field}: got \`${c.got}\`, want \`${c.want}\``);
  lines.push("", "## Titles and descriptions (read these for quality)", "");
  for (const c of cases) {
    lines.push(`### ${c.id}`, "", `> ${c.text.replace(/\n/g, " ")}`, "");
    for (const model of MODELS) {
      const r = runs.find((x) => x.model === model && x.caseId === c.id);
      lines.push(`- **${model}**: ${r?.values ? `*${r.values.title}* — ${r.values.description}` : `error: ${r?.error}`}`);
    }
    lines.push("");
  }

  mkdirSync("tests/eval/results", { recursive: true });
  const file = `tests/eval/results/listing-drafts-${Date.now()}.md`;
  writeFileSync(file, lines.join("\n"));
  writeFileSync(file.replace(/\.md$/, ".json"), JSON.stringify(runs, null, 2));
  console.log(lines.slice(0, 6 + MODELS.length).join("\n"));
  const mistakes = lines.indexOf("## Mistakes");
  console.log(lines.slice(mistakes, lines.indexOf("## Titles and descriptions (read these for quality)")).join("\n"));
  console.log(`Full report: ${file}`);
}

main();
