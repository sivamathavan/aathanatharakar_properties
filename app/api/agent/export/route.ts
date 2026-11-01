import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { exportAgentData } from "@/lib/account";
import { checkRateLimit } from "@/lib/rate-limit";
import { UserRole } from "@/types";

// "Download my data": one JSON file with everything stored about the agent.
export async function GET(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  if (await checkRateLimit(`export:${user.uid}`, 10, 60 * 60 * 1000)) {
    return new NextResponse("Too many downloads. Try again in an hour.", { status: 429 });
  }
  const data = await exportAgentData(user.uid);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
