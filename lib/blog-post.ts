import { cache } from "react";
import { BRAND } from "@/lib/brand";
import { getBlogPostBySlug, getUserById } from "@/lib/firestore";
import { STATIC_POSTS_BY_SLUG } from "@/lib/static-blog";

export type ResolvedPost = {
  title: string;
  content: string;
  coverImageUrl: string | null;
  publishedAtIso: string;
  updatedAtIso: string;
  authorName: string;
  category?: string;
  readTime?: string;
  excerpt?: string;
};

/**
 * A published blog post (Firestore first, then the built-in posts), or null when
 * /blog/[slug] must be a 404. Cached per request, so the layout's check, the
 * metadata and the page share one read.
 */
export const loadBlogPost = cache(async (slug: string): Promise<ResolvedPost | null> => {
  const dbPost = await getBlogPostBySlug(slug);

  if (dbPost && dbPost.isPublished) {
    const author = await getUserById(dbPost.authorId);
    return {
      title: dbPost.title,
      content: dbPost.content,
      coverImageUrl: dbPost.coverImageUrl || null,
      publishedAtIso: new Date(dbPost.publishedAt || dbPost.createdAt).toISOString(),
      updatedAtIso: new Date(dbPost.updatedAt).toISOString(),
      authorName: author?.name || `${BRAND.name} Team`,
      excerpt: dbPost.excerpt,
    };
  }

  const fallback = STATIC_POSTS_BY_SLUG[slug];
  if (fallback) {
    return {
      title: fallback.title,
      content: fallback.content
        .split("\n")
        .map((line) =>
          line.trim() ? `<p>${line.replace(/</g, "&lt;")}</p>` : ""
        )
        .join(""),
      coverImageUrl: fallback.coverImageUrl,
      publishedAtIso: new Date(fallback.publishedAt).toISOString(),
      updatedAtIso: new Date(fallback.publishedAt).toISOString(),
      authorName: fallback.author,
      category: fallback.category,
      readTime: fallback.readTime,
      excerpt: fallback.excerpt,
    };
  }

  return null;
});
