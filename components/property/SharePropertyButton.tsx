"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function SharePropertyButton({ title, url }: { title: string, url: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <Button 
      onClick={handleShare}
      variant="outline" 
      className="w-full border-[#E8E0D0] text-navy-700 hover:bg-navy-50 h-11 text-xs font-medium rounded-btn flex items-center justify-center gap-2"
    >
      <Share2 className="w-4 h-4" /> Share This Property
    </Button>
  );
}
