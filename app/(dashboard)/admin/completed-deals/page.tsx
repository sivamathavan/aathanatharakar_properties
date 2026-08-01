import { redirect } from "next/navigation";
import { CheckCircle2, Building, Calendar } from "lucide-react";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { leadsCol, getPropertyById, getLeadNotes, commissionsCol } from "@/lib/firestore";
import { UserRole, LeadStatus, CommissionStatus } from "@/types";

export const metadata = {
  title: "Completed Deals | DK Promoters Admin",
};

export const dynamic = "force-dynamic";

export default async function CompletedDealsPage() {
  const session = await getServerUser();
  if (!session || session.role !== UserRole.ADMIN) redirect("/admin/login");

  const closedLeadsSnap = await leadsCol()
    .where("status", "==", LeadStatus.CLOSED)
    .get();

  const leadsList = closedLeadsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      message: data.message,
      status: data.status,
      propertyId: data.propertyId,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  });

  // Sort by updatedAt desc in-memory
  leadsList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Enrich leads and fetch commissions
  const dealIds = leadsList.map((d) => d.id);

  const [completedDeals, commissionsSnap] = await Promise.all([
    Promise.all(
      leadsList.map(async (deal) => {
        const [property, notes] = await Promise.all([
          deal.propertyId ? getPropertyById(deal.propertyId) : null,
          getLeadNotes(deal.id),
        ]);
        return {
          ...deal,
          property: property ? { title: property.title, city: property.city, locality: property.locality, type: property.type, listingType: property.listingType } : null,
          notes: notes.slice(0, 1),
        };
      })
    ),
    commissionsCol().get(),
  ]);

  // Filter commissions for completed deals in-memory
  const commissions = commissionsSnap.docs
    .filter((doc) => doc.data().leadId && dealIds.includes(doc.data().leadId))
    .map((doc) => {
      const data = doc.data();
      return {
        leadId: data.leadId,
        amount: data.amount,
        status: data.status,
        type: data.type,
      };
    });

  const commissionMap = Object.fromEntries(commissions.map((c) => [c.leadId, c]));

  const totalEarned = commissions
    .filter((c) => c.status === CommissionStatus.RECEIVED)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalExpected = commissions
    .filter((c) => c.status === CommissionStatus.EXPECTED)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Header */}
      <div className="border-b border-[#E8E0D0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Completed Deals
          </h1>
          <p className="text-xs text-navy-700 mt-0.5">
            All closed deals — {completedDeals.length} total
          </p>
        </div>

        {/* Revenue Summary */}
        <div className="flex gap-3">
          <div className="text-center bg-green-50 border border-green-200 rounded-card px-4 py-2">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Received</p>
            <p className="text-base font-display font-bold text-green-800">
              ₹{totalEarned >= 100000
                ? `${(totalEarned / 100000).toFixed(1)}L`
                : totalEarned.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-center bg-amber-50 border border-amber-200 rounded-card px-4 py-2">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Expected</p>
            <p className="text-base font-display font-bold text-amber-800">
              ₹{totalExpected >= 100000
                ? `${(totalExpected / 100000).toFixed(1)}L`
                : totalExpected.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {completedDeals.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E8E0D0] rounded-card">
          <CheckCircle2 className="w-12 h-12 text-navy-200 mx-auto mb-3" />
          <p className="font-semibold text-navy-700">No completed deals yet</p>
          <p className="text-xs text-navy-500 mt-1">
            Mark a deal as &quot;Closed&quot; from the{" "}
            <Link href="/admin/leads" className="text-gold-600 underline font-bold">Active Deals</Link> page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedDeals.map((deal) => {
            const commission = commissionMap[deal.id];
            return (
              <div
                key={deal.id}
                className="bg-white border border-[#E8E0D0] rounded-card p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  {/* Left: Buyer + Property */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold font-display text-sm shrink-0">
                        {deal.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display font-bold text-navy-900 text-sm">{deal.name}</p>
                        <p className="text-[10px] text-navy-600">{deal.email}</p>
                      </div>
                    </div>

                    {deal.property && (
                      <div className="flex items-center gap-1.5 text-[11px] text-navy-700 pl-10">
                        <Building className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                        <span className="truncate">{deal.property.title} — {deal.property.locality}, {deal.property.city}</span>
                      </div>
                    )}

                    {deal.notes[0] && (
                      <p className="text-[10px] text-navy-500 pl-10 italic truncate">
                        Last note: "{deal.notes[0].note}"
                      </p>
                    )}
                  </div>

                  {/* Right: Commission + Date */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
                    {commission ? (
                      <div className={`text-center px-3 py-1.5 rounded-card border ${
                        commission.status === CommissionStatus.RECEIVED
                          ? "bg-green-50 border-green-200"
                          : "bg-amber-50 border-amber-200"
                      }`}>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${
                          commission.status === CommissionStatus.RECEIVED ? "text-green-700" : "text-amber-700"
                        }`}>
                          {commission.status === CommissionStatus.RECEIVED ? "✓ Received" : "⏳ Expected"}
                        </p>
                        <p className={`text-base font-display font-bold ${
                          commission.status === CommissionStatus.RECEIVED ? "text-green-800" : "text-amber-800"
                        }`}>
                          ₹{Number(commission.amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ) : (
                      <Link href="/admin/commissions">
                        <span className="text-[10px] text-gold-600 font-bold underline cursor-pointer">
                          + Add Commission
                        </span>
                      </Link>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-navy-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(deal.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
