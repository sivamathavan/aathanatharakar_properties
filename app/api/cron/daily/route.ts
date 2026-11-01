import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runDailyReminders } from "@/lib/reminders";

// Called once a day by Cloud Scheduler with the header
//   Authorization: Bearer <CRON_SECRET>
// ?dry=1 reports what would be sent without sending anything.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (secret.length < 16 || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function handle(req: Request) {
  if (!process.env.CRON_SECRET) return new NextResponse("CRON_SECRET is not set.", { status: 503 });
  if (!authorized(req)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const dry = new URL(req.url).searchParams.get("dry") === "1";
    const summary = await runDailyReminders({ send: !dry });
    return NextResponse.json({ ok: true, dry, ...summary });
  } catch (error) {
    console.error("[CRON_DAILY]", error);
    return new NextResponse("Reminder run failed.", { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
