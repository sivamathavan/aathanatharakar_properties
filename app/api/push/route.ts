import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { removePushToken, savePushToken } from "@/lib/push";

// A phone turning "new enquiry" alerts on (POST) or off (DELETE) for the signed-in
// agent or admin. The token comes from Firebase Cloud Messaging in the browser.
const schema = z.object({ token: z.string().trim().min(20).max(4096) });

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  if (await checkRateLimit(`push:${user.uid}`, 30, 24 * 60 * 60 * 1000)) {
    return new NextResponse("Too many tries today. Try again tomorrow.", { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse("Invalid request.", { status: 400 });
  await savePushToken(user.uid, parsed.data.token, req.headers.get("user-agent") || "");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse("Invalid request.", { status: 400 });
  await removePushToken(user.uid, parsed.data.token);
  return NextResponse.json({ ok: true });
}
