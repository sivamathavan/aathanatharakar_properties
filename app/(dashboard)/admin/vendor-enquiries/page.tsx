import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, User, Briefcase } from "lucide-react";

export const metadata = {
  title: "Vendor Enquiries | Aadana Tharakar Admin",
};

export default async function AdminVendorEnquiriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") redirect("/admin/login");

  const enquiries = await prisma.vendorEnquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: {
        include: { user: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Vendor Enquiries</h1>
        <p className="text-gray-500">Monitor all service professional enquiries</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {enquiries.map(enquiry => (
          <Card key={enquiry.id} className="overflow-hidden border-gray-200">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="bg-gray-50 p-6 md:w-1/4 border-b md:border-b-0 md:border-r border-gray-200">
                <h4 className="font-bold text-[#1A1A1A] text-lg">{enquiry.name}</h4>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {enquiry.email}</div>
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(enquiry.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                  {enquiry.vendor && (
                    <div className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center">
                      <Briefcase className="w-3 h-3 mr-1" /> Service: {enquiry.vendor.businessName}
                    </div>
                  )}
                  {enquiry.vendor?.user && (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      <User className="w-3 h-3 mr-1" /> To: {enquiry.vendor.user.name}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Message:</h5>
                  <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg italic">"{enquiry.message}"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {enquiries.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            No vendor enquiries found.
          </div>
        )}
      </div>
    </div>
  );
}
