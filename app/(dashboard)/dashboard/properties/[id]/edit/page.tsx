import { notFound } from "next/navigation";
import { requireAgentPage } from "@/lib/agent-session";
import { getPropertyById, getPropertyPrivate } from "@/lib/firestore";
import { PropertyForm, toFormValues } from "@/components/property/PropertyForm";

export const metadata = { title: "Edit property" };
export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const { agent, limits } = await requireAgentPage();
  const property = await getPropertyById(params.id);
  if (!property || property.postedById !== agent.id) notFound();
  const priv = await getPropertyPrivate(params.id);

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-navy-900">Edit property</h1>
      <PropertyForm
        propertyId={params.id}
        initial={toFormValues(JSON.parse(JSON.stringify(property)), JSON.parse(JSON.stringify(priv)))}
        storageFolder={`properties/${agent.id}`}
        photoLimit={limits.photoLimit}
        doneHref="/dashboard/properties"
      />
    </div>
  );
}
