// Lists every English string passed to t("...") on agent screens, plus the
// labels that reach t() through lookup tables. Used by tests/unit/i18n.test.ts
// and handy when adding Tamil lines: `npx tsx scripts/i18n-keys.ts --missing`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const AGENT_SOURCES = [
  "app/(dashboard)/dashboard",
  "components/dashboard",
  "components/i18n",
  "components/support/ErrorPanel.tsx",
  "components/property/PropertyForm.tsx",
  "components/ui/FirebaseUpload.tsx",
  "lib/reminders.ts",
];

function files(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((f) => files(join(path, f))).filter((f) => /\.(tsx?|ts)$/.test(f));
}

/** String literals in the first argument of every t(...) call. */
export function keysIn(source: string): string[] {
  const out: string[] = [];
  const re = /(?<![\w.])t\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    let i = m.index + 2, depth = 1, arg = "";
    let quote: string | null = null;
    for (; i < source.length && depth > 0; i++) {
      const c = source[i];
      if (quote) {
        if (c === "\\") { arg += c + source[++i]; continue; }
        if (c === quote) quote = null;
        arg += c;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { quote = c; arg += c; continue; }
      if (c === "(" || c === "{" || c === "[") depth++;
      if (c === ")" || c === "}" || c === "]") depth--;
      if (depth === 1 && c === ",") break;
      if (depth > 0) arg += c;
    }
    // Skip strings that are only compared (kind === "logo"), not shown.
    // Lookup keys (TABLE[x || ""]) are not shown text.
    arg = arg.replace(/\[[^\]]*\]/g, "");
    for (const s of Array.from(arg.matchAll(/([=!]==\s*)?"((?:[^"\\]|\\.)*)"/g))) if (!s[1]) out.push(JSON.parse(`"${s[2]}"`));
  }
  return out;
}

/** Labels that reach t() through lookup tables rather than as literals. */
export const DYNAMIC_KEYS = [
  // dashboard menu (components/dashboard/AgentNav.tsx)
  "Overview", "My properties", "Add property", "Enquiries", "Buyers", "Stats", "Share my page", "Profile & branding", "Plan & billing", "Account & data", "Listings", "Add",
  // enquiry statuses, sources, filters and quick follow-ups (LeadsInbox)
  "New", "Contacted", "Site visit", "Negotiation", "Closed", "Lost", "All", "Today", "Tomorrow", "In 3 days", "Next week",
  "Website", "Your page", "Phone / walk-in", "WhatsApp", "Referral", "Added by you",
  // property types and sale/rent (PropertyForm, BuyersBoard)
  "Apartment", "Villa", "House", "Plot", "Commercial", "Warehouse", "Farm land", "PG / hostel", "Sale", "Sale (owner)", "Rent", "Lease",
  // listing statuses (ListingsTable), buyer match labels (lib/match.ts)
  "Live", "Hidden", "Sold", "Rented", "Great match", "Good match", "Partial match",
  // payment statuses (billing page), error page link
  "Being checked", "Approved", "Not found — please contact us", "Go to overview",
  // title documents (lib/doc-items.ts)
  "Patta", "Chitta", "FMB Sketch", "EC (Encumbrance)", "Sale Deed", "Parent Document", "Tax Receipt", "Survey Sketch", "Aadhaar / ID Proof", "DTCP / CMDA Approval", "Building Plan",
];

export function collectKeys(root = process.cwd()): string[] {
  const keys = new Set<string>(DYNAMIC_KEYS);
  for (const src of AGENT_SOURCES) for (const f of files(join(root, src))) keysIn(readFileSync(f, "utf8")).forEach((k) => keys.add(k));
  return Array.from(keys).sort();
}

if (process.argv[1]?.endsWith("i18n-keys.ts")) {
  const keys = collectKeys();
  if (process.argv.includes("--missing")) {
    import("../lib/i18n/ta").then(({ TA }) => {
      const missing = keys.filter((k) => !(k in TA));
      console.log(JSON.stringify(missing, null, 1));
      console.error(`${missing.length} of ${keys.length} missing`);
    });
  } else console.log(JSON.stringify(keys, null, 1));
}
