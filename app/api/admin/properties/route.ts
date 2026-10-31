import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { docToTyped, propertiesCol, usersCol } from "@/lib/firestore";
import { PropertyDoc, UserDoc, UserRole } from "@/types";

export const dynamic = "force-dynamic";

// Every listing on the platform, newest first, with the owner's name.
export async function GET(req: Request) {
  if (!(await requireRole(req, UserRole.ADMIN))) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const snap = await propertiesCol().orderBy("createdAt", "desc").limit(1000).get();
    const properties = snap.docs.map((d) => docToTyped<PropertyDoc>(d)!);
    const ownerIds = Array.from(new Set(properties.map((p) => p.postedById).filter(Boolean)));
    const owners = ownerIds.length ? await adminDb.getAll(...ownerIds.map((id) => usersCol().doc(id))) : [];
    const byId = new Map(owners.map((o) => [o.id, docToTyped<UserDoc>(o)]));
    return NextResponse.json(
      properties.map((p) => ({ ...p, media: p.media || [], postedBy: byId.get(p.postedById) || null }))
    );
  } catch (error) {
    console.error("[ADMIN_PROPERTIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
