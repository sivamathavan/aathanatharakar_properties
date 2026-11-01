import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentById, getPropertyById } from "@/lib/firestore";
import { recordStat } from "@/lib/stats";

// Counts taps on an agent's public page (WhatsApp, call, share, page opened).
// One count per IP + target + kind every 30 minutes, kept in memory like the
// listing view counter; good enough for stats, never blocks the visitor.
const seen = new Map<string, number>();
const WINDOW_MS = 30 * 60 * 1000;

const schema = z.object({
  kind: z.enum(["wa", "call", "share", "page"]),
  agentId: z.string().min(1).max(128),
  propertyId: z.string().max(128).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(JSON.parse(await req.text()));
    if (!parsed.success) return NextResponse.json({ counted: false });
    const { kind, agentId, propertyId } = parsed.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}:${kind}:${agentId}:${propertyId || ""}`;
    const now = Date.now();
    if (now - (seen.get(key) || 0) < WINDOW_MS) return NextResponse.json({ counted: false });
    seen.set(key, now);
    if (seen.size > 50000) seen.clear();

    // Only real agents and their own listings get counters.
    if (propertyId) {
      const property = await getPropertyById(propertyId);
      if (!property || property.postedById !== agentId || property.ownerType !== "AGENT") return NextResponse.json({ counted: false });
    } else if (!(await getAgentById(agentId))) {
      return NextResponse.json({ counted: false });
    }
    await recordStat(agentId, kind, propertyId);
    return NextResponse.json({ counted: true });
  } catch {
    return NextResponse.json({ counted: false });
  }
}
