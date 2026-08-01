import { Card, CardContent } from "@/components/ui/card";
import { Building, Store, Handshake, Zap, CheckCircle2, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { propertiesCol, vendorProfilesCol, agentProfilesCol, leadsCol, commissionsCol, getPropertyById } from "@/lib/firestore";
import { PropertyStatus, LeadStatus, CommissionStatus } from "@/types";

export const metadata = {
  title: "Admin Overview | DK Promoters",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    propertiesSnap,
    vendorsSnap,
    coBrokersSnap,
    leadsSnap,
    commissionsSnap,
  ] = await Promise.all([
    propertiesCol().get(),
    vendorProfilesCol().get(),
    agentProfilesCol().get(),
    leadsCol().get(),
    commissionsCol().get(),
  ]);

  const totalProperties = propertiesSnap.size;
  const activeProperties = propertiesSnap.docs.filter((d) => d.data().status === PropertyStatus.ACTIVE).length;
  
  const totalVendors = vendorsSnap.size;
  const totalCoBrokers = coBrokersSnap.size;

  const activeStatuses = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.SITE_VISIT,
    LeadStatus.NEGOTIATION,
  ];

  const activeDealsCount = leadsSnap.docs.filter((d) => activeStatuses.includes(d.data().status)).length;
  const completedDealsCount = leadsSnap.docs.filter((d) => d.data().status === LeadStatus.CLOSED).length;

  const totalRevenue = commissionsSnap.docs
    .filter((d) => d.data().status === CommissionStatus.RECEIVED)
    .reduce((sum, d) => sum + Number(d.data().amount || 0), 0);

  // Get recent active deals (in-memory sort/filter)
  const activeLeadsDocs = leadsSnap.docs.filter((d) => activeStatuses.includes(d.data().status));
  activeLeadsDocs.sort((a, b) => {
    const tA = a.data().updatedAt?.toDate ? a.data().updatedAt.toDate().getTime() : new Date(a.data().updatedAt || 0).getTime();
    const tB = b.data().updatedAt?.toDate ? b.data().updatedAt.toDate().getTime() : new Date(b.data().updatedAt || 0).getTime();
    return tB - tA;
  });

  const recentLeadsRaw = activeLeadsDocs.slice(0, 5).map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      message: data.message,
      status: data.status,
      propertyId: data.propertyId,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    };
  });

  const recentDeals = await Promise.all(
    recentLeadsRaw.map(async (l) => {
      const property = l.propertyId ? await getPropertyById(l.propertyId) : null;
      return {
        ...l,
        property: property ? { title: property.title, city: property.city } : null,
      };
    })
  );

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
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{activeDealsCount}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">active pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Closed Deals</p>
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 font-display">{completedDealsCount}</h3>
            <p className="text-[10px] text-navy-600 mt-0.5">fully closed</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8E0D0] bg-white rounded-card shadow-2xs col-span-2 md:col-span-1 border-gold-200 bg-gold-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gold-700 uppercase tracking-wider">Revenue</p>
              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                <Receipt className="w-4 h-4 text-gold-700" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-navy-950 font-display">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-gold-700 mt-0.5">commissions received</p>
          </CardContent>
        </Card>

      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Active Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-card border border-[#E8E0D0] p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-semibold text-navy-900 text-base">Recent Active Deals</h2>
            <Link href="/admin/leads">
              <Button size="sm" variant="ghost" className="text-xs text-gold-700 hover:text-gold-600 font-bold">
                View All Deals
              </Button>
            </Link>
          </div>

          {recentDeals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[#E8E0D0] text-[10px] uppercase font-bold text-navy-600 tracking-wider">
                    <th className="pb-3 font-semibold">Lead Details</th>
                    <th className="pb-3 font-semibold">Property</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D0]">
                  {recentDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-navy-900">{deal.name}</p>
                        <p className="text-[11px] text-gray-500">{deal.email}</p>
                      </td>
                      <td className="py-3">
                        {deal.property ? (
                          <>
                            <p className="font-medium text-navy-800 line-clamp-1">{deal.property.title}</p>
                            <p className="text-[10px] text-gray-500">{deal.property.city}</p>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400">Direct Enquiry</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[deal.status] || "bg-gray-100 text-gray-800"}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/leads?id=${deal.id}`}>
                          <Button size="xs" variant="outline" className="text-[11px] h-7 border-gold-500 text-gold-700 hover:bg-gold-500 hover:text-navy-900 font-bold">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No active deals in the pipeline</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-card border border-[#E8E0D0] p-6 shadow-2xs h-fit space-y-6">
          <div>
            <h2 className="font-display font-semibold text-navy-900 text-base mb-1">Quick Actions</h2>
            <p className="text-[11px] text-gray-500">Common administrative tasks</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/admin/properties?action=new" className="w-full">
              <Button className="w-full justify-start text-xs font-bold bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 h-10">
                ➕ Add New Property Listing
              </Button>
            </Link>
            <Link href="/admin/vendors?action=new" className="w-full">
              <Button variant="outline" className="w-full justify-start text-xs font-bold border-gold-500 text-gold-700 hover:bg-gold-50 h-10">
                👷 Register New Service Vendor
              </Button>
            </Link>
            <Link href="/admin/co-brokers?action=new" className="w-full">
              <Button variant="outline" className="w-full justify-start text-xs font-bold border-gold-500 text-gold-700 hover:bg-gold-50 h-10">
                🤝 Register Co-Broker / Agent
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
