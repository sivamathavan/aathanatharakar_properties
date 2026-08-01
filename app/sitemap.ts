import { MetadataRoute } from "next";
import { propertiesCol, blogPostsCol } from "@/lib/firestore";
import { PropertyStatus } from "@/types";
import { SITE_URL } from "@/lib/site";
import { STATIC_POSTS } from "@/lib/static-blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticRoutes = [
    "",
    "/about",
    "/properties",
    "/blog",
    "/sell-your-property",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const propertiesSnap = await propertiesCol()
    .where("status", "==", PropertyStatus.ACTIVE)
    .get();

  const propertyRoutes = propertiesSnap.docs.map((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now());
    return {
      url: `${baseUrl}/properties/${doc.id}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    };
  });

  const dbPostsSnap = await blogPostsCol()
    .where("isPublished", "==", true)
    .get();

  const dbBlogRoutes = dbPostsSnap.docs.map((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now());
    return {
      url: `${baseUrl}/blog/${data.slug}`,
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    };
  });

  const staticBlogRoutes =
    dbPostsSnap.empty
      ? STATIC_POSTS.map((p) => ({
          url: `${baseUrl}/blog/${p.slug}`,
          lastModified: new Date(p.publishedAt),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        }))
      : [];

  return [
    ...staticRoutes,
    ...propertyRoutes,
    ...dbBlogRoutes,
    ...staticBlogRoutes,
  ];
}
