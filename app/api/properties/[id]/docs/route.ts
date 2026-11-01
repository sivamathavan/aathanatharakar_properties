import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";
import { getPropertyById, getPropertyPrivate, privateDetailsRef } from "@/lib/firestore";
import { DOC_ITEMS } from "@/lib/doc-items";

const item = z.object({
  status: z.enum(["PENDING", "RECEIVED", "VERIFIED"]),
  fileUrl: z.string().url().max(2000).nullable().optional(),
  filePath: z.string().max(400).nullable().optional(),
});
const schema = z.object({ items: z.partialRecord(z.enum(DOC_ITEMS), item) });

// Title-document checklist (Patta, Chitta, EC…) on the owner's own listing.
// Kept in the listing's private details; files live in agent-docs/{uid}/{listing}/.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  const property = await getPropertyById(params.id);
  if (!property || property.postedById !== user.uid) return new NextResponse("Listing not found.", { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
  const folder = `agent-docs/${user.uid}/${params.id}/`;
  const items = parsed.data.items;
  for (const v of Object.values(items)) {
    if (v?.filePath && (!v.filePath.startsWith(folder) || v.filePath.includes(".."))) return new NextResponse("Upload documents from this page only.", { status: 400 });
    if (v?.fileUrl && !v.filePath) return new NextResponse("Upload documents from this page only.", { status: 400 });
  }

  // Files that were replaced or removed are deleted from Storage.
  const before = (await getPropertyPrivate(params.id)).docChecklist || {};
  const bucket = adminStorage.bucket();
  await Promise.all(
    Object.entries(before)
      .filter(([k, v]) => v?.filePath && v.filePath !== (items as any)[k]?.filePath && v.filePath.startsWith(folder))
      .map(([, v]) => bucket.file(v.filePath!).delete().catch(() => {}))
  );

  const docChecklist = Object.fromEntries(
    Object.entries(items).map(([k, v]) => [k, { status: v!.status, fileUrl: v!.fileUrl || null, filePath: v!.filePath || null }])
  );
  // mergeFields replaces the whole checklist, so a cleared item really goes away.
  await privateDetailsRef(params.id).set({ docChecklist }, { mergeFields: ["docChecklist"] });
  return NextResponse.json({ docChecklist });
}
