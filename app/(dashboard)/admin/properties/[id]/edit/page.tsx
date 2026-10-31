import { notFound, redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getPropertyById, getPropertyPrivate } from "@/lib/firestore";
import { PropertyForm, toFormValues } from "@/components/property/PropertyForm";
import { UserRole } from "@/types";

export const metadata = { title: "Edit property | DK Promoters Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEditPropertyPage({ params }: { params: { id: string } }) {
  const session = await getServerUser();
  if (!session || session.role !== UserRole.ADMIN) redirect("/admin/login");
  const property = await getPropertyById(params.id);
  if (!property) notFound();
  const priv = await getPropertyPrivate(params.id);
  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Edit property</h1>
        {property.ownerType === "AGENT" && <p className="text-xs text-amber-700">This listing belongs to an agent. Change it only to fix a problem.</p>}
      </div>
      <PropertyForm
        propertyId={params.id}
        initial={toFormValues(JSON.parse(JSON.stringify(property)), JSON.parse(JSON.stringify(priv)))}
        storageFolder={`properties/${session.uid}`}
        photoLimit={30}
        allowVideo
        doneHref="/admin/properties"
      />
    </div>
  );
}
