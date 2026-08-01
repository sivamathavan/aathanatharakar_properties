import { getRateLimit, upsertRateLimit, incrementRateLimit } from "@/lib/firestore";

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  
  try {
    let bucket = await getRateLimit(key);

    if (!bucket || new Date(bucket.resetAt) < now) {
      const resetAt = new Date(now.getTime() + windowMs);
      await upsertRateLimit(key, 1, resetAt);
      return false;
    }

    const resetAt = new Date(bucket.resetAt);
    await incrementRateLimit(key, resetAt);

    // Fetch the updated count to evaluate limit
    const updated = await getRateLimit(key);
    return (updated?.count || 1) > limit;
  } catch (err) {
    console.error("[RATE_LIMIT_ERROR]", err);
    // Fail open to avoid blocking legitimate users on DB network failure
    return false;
  }
}
