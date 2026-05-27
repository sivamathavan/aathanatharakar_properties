import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { author: true },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
          Real Estate Insights
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          News, tips, and guides for buying, selling, and renting properties in Tamil Nadu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow border-[#E5DDD0] overflow-hidden flex flex-col group">
              <div className="h-48 bg-gray-200 overflow-hidden">
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    No Image
                  </div>
                )}
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 group-hover:text-[#E85D24] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <div className="flex items-center text-xs text-gray-500 mb-4 gap-4">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {post.author.name}</span>
                </div>
                {/* Simplified excerpt since we have HTML content */}
                <p className="text-gray-600 text-sm line-clamp-3 mt-auto">
                  Click to read more about this topic...
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-600">No posts found</h3>
          <p className="text-gray-500 mt-2">Check back later for new updates.</p>
        </div>
      )}
    </div>
  );
}
