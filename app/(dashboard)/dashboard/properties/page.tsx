import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye, Trash2, MapPin } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">My Properties</h1>
          <p className="text-gray-500">Manage your real estate listings</p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button className="bg-[#E85D24] hover:bg-[#d6521e]">Add Property</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">No properties listed</h3>
          <p className="text-gray-500 mt-2 mb-6">You haven't listed any properties yet.</p>
          <Link href="/dashboard/properties/new">
            <Button className="bg-[#1D6A3A] hover:bg-[#15502c]">Create Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Property</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map(property => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {property.media && property.media[0] ? (
                          <img src={property.media[0].thumbnailUrl || property.media[0].url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">No Img</div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1A1A] line-clamp-1">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.locality}, {property.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      property.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      property.status === 'SOLD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#1A1A1A]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(Number(property.price))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/properties/${property.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#1D6A3A]"><Eye className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
