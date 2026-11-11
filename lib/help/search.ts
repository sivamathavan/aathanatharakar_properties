// Finds help topics for a typed question, in the browser. No AI and no network:
// what an agent types stays on their phone unless they choose to send it to us.
import type { HelpTopic } from "@/lib/help/topics";

const STOP = new Set([
  "a", "an", "the", "i", "im", "i'm", "me", "my", "we", "you", "your", "it", "its", "is", "are", "was", "be", "am",
  "do", "does", "did", "can", "could", "will", "would", "should", "how", "what", "why", "when", "where", "which", "who",
  "to", "of", "in", "on", "for", "at", "by", "with", "from", "and", "or", "so", "if", "this", "that", "there", "please",
  "pls", "plz", "sir", "madam", "hi", "hello", "help", "want", "need", "get", "got", "have", "has", "any", "some",
  "enna", "eppadi", "epdi", "pannanum", "panna", "pannradhu", "venum", "ennaku", "enakku", "naan", "en", "unga",
]);

/** Lower-case words; keeps Tamil letters, drops punctuation. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[“”"'’‘`]/g, "")
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

const meaningful = (ws: string[]) => ws.filter((w) => !STOP.has(w));

/** "uploading" ~ "upload", "photos" ~ "photo": shared start of 4+ letters. */
function close(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return a.startsWith(b) || b.startsWith(a);
}

export function scoreTopic(query: string, topic: HelpTopic): number {
  const q = meaningful(words(query));
  if (!q.length) return 0;
  const phrase = ` ${words(query).join(" ")} `;
  let score = 0;
  for (const kw of topic.keywords) {
    const kws = words(kw);
    if (kws.length > 1) {
      if (phrase.includes(` ${kws.join(" ")} `)) score += 4;
    } else if (q.some((w) => close(w, kws[0]))) {
      score += 3;
    }
  }
  const qWords = new Set(meaningful(words(topic.q)));
  for (const w of q) if (Array.from(qWords).some((x) => close(w, x))) score += 1;
  return score;
}

/** Best matches first; empty when nothing fits well enough to answer. */
export function findTopics(query: string, topics: HelpTopic[], min = 3): HelpTopic[] {
  return topics
    .map((topic, i) => ({ topic, i, score: scoreTopic(query, topic) }))
    .filter((r) => r.score >= min)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.topic);
}
