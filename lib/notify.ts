// Popup messages (toasts), the same everywhere.
//
// Wording:
//   success  says what happened, past tense, ends with a full stop: "Listing deleted."
//   error    "Could not <verb>." plus what to do next when there is something to do:
//            "Could not save. Check your connection and try again."
//   never    "!", "successfully", "Failed to…", "An error occurred", raw server output.
// Errors stay on screen longer than successes; every toast has a close button.
// For "are you sure?" moments use <ConfirmDialog> (components/ui/confirm-dialog.tsx).
import { toast as sonner, type ExternalToast } from "sonner";

export const ERROR_MS = 6000;

export const toast = {
  success: (message: string, opts?: ExternalToast) => sonner.success(message, opts),
  error: (message: string, opts?: ExternalToast) => sonner.error(message, { duration: ERROR_MS, ...opts }),
  info: (message: string, opts?: ExternalToast) => sonner.info(message, opts),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};

/** Longest server message worth showing; anything longer is a stack trace or a page. */
const MAX_LEN = 240;

function usable(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const s = text.trim();
  if (!s || s.length > MAX_LEN || /^[<{[]/.test(s)) return null;
  return s;
}

/**
 * The message to show for a failed request: the server's own short sentence
 * ("Too many enquiries. Please try again in a few minutes.") when it sent one,
 * otherwise `fallback`. An HTML error page or a JSON blob never reaches the toast.
 */
export async function errorText(res: Response, fallback: string): Promise<string> {
  const type = res.headers.get("content-type") || "";
  const body = await res.text().catch(() => "");
  if (type.includes("json")) {
    try {
      const data = JSON.parse(body);
      return usable(data?.error) || usable(data?.message) || fallback;
    } catch {
      return fallback;
    }
  }
  if (type && !type.startsWith("text/plain")) return fallback;
  return usable(body) || fallback;
}
