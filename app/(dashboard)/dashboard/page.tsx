import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard | DK Promoters",
};

export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  let properties: any[] = [];
  let recentEnquiries: any[] = [];

  if (user.role === "PROPERTY_LISTER" || user.role === "AGENT") {
    properties = await prisma.property.findMany({
      where: { postedById: user.id },
    });
    const propertyIds = properties.map(p => p.id);
    const leads = await prisma.lead.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    recentEnquiries = leads.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      message: l.message,
      createdAt: l.createdAt,
    }));
  } else if (user.role === "VENDOR") {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: user.id },
    });
    if (vendorProfile) {
      const enqs = await prisma.vendorEnquiry.findMany({
        where: { vendorId: vendorProfile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      recentEnquiries = enqs.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        message: e.message,
        createdAt: e.createdAt,
      }));
    }
  }

  const activeProperties = properties.filter(p => p.status === "ACTIVE").length;
  const pendingProperties = properties.filter(p => p.status === "PENDING").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E0D0] pb-4">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Welcome back, {user.name}</h1>
          <p className="text-xs text-navy-700 mt-0.5">Here is a quick overview of your DK Promoters activity.</p>
        </div>
        {(user.role === "PROPERTY_LISTER" || user.role === "AGENT") && (
          <Link href="/dashboard/properties/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn transition-colors shadow-sm">
              Add New Property
            </Button>
          </Link>
        )}
      </div>

      {user.accountStatus === "PENDING" && (
        <div className="bg-navy-50 border border-navy-100 text-navy-900 p-4 rounded-btn flex items-start gap-3">
          <Clock className="w-5 h-5 mt-0.5 text-gold-600 shrink-0 animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-navy-950">Account Pending Verification</h3>
            <p className="text-xs mt-1 text-navy-800 leading-relaxed">
              Your profile is currently under review by our moderation team. You can explore the dashboard and prepare drafts, but listings/quotes will not go live until verified.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {(user.role === "PROPERTY_LISTER" || user.role === "AGENT") && (
          <>
            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Active Properties</p>
                  <h3 className="text-2xl font-bold text-navy-900 font-display">{activeProperties}</h3>
                </div>
                <div className="w-10 h-10 bg-[#1D6A3A]/10 rounded-full flex items-center justify-center text-[#1D6A3A]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Pending Review</p>
                  <h3 className="text-2xl font-bold text-navy-900 font-display">{pendingProperties}</h3>
                </div>
                <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-650">
                  <Clock className="w-5 h-5 text-gold-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Recent Enquiries</p>
              <h3 className="text-2xl font-bold text-navy-900 font-display">{recentEnquiries.length}</h3>
            </div>
            <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center text-gold-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Enquiries List */}
      <Card className="border-[#E8E0D0] bg-white rounded-card shadow-xs">
        <CardHeader className="border-b border-[#E8E0D0]/60 pb-3">
          <CardTitle className="text-base font-display font-semibold text-navy-900">Recent Customer Enquiries</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {recentEnquiries.length === 0 ? (
            <div className="text-center py-10 text-xs text-navy-700 leading-normal">
              No enquiries received yet. Property detail views will prompt buyer leads here.
            </div>
          ) : (
            <div className="divide-y divide-[#E8E0D0]/50">
              {recentEnquiries.map(lead => (
                <div key={lead.id} className="py-4 flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-navy-900">{lead.name}</h4>
                    <p className="text-xs text-navy-700 font-medium">{lead.email}</p>
                    <p className="text-xs text-navy-800 bg-navy-50/50 p-2.5 rounded-btn mt-2 border border-navy-100/50 leading-relaxed font-sans">{lead.message}</p>
                  </div>
                  <div className="text-[10px] text-navy-700 whitespace-nowrap bg-warm-cream/50 px-2.5 py-1 rounded-full border border-[#E8E0D0]/40 font-medium">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentEnquiries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E8E0D0]/50 text-center">
              <Link href="/dashboard/enquiries" className="text-gold-600 text-xs font-bold hover:underline tracking-wide uppercase">
                View All Enquiries
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
