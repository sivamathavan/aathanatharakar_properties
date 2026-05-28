"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";

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

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handlePrevLightbox = () => {
    setLightboxIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNextLightbox = () => {
    setLightboxIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevLightbox();
      if (e.key === "ArrowRight") handleNextLightbox();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, lightboxIndex]);

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
            <div 
              key={item.id || idx} 
              className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer select-none"
              onClick={() => {
                setLightboxIndex(idx);
                setIsLightboxOpen(true);
              }}
            >
              {item.type === "VIDEO" ? (
                <div className="w-full h-full bg-navy-950 flex items-center justify-center relative">
                  <video
                    src={item.url}
                    preload="metadata"
                    className="w-full h-full object-contain z-10 pointer-events-none"
                  />
                  {/* Custom Big Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/25 group-hover:bg-black/35 transition-colors">
                    <div className="w-16 h-16 bg-gold-500/90 text-navy-950 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                      <Play className="w-8 h-8 fill-navy-950 ml-1 text-navy-950" />
                    </div>
                    <span className="absolute bottom-16 text-xs text-gold-300 font-sans tracking-wide bg-black/60 px-3 py-1 rounded-full uppercase font-bold border border-gold-500/10">
                      Click to Play Video
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-navy-950">
                  {/* Blurred backplate */}
                  <Image
                    src={getOptimizedCloudinaryUrl(item.url)}
                    alt=""
                    fill
                    className="object-cover blur-lg opacity-30 scale-110 pointer-events-none"
                    sizes="10vw"
                  />
                  {/* Actual Contain Image */}
                  <Image
                    src={getOptimizedCloudinaryUrl(item.url)}
                    alt={`${title} - view ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    className="object-contain z-10"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                  
                  {/* Expand to Fullscreen hint on desktop hover */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors z-20 flex items-end justify-end p-4">
                    <div className="hidden sm:flex w-10 h-10 bg-navy-950/80 backdrop-blur-md text-gold-500 rounded-full items-center justify-center border border-gold-500/20 shadow-md group-hover:opacity-100 opacity-0 transition-opacity">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )}
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
              {item.type === "VIDEO" ? (
                <div className="w-full h-full bg-navy-950 flex items-center justify-center relative text-white text-[10px] font-bold">
                  {item.thumbnailUrl ? (
                    <Image
                      src={getOptimizedCloudinaryUrl(item.thumbnailUrl)}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover opacity-60"
                      sizes="100px"
                    />
                  ) : (
                    <span>VIDEO</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] text-gold-500 font-bold uppercase tracking-wider">
                    Video
                  </span>
                </div>
              ) : (
                <Image
                  src={getOptimizedCloudinaryUrl(item.thumbnailUrl || item.url)}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              )}
            </button>
          ))}
        </div>
      )}
      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div className="flex justify-between items-center w-full text-white z-50">
            <div className="font-display font-bold text-sm sm:text-base text-gold-500 max-w-[70%] truncate">
              {title}
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 flex items-center justify-center cursor-pointer"
              aria-label="Close fullscreen gallery"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Central Frame */}
          <div className="flex-1 w-full flex items-center justify-center relative my-4">
            
            {/* Left Button */}
            {items.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevLightbox();
                }}
                className="absolute left-2 sm:left-4 z-50 p-3 rounded-full bg-black/60 hover:bg-navy-950 text-gold-500 border border-gold-500/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Item Display */}
            <div 
              className="relative w-full max-w-5xl h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {items[lightboxIndex].type === "VIDEO" ? (
                <video
                  src={items[lightboxIndex].url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] sm:max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl z-30"
                />
              ) : (
                <div className="relative w-full h-full max-h-[70vh] sm:max-h-[80vh] flex items-center justify-center">
                  <Image
                    src={getOptimizedCloudinaryUrl(items[lightboxIndex].url)}
                    alt={`${title} - slide ${lightboxIndex + 1}`}
                    fill
                    className="object-contain z-30"
                    sizes="100vw"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Right Button */}
            {items.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextLightbox();
                }}
                className="absolute right-2 sm:right-4 z-50 p-3 rounded-full bg-black/60 hover:bg-navy-950 text-gold-500 border border-gold-500/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Counter */}
          <div className="text-center text-xs font-sans text-gray-400 z-50 py-2">
            <span className="font-bold text-gold-500">{lightboxIndex + 1}</span> / {items.length} Photos & Videos
          </div>
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
