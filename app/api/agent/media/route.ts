import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";
import { UserRole } from "@/types";

// Serves the signed-in agent's own photos from this site's address, so the
// poster, visiting card and brochure (drawn on a canvas in the browser) can use
// them without Storage CORS settings. Only the caller's own folders.
export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });

  const src = new URL(req.url).searchParams.get("src") || "";
  const match = src.match(/\/o\/([^?]+)/);
  const path = match ? decodeURIComponent(match[1]) : "";
  const own = [`agents/${user.uid}/`, `properties/${user.uid}/`];
  const allowed = user.role === UserRole.ADMIN ? /^(agents|properties)\/[^/]+\/[^/]+$/.test(path) : own.some((p) => path.startsWith(p)) && !path.includes("..");
  if (!allowed) return new NextResponse("Not found.", { status: 404 });

  try {
    const file = adminStorage.bucket().file(path);
    const [[meta], [data]] = await Promise.all([file.getMetadata(), file.download()]);
    const type = String(meta.contentType || "image/jpeg");
    if (!type.startsWith("image/")) return new NextResponse("Not found.", { status: 404 });
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new NextResponse("Not found.", { status: 404 });
  }
}
