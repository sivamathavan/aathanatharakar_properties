import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { CRM_COLLECTIONS, CRM_SCHEMAS, type CrmCollection } from "@/lib/crm/schemas";
import { crmCol, listCrm, listDealsWithMoney } from "@/lib/crm/store";
import { dealCommission } from "@/lib/crm/commission";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

function collectionOf(name: string): CrmCollection | null {
  return (CRM_COLLECTIONS as string[]).includes(name) ? (name as CrmCollection) : null;
}

export async function GET(req: Request, props: { params: Promise<{ collection: string }> }) {
  const params = await props.params;
  if (!(await requireRole(req, UserRole.ADMIN))) return new NextResponse("Unauthorized", { status: 401 });
  const c = collectionOf(params.collection);
  if (!c) return new NextResponse("Not found", { status: 404 });
  const data = c === "deals" ? await listDealsWithMoney() : await listCrm(c, c === "activity" ? 200 : 3000);
  return NextResponse.json({ data });
}

export async function POST(req: Request, props: { params: Promise<{ collection: string }> }) {
  const params = await props.params;
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const c = collectionOf(params.collection);
  if (!c) return new NextResponse("Not found", { status: 404 });
  const parsed = CRM_SCHEMAS[c].safeParse(await req.json());
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });

  const now = new Date();
  const row: Record<string, unknown> = { ...parsed.data, created_by: admin.uid, created_at: now, updated_at: now, deleted_at: null };
  if (c === "deals") row.commission_amount = dealCommission(parsed.data as any).total;
  const ref = await crmCol(c).add(row);
  return NextResponse.json({ data: { ...row, id: ref.id, created_at: now.toISOString(), updated_at: now.toISOString(), commission_received: 0 } }, { status: 201 });
}
