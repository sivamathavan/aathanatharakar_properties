import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VendorPortfolioUpload } from "@/components/profile/VendorPortfolioUpload";
import { AgentPortfolioUpload } from "@/components/profile/AgentPortfolioUpload";

export const metadata = {
  title: "My Profile | DK Promoters",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      agentProfile: {
        include: { portfolioMedia: true }
      },
      vendorProfile: {
        include: { portfolioMedia: true }
      },
    }
  });

  if (!user) redirect("/login");

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
              <Input defaultValue={user.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input defaultValue={user.phone || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Account Role</Label>
              <Input defaultValue={user.role.replace('_', ' ')} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {user.vendorProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input defaultValue={user.vendorProfile.businessName} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input defaultValue={user.vendorProfile.category.replace('_', ' ')} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input defaultValue={user.vendorProfile.yearsInBusiness || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Operating Cities</Label>
                <Input defaultValue={user.vendorProfile.serviceAreas.join(', ')} readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Description</Label>
              <Textarea defaultValue={user.vendorProfile.description || ""} rows={4} readOnly />
            </div>
            
            <p className="text-xs text-gray-500 italic mt-4">To update these details, please contact administrator support.</p>
          </CardContent>
        </Card>
      )}

      {user.vendorProfile && (
        <Card>
          <CardHeader>
            <CardTitle>My Portfolio</CardTitle>
            <p className="text-sm text-gray-500">Upload photos of your past projects to showcase on your public profile.</p>
          </CardHeader>
          <CardContent>
            <VendorPortfolioUpload 
              initialMedia={user.vendorProfile.portfolioMedia.map(m => ({ 
                url: m.url, 
                type: m.type as "IMAGE" | "VIDEO" 
              }))} 
            />
          </CardContent>
        </Card>
      )}

      {user.agentProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Office Address</Label>
                <Input defaultValue={user.agentProfile.officeAddress} readOnly />
              </div>
              <div className="space-y-2">
                <Label>RERA Number</Label>
                <Input defaultValue={user.agentProfile.reraNumber || "Not Provided"} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input defaultValue={user.agentProfile.experience || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Operating Cities</Label>
                <Input defaultValue={user.agentProfile.operatingCities.join(', ')} readOnly />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 italic mt-4">To update these details, please contact administrator support.</p>
          </CardContent>
        </Card>
      )}

      {user.agentProfile && (
        <Card>
          <CardHeader>
            <CardTitle>My Portfolio</CardTitle>
            <p className="text-sm text-gray-500 font-sans">Upload photos of your agency, team, or past achievements to showcase on your public profile.</p>
          </CardHeader>
          <CardContent>
            <AgentPortfolioUpload 
              initialMedia={user.agentProfile.portfolioMedia.map(m => ({ 
                url: m.url, 
                type: m.type as "IMAGE" | "VIDEO" 
              }))} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
