import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MapPin, Plus } from "lucide-react";
import { getServerUser } from "@/lib/auth";
import { propertiesCol } from "@/lib/firestore";
import { UserRole, PropertyDoc, MediaDoc } from "@/types";

export const metadata = {
  title: "My Properties | DK Promoters",
};

export default async function MyPropertiesPage() {
  const session = await getServerUser();

  if (!session || (session.role !== UserRole.PROPERTY_LISTER && session.role !== UserRole.AGENT)) {
    redirect("/admin/login");
  }

  const snap = await propertiesCol()
    .where("postedById", "==", session.uid)
    .get();

  const propertiesList = snap.docs.map((doc) => {
    const data = doc.data();
    const converted: any = { id: doc.id };
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof (value as any).toDate === "function") {
        converted[key] = (value as any).toDate();
      } else {
        converted[key] = value;
      }
    }
    return converted as PropertyDoc;
  });

  // Sort by createdAt desc in-memory
  propertiesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Load subcollection media for each property
  const properties = await Promise.all(
    propertiesList.map(async (p) => {
      const mediaSnap = await propertiesCol().doc(p.id).collection("media").orderBy("order").get();
      return {
        ...p,
        media: mediaSnap.docs.map((m) => m.data() as MediaDoc),
      };
    })
  );

  const formatPrice = (price: bigint | number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumSignificantDigits: 3 }).format(Number(price));

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    SOLD: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    RENTED: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy-900">My Properties</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your real estate listings</p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button className="btn-primary h-10 text-xs gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8E0D0] shadow-sm">
          <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gold-500" />
          </div>
          <h3 className="text-lg font-bold text-navy-900">No properties listed</h3>
          <p className="text-gray-500 text-sm mt-2 mb-6">You haven&apos;t listed any properties yet.</p>
          <Link href="/dashboard/properties/new">
            <Button className="btn-primary">Add Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E8E0D0]">
              <thead className="bg-gray-50 text-[10px] font-bold text-navy-600 uppercase tracking-wider text-left">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0] text-sm">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                          {p.media[0] ? (
                            <img src={p.media[0].url} alt={p.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-navy-900 line-clamp-1">{p.title}</div>
                          <div className="text-xs text-gray-500">{p.locality}, {p.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-900">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[p.status] || "bg-gray-100 text-gray-800"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link href={`/properties/${p.id}`} target="_blank">
                        <Button size="xs" variant="outline" className="border-gold-500 text-gold-700 hover:bg-gold-50 inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/properties/${p.id}/edit`}>
                        <Button size="xs" variant="outline" className="border-navy-500 text-navy-700 hover:bg-navy-50 inline-flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
