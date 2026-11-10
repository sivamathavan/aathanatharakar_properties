import { notFound } from "next/navigation";
import { loadListing } from "@/lib/listing-page";

// Runs above ./loading.tsx, so a missing or hidden listing answers a real 404
// before any of the page is sent. The page reuses the same cached read.
export default async function ListingLayout(props: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!(await loadListing(id))) notFound();
  return props.children;
}
