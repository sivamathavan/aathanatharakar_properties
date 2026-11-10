import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Calendar, User, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loadBlogPost } from "@/lib/blog-post";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const post = await loadBlogPost(params.slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title}`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function BlogPostPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const post = await loadBlogPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.coverImageUrl ? [post.coverImageUrl] : [],
    datePublished: post.publishedAtIso,
    dateModified: post.updatedAtIso,
    author: [{ "@type": "Person", name: post.authorName }],
  };

  return (
    <div className="bg-warm-cream min-h-screen py-8 md:py-12 pb-24 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/blog">
          <Button
            variant="ghost"
            className="mb-4 md:mb-6 -ml-4 text-navy-700 hover:text-gold-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Button>
        </Link>

        <div className="bg-white rounded-card shadow-sm border border-[#E4DED2] overflow-hidden">
          {post.coverImageUrl && (
            <div className="w-full h-52 sm:h-64 md:h-[400px]">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-5 md:p-12">
            {post.category && (
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-pill bg-gold-500/15 text-gold-700 mb-3">
                {post.category}
              </span>
            )}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-navy-900 mb-5 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center text-xs md:text-sm text-navy-700 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-[#E4DED2] gap-4 md:gap-6">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gold-600" />
                {new Date(post.publishedAtIso).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gold-600" />
                By {post.authorName}
              </span>
              {post.readTime && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gold-600" />
                  {post.readTime}
                </span>
              )}
            </div>

            <div
              className="prose prose-sm md:prose-lg max-w-none prose-headings:text-navy-900 prose-a:text-gold-700 prose-img:rounded-lg prose-p:text-navy-800 prose-strong:text-navy-900"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
