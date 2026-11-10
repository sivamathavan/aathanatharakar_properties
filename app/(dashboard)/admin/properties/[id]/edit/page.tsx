import { notFound, redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getPropertyById, getPropertyPrivate } from "@/lib/firestore";
import { PropertyForm } from "@/components/property/PropertyForm";
import { toFormValues } from "@/lib/property-form-values";
import { UserRole } from "@/types";

export const metadata = { title: "Edit property · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEditPropertyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerUser();
  if (!session || session.role !== UserRole.ADMIN) redirect("/admin/login");
  const property = await getPropertyById(params.id);
  if (!property) notFound();
  // Agents' private details (owner name, phone, survey number) stay with the agent.
  const own = property.postedById === session.uid;
  const priv = own ? await getPropertyPrivate(params.id) : {};
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
        showPrivate={own}
        doneHref="/admin/properties"
      />
    </div>
  );
}
