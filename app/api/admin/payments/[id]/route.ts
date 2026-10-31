import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { BillingError, decidePaymentRequest } from "@/lib/billing";
import { escapeHtml, sendEmail } from "@/lib/mail";
import { formatINR } from "@/lib/plans";
import { refreshListingCaches } from "@/lib/property-input";
import { UserRole } from "@/types";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse("Invalid decision", { status: 400 });
    const { agent, req: payment, summary } = await decidePaymentRequest(params.id, admin.uid, parsed.data.decision, parsed.data.note);
    refreshListingCaches(agent.slug, payment.propertyId || undefined);

    const approved = parsed.data.decision === "APPROVE";
    sendEmail({
      to: agent.email,
      subject: approved ? "Payment received — thank you" : "We couldn't find your payment",
      html: approved
        ? `<p>Hi ${escapeHtml(agent.displayName)},</p><p>We received ${formatINR(payment.amount)} (UTR ${escapeHtml(payment.utr)}). ${payment.kind === "PLAN" ? "Your plan is active" : "Your listing is now on the DK Promoters website"}: ${escapeHtml(summary)}.</p>`
        : `<p>Hi ${escapeHtml(agent.displayName)},</p><p>We couldn't match UTR ${escapeHtml(payment.utr)} in our bank statement. ${parsed.data.note ? escapeHtml(parsed.data.note) : ""} Please reply to this email or call us.</p>`,
    }).catch(() => {});
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof BillingError) return new NextResponse(error.message, { status: 400 });
    console.error("[ADMIN_PAYMENT_PATCH]", error);
    return new NextResponse("Could not save the decision.", { status: 500 });
  }
}
