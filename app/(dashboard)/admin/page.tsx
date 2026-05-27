import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Users, Clock, AlertCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard | Aadana Tharakar",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    pendingUsers,
    totalProperties,
    pendingProperties,
    totalLeads
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: "PENDING" } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.lead.count(),
  ]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Overview */}
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Admin Overview</h1>
        <p className="text-xs text-navy-700 mt-0.5">Summary of platform-wide metrics, users, listings, and moderation queues.</p>
      </div>

      {/* Pending Approval Warning Banner */}
      {(pendingUsers > 0 || pendingProperties > 0) && (
        <div className="bg-navy-900 text-white p-5 rounded-card border border-navy-950 shadow-sm flex items-start gap-4 flex-wrap sm:flex-nowrap">
          <AlertCircle className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <div>
              <h3 className="font-display font-bold text-base text-gold-500">Moderation Actions Required</h3>
              <p className="text-xs text-navy-200 mt-1">There are pending registrations or property draft listings waiting for your review.</p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {pendingProperties > 0 && (
                <Link href="/admin/properties">
                  <Button size="sm" className="bg-gold-500 text-navy-900 hover:bg-gold-400 text-xs font-bold h-9 rounded-btn">
                    Review {pendingProperties} Properties
                  </Button>
                </Link>
              )}
              {pendingUsers > 0 && (
                <Link href="/admin/users">
                  <Button size="sm" className="bg-gold-500 text-navy-900 hover:bg-gold-400 text-xs font-bold h-9 rounded-btn">
                    Review {pendingUsers} Users
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Properties */}
        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Total Properties</p>
              <h3 className="text-2xl font-bold text-navy-900 font-display">{totalProperties}</h3>
            </div>
            <div className="w-10 h-10 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center border border-navy-100/50">
              <Building className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        
        {/* Total Users */}
        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-2xl font-bold text-navy-900 font-display">{totalUsers}</h3>
            </div>
            <div className="w-10 h-10 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center border border-navy-100/50">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Total CRM Leads</p>
              <h3 className="text-2xl font-bold text-navy-900 font-display">{totalLeads}</h3>
            </div>
            <div className="w-10 h-10 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center border border-navy-100/50">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-750 uppercase tracking-wider mb-1">Total Pending Review</p>
              <h3 className="text-2xl font-bold text-navy-900 font-display">{pendingUsers + pendingProperties}</h3>
            </div>
            <div className="w-10 h-10 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center border border-navy-100/50">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
