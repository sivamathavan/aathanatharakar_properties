import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar } from "lucide-react";
import { UserRole } from "@prisma/client";

export const metadata = {
  title: "Enquiries | Aadana Tharakar",
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
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");

  const role = session.user.role;
  let enquiries: UnifiedEnquiry[] = [];

  if (role === UserRole.AGENT || role === UserRole.PROPERTY_LISTER) {
    const properties = await prisma.property.findMany({
      where: { postedById: session.user.id },
      select: { id: true, title: true }
    });
    
    const propertyMap = new Map(properties.map(p => [p.id, p.title]));
    const propertyIds = properties.map(p => p.id);

    const leads = await prisma.lead.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: "desc" },
    });

    enquiries = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      message: lead.message,
      createdAt: lead.createdAt,
      type: "PROPERTY" as const,
      targetTitle: lead.propertyId ? propertyMap.get(lead.propertyId) : undefined,
    }));
  } else if (role === UserRole.VENDOR) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, businessName: true }
    });

    if (vendorProfile) {
      const vendorEnquiries = await prisma.vendorEnquiry.findMany({
        where: { vendorId: vendorProfile.id },
        orderBy: { createdAt: "desc" },
      });

      enquiries = vendorEnquiries.map(enq => ({
        id: enq.id,
        name: enq.name,
        email: enq.email,
        message: enq.message,
        createdAt: enq.createdAt,
        type: "SERVICE" as const,
        targetTitle: vendorProfile.businessName,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Enquiries</h1>
        <p className="text-gray-500">Messages and leads from potential clients</p>
      </div>

      {enquiries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">No enquiries yet</h3>
          <p className="text-gray-500 mt-2 mb-6">When users contact you, their messages will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {enquiries.map(lead => (
            <Card key={lead.id} className="overflow-hidden border-gray-200 shadow-sm">
              <CardContent className="p-0 flex flex-col md:flex-row">
                <div className="bg-gray-50 p-6 md:w-1/4 border-b md:border-b-0 md:border-r border-gray-200">
                  <h4 className="font-bold text-[#1A1A1A] text-lg">{lead.name}</h4>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" /> 
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" /> 
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                      lead.type === "PROPERTY" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                    }`}>
                      {lead.type} Enquiry
                    </span>
                    {lead.targetTitle && (
                      <span className="text-sm font-medium text-[#E85D24]">
                        Re: {lead.targetTitle}
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Message:</h5>
                    <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg italic">"{lead.message}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
