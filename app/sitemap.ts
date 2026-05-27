import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { PropertyStatus } from '@prisma/client';

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL from environment or fallback
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.aadanatharakar.com';

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/properties',
    '/services',
    '/blog',
    '/login',
    '/register',
    '/sell-your-property'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic property routes
  const properties = await prisma.property.findMany({
    where: { status: PropertyStatus.ACTIVE },
    select: { id: true, updatedAt: true },
  });

  const propertyRoutes = properties.map((property) => ({
    url: `${baseUrl}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
