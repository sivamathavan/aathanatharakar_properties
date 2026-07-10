import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Store, Handshake, Zap, CheckCircle2, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Overview | DK Promoters",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalProperties,
    activeProperties,
    totalVendors,
    totalCoBrokers,
    activeDealsCount,
    completedDealsCount,
    revenueResult,
    recentDeals,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.vendorProfile.count(),
    prisma.agentProfile.count(),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION"] } } }),
    prisma.lead.count({ where: { status: "CLOSED" } }),
    prisma.commission.aggregate({ _sum: { amount: true }, where: { status: "RECEIVED" } }),
    prisma.lead.findMany({
      where: { status: { in: ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { property: { select: { title: true, city: true } } },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.amount || 0);

  const STATUS_COLORS: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-indigo-100 text-indigo-800",
    SITE_VISIT: "bg-purple-100 text-purple-800",
    NEGOTIATION: "bg-amber-100 text-amber-800",
    CLOSED: "bg-green-100 text-green-800",
    LOST: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8 font-sans pb-12">

      {/* Header */}
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Broker Overview</h1>
        <p className="text-xs text-navy-700 mt-0.5">DK Promoters — Your complete broker command centre.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Properties</p>
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
                <Building className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{activeProperties}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">of {totalProperties} total</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Vendors</p>
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
                <Store className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{totalVendors}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">allied services</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Co-Brokers</p>
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
                <Handshake className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{totalCoBrokers}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">dealers / agents</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Active Deals</p>
              <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{activeDealsCount}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">in pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Completed</p>
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{completedDealsCount}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">deals closed</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-gradient-to-br from-navy-900 to-navy-800 rounded-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">Revenue</p>
              <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gold-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gold-500 font-display">
              ₹{totalRevenue >= 100000
                ? `${(totalRevenue / 100000).toFixed(1)}L`
                : totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-gold-300/70 mt-0.5">received commissions</p>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/admin/properties/new">
          <Button className="w-full h-12 bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold text-xs rounded-btn flex items-center justify-center gap-2">
            <Building className="w-4 h-4" /> + Add Property
          </Button>
        </Link>
        <Link href="/admin/vendors">
          <Button variant="outline" className="w-full h-12 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-bold text-xs rounded-btn flex items-center justify-center gap-2">
            <Store className="w-4 h-4" /> Manage Vendors
          </Button>
        </Link>
        <Link href="/admin/leads">
          <Button variant="outline" className="w-full h-12 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-bold text-xs rounded-btn flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Active Deals
          </Button>
        </Link>
        <Link href="/admin/commissions">
          <Button variant="outline" className="w-full h-12 border-[#E8E0D0] text-navy-800 hover:bg-navy-50 font-bold text-xs rounded-btn flex items-center justify-center gap-2">
            <Receipt className="w-4 h-4" /> Revenue Tracker
          </Button>
        </Link>
      </div>

      {/* Recent Active Deals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base text-navy-900">Recent Active Deals</h2>
          <Link href="/admin/leads">
            <Button variant="ghost" size="sm" className="text-gold-600 hover:text-gold-700 text-xs font-bold">
              View All →
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          {recentDeals.length === 0 ? (
            <div className="text-center py-10 text-sm text-navy-700 bg-white border border-[#E8E0D0] rounded-card">
              No active deals yet. Leads from enquiry forms will appear here.
            </div>
          ) : (
            recentDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white border border-[#E8E0D0] rounded-card p-4 flex items-center justify-between gap-3 hover:shadow-xs transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-navy-900 text-sm truncate">{deal.name}</p>
                  <p className="text-[11px] text-navy-600 truncate mt-0.5">
                    {deal.property ? `${deal.property.title} — ${deal.property.city}` : "Direct Enquiry"}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[deal.status] || "bg-gray-100 text-gray-700"}`}>
                  {deal.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
