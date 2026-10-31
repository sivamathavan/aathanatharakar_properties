import { BRAND } from "@/lib/brand";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { PropertyForm } from "@/components/property/PropertyForm";
import { UserRole } from "@/types";

export const metadata = { title: "Add property · Admin" };

export default async function AdminNewPropertyPage() {
  const session = await getServerUser();
  if (!session || session.role !== UserRole.ADMIN) redirect("/admin/login");
  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Add property</h1>
        <p className="text-xs text-navy-700">Your listings go live on the main {BRAND.name} site.</p>
      </div>
      <PropertyForm storageFolder={`properties/${session.uid}`} photoLimit={30} allowVideo doneHref="/admin/properties" />
    </div>
  );
}
