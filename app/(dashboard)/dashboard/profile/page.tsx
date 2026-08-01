import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VendorPortfolioUpload } from "@/components/profile/VendorPortfolioUpload";
import { AgentPortfolioUpload } from "@/components/profile/AgentPortfolioUpload";
import { getServerUser } from "@/lib/auth";
import { getUserById, getAgentProfileByUserId, getVendorProfileByUserId, agentProfilesCol, vendorProfilesCol } from "@/lib/firestore";
import { UserRole } from "@/types";

export const metadata = {
  title: "My Profile | DK Promoters",
};

export default async function ProfilePage() {
  const session = await getServerUser();
  
  if (!session) redirect("/admin/login");

  const userData = await getUserById(session.uid);
  if (!userData) redirect("/admin/login");

  let agentProfile = null;
  let vendorProfile = null;

  if (userData.role === UserRole.AGENT) {
    const profile = await getAgentProfileByUserId(session.uid);
    if (profile) {
      // Fetch media subcollection
      const mediaSnap = await agentProfilesCol().doc(profile.id).collection("media").orderBy("order").get();
      agentProfile = {
        ...profile,
        portfolioMedia: mediaSnap.docs.map((doc) => doc.data()),
      };
    }
  } else if (userData.role === UserRole.VENDOR) {
    const profile = await getVendorProfileByUserId(session.uid);
    if (profile) {
      // Fetch media subcollection
      const mediaSnap = await vendorProfilesCol().doc(profile.id).collection("media").orderBy("order").get();
      vendorProfile = {
        ...profile,
        portfolioMedia: mediaSnap.docs.map((doc) => doc.data()),
      };
    }
  }

  const user = {
    ...userData,
    agentProfile,
    vendorProfile,
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Profile</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={user.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input defaultValue={user.email} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input defaultValue={user.phone || ""} disabled />
          </div>
        </CardContent>
      </Card>

      {user.role === UserRole.AGENT && user.agentProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Portfolio Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Office Address</Label>
              <Input defaultValue={user.agentProfile.officeAddress} disabled />
            </div>
            <div className="space-y-2">
              <Label>Experience (Years)</Label>
              <Input defaultValue={user.agentProfile.experience.toString()} disabled />
            </div>
            <AgentPortfolioUpload initialMedia={user.agentProfile.portfolioMedia as any} />
          </CardContent>
        </Card>
      )}

      {user.role === UserRole.VENDOR && user.vendorProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Portfolio Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input defaultValue={user.vendorProfile.businessName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Years in Business</Label>
              <Input defaultValue={user.vendorProfile.yearsInBusiness.toString()} disabled />
            </div>
            <VendorPortfolioUpload initialMedia={user.vendorProfile.portfolioMedia as any} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
