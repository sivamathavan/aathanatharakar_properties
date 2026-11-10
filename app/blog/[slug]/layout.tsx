import { notFound } from "next/navigation";
import { loadBlogPost } from "@/lib/blog-post";

// Runs above ./loading.tsx, so a missing post answers a real 404 before any of
// the page is sent. The page reuses the same cached read.
export default async function BlogPostLayout(props: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  if (!(await loadBlogPost(slug))) notFound();
  return props.children;
}
