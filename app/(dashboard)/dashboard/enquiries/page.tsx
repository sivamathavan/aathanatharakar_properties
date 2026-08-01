import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar } from "lucide-react";
import { getServerUser } from "@/lib/auth";
import { UserRole } from "@/types";

export const metadata = {
  title: "Enquiries | DK Promoters",
};

interface UnifiedEnquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  type: "PROPERTY" | "SERVICE";
  targetTitle?: string;
}

export default async function EnquiriesPage() {
  const session = await getServerUser();
  
  if (!session) redirect("/admin/login");

  const enquiries: UnifiedEnquiry[] = []; // Paused feature placeholder

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Enquiries</h1>
        <p className="text-gray-500">Monitor enquiries received for your listings or services</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {enquiries.map(enquiry => (
          <Card key={enquiry.id} className="overflow-hidden border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-lg">{enquiry.name}</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {enquiry.email}</div>
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(enquiry.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {enquiry.targetTitle && (
                  <div className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mt-2 md:mt-0 h-fit w-fit">
                    {enquiry.type === "PROPERTY" ? "Listing: " : "Service: "} {enquiry.targetTitle}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">"{enquiry.message}"</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {enquiries.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            No enquiries found.
          </div>
        )}
      </div>
    </div>
  );
}
