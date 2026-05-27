import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Aadana Tharakar Blog`,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { author: true },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  return (
    <div className="bg-[#FDF6EC] min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/blog">
          <Button variant="ghost" className="mb-6 -ml-4 text-gray-600 hover:text-[#E85D24]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Button>
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {post.coverImageUrl && (
            <div className="w-full h-[300px] md:h-[400px]">
              <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-6 md:p-12">
            <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100 gap-6">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> 
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2" /> 
                By {post.author.name}
              </span>
            </div>
            
            {/* Safe HTML rendering for the blog content (from tiptap/rich text) */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-[#1D6A3A] prose-a:text-[#E85D24] prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
