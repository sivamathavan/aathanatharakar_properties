"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { trackTap } from "@/components/agent/TapLink";

export function SharePropertyButton({ title, url, agentId, propertyId }: { title: string; url: string; agentId?: string; propertyId?: string }) {
  const handleShare = async () => {
    if (agentId) trackTap("share", agentId, propertyId);
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
        toast.success("Link copied.");
      } catch (err) {
        toast.error("Could not copy the link. Copy it from the address bar.");
      }
    }
  };

  return (
    <Button 
      onClick={handleShare}
      variant="outline" 
      className="w-full border-[#E4DED2] text-navy-700 hover:bg-navy-50 h-11 text-xs font-medium rounded-btn flex items-center justify-center gap-2"
    >
      <Share2 className="w-4 h-4" /> Share This Property
    </Button>
  );
}
