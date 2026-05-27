import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MapPin, Plus } from "lucide-react";

export const metadata = {
  title: "My Properties | Aadana Tharakar",
};

export default async function MyPropertiesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PROPERTY_LISTER" && session.user.role !== "AGENT")) {
    redirect("/dashboard");
  }

  const properties = await prisma.property.findMany({
    where: { postedById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { media: true },
  });

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
            <Button className="btn-primary">Create Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile card list (< md) */}
          <div className="md:hidden space-y-3">
            {properties.map(property => (
              <div key={property.id} className="bg-white rounded-xl border border-[#E8E0D0] shadow-sm p-4 flex gap-3 items-start">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-navy-50 overflow-hidden flex-shrink-0">
                  {property.media?.[0] ? (
                    <img
                      src={property.media[0].thumbnailUrl || property.media[0].url}
                      className="w-full h-full object-cover"
                      alt={property.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No img</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900 text-sm leading-snug line-clamp-1">{property.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor[property.status] || "bg-gray-100 text-gray-700"}`}>
                      {property.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{property.locality}, {property.city}</p>
                  <p className="font-bold text-navy-900 text-sm mt-1">{formatPrice(property.price)}</p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/properties/${property.id}`} target="_blank">
                      <Button variant="ghost" size="sm" className="h-8 text-xs px-3 text-gray-500 hover:text-navy-900">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/properties/${property.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs px-3 text-gray-500 hover:text-gold-600">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table (md+) */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E8E0D0] shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 border-b border-[#E8E0D0]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-navy-700">Property</th>
                  <th className="px-6 py-4 font-semibold text-navy-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-navy-700">Price</th>
                  <th className="px-6 py-4 font-semibold text-navy-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0]">
                {properties.map(property => (
                  <tr key={property.id} className="hover:bg-[#FDF8E8] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-navy-50 rounded-lg overflow-hidden flex-shrink-0">
                          {property.media?.[0] ? (
                            <img src={property.media[0].thumbnailUrl || property.media[0].url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-navy-900 line-clamp-1">{property.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{property.locality}, {property.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[property.status] || "bg-gray-100 text-gray-700"}`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy-900">
                      {formatPrice(property.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/properties/${property.id}`} target="_blank">
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-navy-900"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Link href={`/dashboard/properties/${property.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gold-600"><Edit className="w-4 h-4" /></Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
