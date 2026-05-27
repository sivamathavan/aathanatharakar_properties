"use client";

import { useState } from "react";
import { Button } from "./button";
import { Loader2, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

interface CloudinaryUploadProps {
  onUpload: (media: { url: string; type: "IMAGE" | "VIDEO" }[]) => void;
  maxFiles?: number;
  existingMedia?: { url: string; type: "IMAGE" | "VIDEO" }[];
}

export function CloudinaryUpload({ onUpload, maxFiles = 10, existingMedia = [] }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>(existingMedia);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    if (mediaList.length + files.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials are not configured correctly.");
      return;
    }

    setUploading(true);
    
    const uploadedMedia: { url: string; type: "IMAGE" | "VIDEO" }[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        // Determine resource type based on file type
        const resourceType = file.type.startsWith("video/") ? "video" : "image";

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        
        if (data.secure_url) {
          uploadedMedia.push({
            url: data.secure_url,
            type: resourceType === "video" ? "VIDEO" : "IMAGE",
          });
        }
      }

      const updatedList = [...mediaList, ...uploadedMedia];
      setMediaList(updatedList);
      onUpload(updatedList);
      
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload some images. Please try again.");
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) e.target.value = "";
    }
  };

  const removeMedia = (indexToRemove: number) => {
    const updatedList = mediaList.filter((_, idx) => idx !== indexToRemove);
    setMediaList(updatedList);
    onUpload(updatedList);
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Upload Button Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center relative hover:bg-gray-100 transition-colors">
        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
        <h3 className="text-sm font-semibold text-gray-700">Click to upload or drag and drop</h3>
        <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. {maxFiles} files)</p>
        
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500 mr-2" />
            <span className="font-medium text-navy-800">Uploading...</span>
          </div>
        )}
      </div>

      {/* Previews */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
          {mediaList.map((media, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group bg-gray-100">
              {media.type === "IMAGE" ? (
                <Image 
                  src={getOptimizedCloudinaryUrl(media.url)} 
                  alt={`Upload ${idx + 1}`} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" />
              )}
              
              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Type Badge */}
              {media.type === "VIDEO" && (
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  VIDEO
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
