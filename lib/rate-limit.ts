import { adminDb } from "@/lib/firebase-admin";
import { rateLimitsCol } from "@/lib/firestore";

function safeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9:._@-]/g, "_").slice(0, 300);
}

/**
 * Returns true when `key` has gone over `limit` hits inside `windowMs`.
 * Stored in Firestore so the limit holds across server instances.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const ref = rateLimitsCol().doc(safeKey(key));
  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const data = snap.data();
      const resetAt = data?.resetAt?.toDate ? data.resetAt.toDate().getTime() : 0;
      if (!snap.exists || resetAt < now) {
        tx.set(ref, { key, count: 1, resetAt: new Date(now + windowMs) });
        return false;
      }
      const count = (data?.count || 0) + 1;
      tx.update(ref, { count });
      return count > limit;
    });
  } catch (err) {
    console.error("[RATE_LIMIT_ERROR]", err);
    // Fail open so a Firestore hiccup never blocks a genuine enquiry.
    return false;
  }
}
