import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { CRM_COLLECTIONS, CRM_SCHEMAS, type CrmCollection } from "@/lib/crm/schemas";
import { crmCol } from "@/lib/crm/store";
import { dealCommission } from "@/lib/crm/commission";
import { UserRole } from "@/types";

function collectionOf(name: string): CrmCollection | null {
  return (CRM_COLLECTIONS as string[]).includes(name) && name !== "activity" ? (name as CrmCollection) : null;
}

// Partial updates are allowed (e.g. pin a person, change a deal's stage).
export async function PUT(req: Request, { params }: { params: { collection: string; id: string } }) {
  if (!(await requireRole(req, UserRole.ADMIN))) return new NextResponse("Unauthorized", { status: 401 });
  const c = collectionOf(params.collection);
  if (!c) return new NextResponse("Not found", { status: 404 });
  const ref = crmCol(c).doc(params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.deleted_at) return new NextResponse("Not found", { status: 404 });

  const body = await req.json();
  const merged = { ...snap.data(), ...body };
  const parsed = CRM_SCHEMAS[c].safeParse(merged);
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date() };
  if (c === "deals") update.commission_amount = dealCommission(parsed.data as any).total;
  await ref.update(update);
  return NextResponse.json({ data: { id: params.id, ...update } });
}

// Soft delete, like the tracker: rows disappear from lists but stay recoverable.
export async function DELETE(req: Request, { params }: { params: { collection: string; id: string } }) {
  if (!(await requireRole(req, UserRole.ADMIN))) return new NextResponse("Unauthorized", { status: 401 });
  const c = collectionOf(params.collection);
  if (!c) return new NextResponse("Not found", { status: 404 });
  await crmCol(c).doc(params.id).update({ deleted_at: new Date() }).catch(() => {});
  return NextResponse.json({ ok: true });
}
