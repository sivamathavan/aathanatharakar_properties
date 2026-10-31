import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getPropertyById, privateDetailsRef, writeAudit } from "@/lib/firestore";
import { DOC_ITEMS } from "@/lib/doc-items";
import { UserRole } from "@/types";

const entry = z.object({
  status: z.enum(["PENDING", "RECEIVED", "VERIFIED"]),
  fileUrl: z.string().url().max(1000).optional().nullable(),
  filePath: z.string().max(300).optional().nullable(),
});

const schema = z.object({
  docChecklist: z.partialRecord(z.enum(DOC_ITEMS), entry).optional(),
  sourceName: z.string().trim().max(120).optional(),
  sourcePhone: z.string().trim().max(20).optional(),
});

// Title-document checklist and "who brought this listing" (private details).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
  const property = await getPropertyById(params.id);
  if (!property || property.ownerType !== "ADMIN") return new NextResponse("Not found", { status: 404 });
  const { docChecklist, ...rest } = parsed.data;
  if (docChecklist) {
    for (const [k, v] of Object.entries(docChecklist)) {
      if (v?.filePath && !v.filePath.startsWith(`crm-docs/${params.id}/`)) return new NextResponse(`Bad file for ${k}`, { status: 400 });
    }
  }
  await privateDetailsRef(params.id).set({ ...rest, ...(docChecklist ? { docChecklist } : {}) }, { merge: true });
  await writeAudit(admin.uid, "property.docs", params.id);
  return NextResponse.json({ ok: true });
}
