import { MetadataRoute } from "next";
import { propertiesCol, blogPostsCol, listAgents } from "@/lib/firestore";
import { isPlanLive } from "@/lib/plans";
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
    "/for-agents",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Agent pages help agents get found on Google, which is part of what they pay for.
  const liveAgents = new Map((await listAgents()).filter((a) => isPlanLive(a.plan) && a.emailVerified).map((a) => [a.id, a.slug]));
  const propertiesSnap = await propertiesCol()
    .where("status", "==", PropertyStatus.ACTIVE)
    .select("updatedAt", "ownerType", "postedById")
    .limit(20000)
    .get();

  const propertyRoutes = propertiesSnap.docs.flatMap((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now());
    if (data.ownerType === "AGENT") {
      const slug = liveAgents.get(data.postedById);
      if (!slug) return [];
      return [{ url: `${baseUrl}/a/${slug}/${doc.id}`, lastModified: updatedAt, changeFrequency: "weekly" as const, priority: 0.5 }];
    }
    return [{ url: `${baseUrl}/properties/${doc.id}`, lastModified: updatedAt, changeFrequency: "weekly" as const, priority: 0.6 }];
  });
  const agentRoutes = Array.from(liveAgents.values()).map((slug) => ({
    url: `${baseUrl}/a/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

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
    ...agentRoutes,
    ...propertyRoutes,
    ...dbBlogRoutes,
    ...staticBlogRoutes,
  ];
}
