"use client";

import { useState } from "react";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AgentPortfolioUploadProps {
  initialMedia: { url: string; type: "IMAGE" | "VIDEO" }[];
}

export function AgentPortfolioUpload({ initialMedia }: AgentPortfolioUploadProps) {
  const [media, setMedia] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>(initialMedia);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media }),
      });

      if (res.ok) {
        toast.success("Portfolio updated successfully!");
        router.refresh();
      } else {
        toast.error("Failed to update portfolio");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <CloudinaryUpload 
        onUpload={(newMedia) => setMedia(newMedia)} 
        existingMedia={media}
        maxFiles={10} 
      />
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? "Saving..." : "Save Portfolio"}
        </Button>
      </div>
    </div>
  );
}
