// Reads a client's name, mobile number and message from text an agent copied
// out of WhatsApp: copied chat messages ("[3/11, 10:15 am] Priya Raman: ..."),
// exported chat lines ("03/11/26, 10:15 am - Priya Raman: ..."), a contact
// ("Priya Raman" and a number) or plain text. Pure, so it runs in the browser.

export type PastedClient = { name: string; phone: string; message: string };

/** Last 10 digits of an Indian mobile number, or "" if it isn't one. Used to spot the same client twice. */
export function phoneKey(raw: string | null | undefined): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}

// [03/11/26, 10:15 am] Name: text  |  03/11/26, 10:15 am - Name: text  |  [10:15 am, 3/11/2026] Name: text
const DATE = String.raw`\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?`;
const TIME = String.raw`\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[ap]\.?\s?m\.?)?`;
const MESSAGE_LINE = new RegExp(String.raw`^\[?\s*(?:${DATE},?\s+${TIME}|${TIME},?\s+${DATE})\s*\]?\s*(?:-\s*)?([^:]{1,60}?):\s?(.*)$`, "i");
const PHONE_LIKE = /(?:\+?\d[\d \t\-()]{8,16}\d)/g; // within one line

function firstPhone(text: string): string {
  for (const m of text.match(PHONE_LIKE) || []) {
    const key = phoneKey(m);
    if (key) return key;
  }
  return "";
}

// Has a letter (English or Tamil) and no run of digits.
const looksLikeName = (s: string) => s.length >= 2 && s.length <= 60 && !/\d{4}/.test(s) && /[A-Za-z\u00C0-\u024F\u0B80-\u0BFF]/.test(s);

/**
 * `exclude`: names whose messages are the agent's own (their WhatsApp name),
 * so the client is the other person in a copied conversation.
 */
export function parseWhatsAppPaste(text: string, exclude: string[] = []): PastedClient {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const mine = exclude.map((n) => n.trim().toLowerCase()).filter(Boolean);
  const isMine = (sender: string) => sender.toLowerCase() === "you" || mine.some((n) => sender.toLowerCase() === n);

  // 1. Copied chat messages: take the first sender who isn't the agent.
  const said: { sender: string; text: string }[] = [];
  for (const line of lines) {
    const m = line.match(MESSAGE_LINE);
    if (m) said.push({ sender: m[1].replace(/^~\s*/, "").trim(), text: m[2].trim() });
    else if (said.length) said[said.length - 1].text += ` ${line}`; // a message that ran onto more lines
  }
  if (said.length) {
    const client = said.find((s) => !isMine(s.sender))?.sender || said[0].sender;
    const theirs = said.filter((s) => s.sender === client).map((s) => s.text).filter(Boolean);
    const senderPhone = phoneKey(client);
    return {
      name: senderPhone ? "" : looksLikeName(client) ? client : "",
      phone: senderPhone || firstPhone(theirs.join(" ")),
      message: theirs.join(" ").slice(0, 2000),
    };
  }

  // 2. A contact or plain text: "Name: …" / "Phone: …" lines, else a short first line next to a number.
  let name = "";
  const rest: string[] = [];
  for (const line of lines) {
    const labelled = line.match(/^(name|பெயர்)\s*[:\-]\s*(.+)$/i);
    if (labelled && !name) name = labelled[2].trim();
    else if (/^(phone|mobile|mob|cell|ph|number|no)\.?\s*[:\-]/i.test(line) || (phoneKey(line) && line.replace(/[\d\s+\-()]/g, "") === "")) continue;
    else rest.push(line);
  }
  const phone = firstPhone(text);
  if (!name && phone && rest.length && looksLikeName(rest[0]) && rest[0].split(/\s+/).length <= 4) name = rest.shift()!;
  const message = rest.join(" ").replace(PHONE_LIKE, (m) => (phoneKey(m) ? "" : m)).replace(/\s{2,}/g, " ").trim();
  return { name, phone, message: message.slice(0, 2000) };
}
