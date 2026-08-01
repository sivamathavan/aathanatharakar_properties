import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerUser } from "@/lib/auth";
import { getUserById, propertiesCol, leadsCol, vendorProfilesCol, vendorEnquiriesCol } from "@/lib/firestore";
import { UserRole } from "@/types";

export const metadata = {
  title: "Dashboard | DK Promoters",
};

export default async function DashboardOverview() {
  const session = await getServerUser();
  
  if (!session) return null;

  const user = await getUserById(session.uid);

  if (!user) return null;

  let properties: any[] = [];
  let recentEnquiries: any[] = [];

  if (user.role === UserRole.PROPERTY_LISTER || user.role === UserRole.AGENT) {
    const propsSnap = await propertiesCol()
      .where("postedById", "==", user.id)
      .get();
    
    properties = propsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const propertyIds = properties.map(p => p.id);

    if (propertyIds.length > 0) {
      const leadsSnap = await leadsCol().get();
      // Filter in-memory
      const leads = leadsSnap.docs
        .filter((d) => d.data().propertyId && propertyIds.includes(d.data().propertyId))
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            email: data.email,
            message: data.message,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          };
        });

      leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      recentEnquiries = leads.slice(0, 5);
    }
  } else if (user.role === UserRole.VENDOR) {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (vendorProfile) {
      const enqsSnap = await vendorEnquiriesCol()
        .where("vendorId", "==", vendorProfile.id)
        .get();

      const enqs = enqsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          email: data.email,
          message: data.message,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        };
      });

      enqs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      recentEnquiries = enqs.slice(0, 5);
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-navy-900 text-white rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h1 className="text-xl md:text-2xl font-bold font-display">Welcome Back, {user.name}!</h1>
          <p className="text-gray-300 text-xs md:text-sm max-w-md">DK Promoters Broker Command Dashboard</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(user.role === UserRole.PROPERTY_LISTER || user.role === UserRole.AGENT) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEnquiries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enquiries Received</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEnquiries.length > 0 ? (
            <div className="space-y-4">
              {recentEnquiries.map((enq) => (
                <div key={enq.id} className="border-b border-[#E8E0D0] pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{enq.name}</p>
                      <p className="text-xs text-gray-500">{enq.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {enq.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 italic">"{enq.message}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No enquiries received yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Inline helper for vendor profile fetch
async function getVendorProfileByUserId(userId: string) {
  const snap = await vendorProfilesCol().where("userId", "==", userId).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
