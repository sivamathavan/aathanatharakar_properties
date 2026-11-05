import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { getPropertyById, incrementViewCount } from "@/lib/firestore";
import { recordStat } from "@/lib/stats";

// Lightweight IP rate-limit so refreshes don't inflate counts.
// One increment per IP+property every 30 minutes.
const buckets = new Map<string, number>();
const WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const key = `${clientIp(req)}:${params.id}`;
    const now = Date.now();
    const last = buckets.get(key) || 0;
    if (now - last < WINDOW_MS) {
      return NextResponse.json({ counted: false });
    }
    buckets.set(key, now);
    if (buckets.size > 50000) buckets.clear();

    // Agent listings also count toward the agent's daily stats.
    const property = await getPropertyById(params.id);
    if (!property) return NextResponse.json({ counted: false });
    if (property.ownerType === "AGENT") await recordStat(property.postedById, "view", property.id);
    else await incrementViewCount(params.id);

    return NextResponse.json({ counted: true });
  } catch (error) {
    // Don't bubble — view count is non-critical.
    return NextResponse.json({ counted: false });
  }
}
