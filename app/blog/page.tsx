import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, User, Clock, TrendingUp } from "lucide-react";
import { STATIC_POSTS } from "@/lib/static-blog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Real Estate Blog | Aadana Tharakar",
  description:
    "Expert tips, market insights, and guides for buying, selling, and renting properties in Tamil Nadu.",
};

const categoryColors: Record<string, string> = {
  "Buying Guide": "bg-gold-500/15 text-gold-700",
  "Legal & RERA": "bg-navy-100 text-navy-700",
  "Market Analysis": "bg-blue-50 text-blue-700",
  Finance: "bg-green-50 text-green-700",
  "Interior & Design": "bg-purple-50 text-purple-700",
  Renting: "bg-orange-50 text-orange-700",
};

export default async function BlogPage() {
  const dbPosts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    include: { author: true },
  });

  const hasPosts = dbPosts.length > 0;

  return (
    <div className="bg-warm-cream min-h-screen pb-24 md:pb-16">
      <div className="bg-navy-900 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-gold-500 text-xs font-bold uppercase tracking-widest mb-4">
            <TrendingUp className="w-4 h-4" />
            Tamil Nadu Real Estate Insights
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Property News & Guides
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Expert tips, market analysis, and step-by-step guides for buying,
            selling, and renting property across Tamil Nadu.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        {hasPosts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {dbPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <article className="bg-white rounded-card border border-[#E8E0D0] shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
                  <div className="relative h-44 sm:h-48 overflow-hidden bg-navy-50">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <h2 className="font-display font-semibold text-navy-900 text-base leading-snug mb-3 group-hover:text-gold-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <div className="flex items-center text-xs text-gray-500 gap-3 mt-auto pt-3 border-t border-[#E8E0D0]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(
                          post.publishedAt || post.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author.name}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            <Link
              href={`/blog/${STATIC_POSTS[0].slug}`}
              className="group sm:col-span-2 lg:col-span-2"
            >
              <article className="bg-white rounded-card border border-[#E8E0D0] shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col sm:flex-row">
                <div className="relative sm:w-1/2 h-48 sm:h-auto overflow-hidden bg-navy-50 flex-shrink-0">
                  <img
                    src={STATIC_POSTS[0].coverImageUrl}
                    alt={STATIC_POSTS[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill bg-gold-500 text-navy-900">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-pill ${
                        categoryColors[STATIC_POSTS[0].category] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATIC_POSTS[0].category}
                    </span>
                    <h2 className="font-display font-bold text-navy-900 text-lg sm:text-xl md:text-2xl leading-snug mt-3 mb-3 group-hover:text-gold-600 transition-colors">
                      {STATIC_POSTS[0].title}
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {STATIC_POSTS[0].excerpt}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 gap-3 mt-4 pt-4 border-t border-[#E8E0D0]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(STATIC_POSTS[0].publishedAt).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {STATIC_POSTS[0].readTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>

            {STATIC_POSTS.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white rounded-card border border-[#E8E0D0] shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
                  <div className="relative h-40 sm:h-44 overflow-hidden bg-navy-50 flex-shrink-0">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-pill ${
                          categoryColors[post.category] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="font-display font-semibold text-navy-900 text-base leading-snug mb-2 group-hover:text-gold-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-gray-400 gap-3 mt-auto pt-3 border-t border-[#E8E0D0]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 md:mt-14 bg-navy-900 rounded-card px-6 py-8 md:px-8 md:py-10 text-center text-white">
          <h2 className="text-xl md:text-3xl font-display font-bold mb-3">
            Ready to Find Your Property?
          </h2>
          <p className="text-gray-300 text-xs md:text-sm mb-6">
            Browse verified listings across Tamil Nadu — buy, rent, or lease
            your dream property today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/properties" className="btn-primary">
              Browse Properties
            </Link>
            <Link
              href="/sell-your-property"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn font-sans font-medium text-sm border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-navy-900 transition-all duration-200"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
