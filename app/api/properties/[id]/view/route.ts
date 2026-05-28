import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight IP rate-limit so refreshes don't inflate counts.
// One increment per IP+property every 30 minutes.
const buckets = new Map<string, number>();
const WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const key = `${ip}:${params.id}`;
    const now = Date.now();
    const last = buckets.get(key) || 0;
    if (now - last < WINDOW_MS) {
      return NextResponse.json({ counted: false });
    }
    buckets.set(key, now);

    await prisma.property.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ counted: true });
  } catch (error) {
    // Don't bubble — view count is non-critical.
    return NextResponse.json({ counted: false });
  }
}
