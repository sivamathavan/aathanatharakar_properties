"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "VIDEO";
}

interface PropertyGalleryProps {
  media: MediaItem[];
  title: string;
}

export function PropertyGallery({ media, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = media && media.length > 0 ? media : [
    {
      id: "placeholder",
      url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      thumbnailUrl: null,
      type: "IMAGE" as const
    }
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * clientWidth,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Slider / Desktop Main Frame */}
      <div className="relative w-full h-[260px] sm:h-[400px] md:h-[500px] bg-navy-50 rounded-xl overflow-hidden shadow-inner group">
        
        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {items.map((item, idx) => (
            <div key={item.id || idx} className="w-full h-full flex-shrink-0 snap-center relative">
              <Image
                src={item.url}
                alt={`${title} - view ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          ))}
        </div>

        {/* Floating Indicator Badges */}
        <div className="absolute top-4 right-4 bg-navy-950/80 backdrop-blur-md px-3 py-1 rounded-pill text-xs font-sans font-bold text-gold-500 z-10 border border-gold-500/20 shadow-md">
          {activeIndex + 1} / {items.length} Photos
        </div>

        {/* Mobile Swipe Indicator Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToImage(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-200 ${
                  idx === activeIndex 
                    ? "w-6 bg-gold-500" 
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Thumbnails Grid (Hidden on Mobile) */}
      {items.length > 1 && (
        <div className="hidden sm:grid grid-cols-6 gap-3 mt-4 overflow-x-auto">
          {items.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => scrollToImage(idx)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex 
                  ? "border-gold-500 scale-95 shadow-sm" 
                  : "border-[#E8E0D0] hover:border-navy-200"
              }`}
            >
              <Image
                src={item.thumbnailUrl || item.url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
