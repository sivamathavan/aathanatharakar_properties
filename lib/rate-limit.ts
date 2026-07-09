import { prisma } from "@/lib/prisma";

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  
  // Periodically clean up expired records (1% chance)
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: now } }
    }).catch(() => {});
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let bucket = await tx.rateLimit.findUnique({ where: { key } });

      if (!bucket || bucket.resetAt < now) {
        bucket = await tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        });
        return false;
      }

      bucket = await tx.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return bucket.count > limit;
    });
    
    return result;
  } catch (err) {
    console.error("[RATE_LIMIT_ERROR]", err);
    // Fallback: If DB errors on rate limit logic, fail open to avoid blocking valid users
    return false;
  }
}
