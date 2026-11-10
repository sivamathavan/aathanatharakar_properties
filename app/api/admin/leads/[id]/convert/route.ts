import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getLeadById, getPropertyById, updateLead } from "@/lib/firestore";
import { crmCol } from "@/lib/crm/store";
import { TYPE_LABEL } from "@/lib/crm/properties";
import { LeadStatus, UserRole } from "@/types";

// Website enquiry → tracker deal, carrying the buyer and the property across.
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const lead = await getLeadById(params.id);
  if (!lead || lead.ownerType !== "ADMIN") return new NextResponse("Enquiry not found", { status: 404 });

  const existing = await crmCol("deals").where("lead_id", "==", lead.id).limit(1).get();
  if (!existing.empty) return NextResponse.json({ id: existing.docs[0].id, existed: true });

  const property = lead.propertyId ? await getPropertyById(lead.propertyId) : null;
  const now = new Date();
  const ref = await crmCol("deals").add({
    title: `${lead.name} — ${property?.title || lead.propertyTitle || "Website enquiry"}`.slice(0, 200),
    deal_type: "Both Side Broker",
    status: "New Lead",
    property_type: property ? TYPE_LABEL[property.type] || "" : "",
    district: property?.district || property?.city || "",
    area: property?.locality || "",
    property_value: property?.price || 0,
    seller_name: "",
    seller_mobile: "",
    buyer_name: lead.name,
    buyer_mobile: lead.phone,
    seller_broker_id: "",
    buyer_broker_id: "",
    commission_rate_seller: 0,
    commission_rate_buyer: 0,
    commission_amount: 0,
    token_amount: 0,
    follow_up_date: "",
    notes: lead.message || "",
    documents: [],
    property_id: lead.propertyId || "",
    lead_id: lead.id,
    created_by: admin.uid,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
  if (lead.status === LeadStatus.NEW) await updateLead(lead.id, { status: LeadStatus.CONTACTED });
  return NextResponse.json({ id: ref.id, existed: false }, { status: 201 });
}
