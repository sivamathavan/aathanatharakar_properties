import { getPaymentRequests } from "@/lib/firestore";
import { PaymentsReview } from "@/components/admin/PaymentsReview";

export const metadata = { title: "Payments | DK Promoters Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const [pending, all] = await Promise.all([getPaymentRequests({ status: "PENDING" }), getPaymentRequests()]);
  const decided = all.filter((p) => p.status !== "PENDING").slice(0, 100);
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Payments</h1>
        <p className="text-xs text-navy-700 mt-0.5">Check each UTR against your bank or UPI app before approving. Approving extends the plan or starts the boost straight away.</p>
      </div>
      <PaymentsReview pending={JSON.parse(JSON.stringify(pending))} decided={JSON.parse(JSON.stringify(decided))} />
    </div>
  );
}
