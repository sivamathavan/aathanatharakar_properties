import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PropertyStatus } from "@prisma/client";
import { SITE_URL } from "@/lib/site";
import { STATIC_POSTS } from "@/lib/static-blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticRoutes = [
    "",
    "/about",
    "/properties",
    "/services",
    "/blog",
    "/login",
    "/register",
    "/sell-your-property",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const properties = await prisma.property.findMany({
    where: { status: PropertyStatus.ACTIVE },
    select: { id: true, updatedAt: true },
    take: 10000,
  });

  const propertyRoutes = properties.map((property) => ({
    url: `${baseUrl}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const dbPosts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });
  const dbBlogRoutes = dbPosts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const staticBlogRoutes =
    dbPosts.length === 0
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
