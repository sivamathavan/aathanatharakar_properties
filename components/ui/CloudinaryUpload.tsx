"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

export interface UploadedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
  publicId?: string;
  thumbnailUrl?: string | null;
}

interface CloudinaryUploadProps {
  onUpload: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  existingMedia?: UploadedMedia[];
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function CloudinaryUpload({
  onUpload,
  maxFiles = 10,
  existingMedia = [],
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] =
    useState<UploadedMedia[]>(existingMedia);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return `${file.name}: unsupported file type`;
    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type))
      return `${file.name}: only JPG/PNG/WebP/GIF allowed`;
    if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type))
      return `${file.name}: only MP4/MOV/WebM allowed`;
    if (isImage && file.size > MAX_IMAGE_BYTES)
      return `${file.name}: image larger than 10 MB`;
    if (isVideo && file.size > MAX_VIDEO_BYTES)
      return `${file.name}: video larger than 60 MB`;
    return null;
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    if (!cloudName || !uploadPreset) {
      toast.error("Image upload is not configured. Contact support.");
      if (e.target) e.target.value = "";
      return;
    }

    if (mediaList.length + files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files.`);
      if (e.target) e.target.value = "";
      return;
    }

    for (const f of files) {
      const err = validateFile(f);
      if (err) {
        toast.error(err);
        if (e.target) e.target.value = "";
        return;
      }
    }

    setUploading(true);
    const uploaded: UploadedMedia[] = [];
    let failures = 0;

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const isVideo = file.type.startsWith("video/");

        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            { method: "POST", body: formData }
          );
          const data = await res.json();

          if (!res.ok || !data.secure_url) {
            console.error("Cloudinary error:", data);
            failures += 1;
            continue;
          }

          uploaded.push({
            url: data.secure_url,
            type: isVideo ? "VIDEO" : "IMAGE",
            publicId: data.public_id, // Real Cloudinary public_id
            thumbnailUrl: isVideo
              ? data.secure_url.replace(/\.(mp4|mov|webm)$/i, ".jpg")
              : null,
          });
        } catch (uploadErr) {
          console.error("Upload failed for", file.name, uploadErr);
          failures += 1;
        }
      }

      if (uploaded.length > 0) {
        const updated = [...mediaList, ...uploaded];
        setMediaList(updated);
        onUpload(updated);
        toast.success(
          `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded.`
        );
      }
      if (failures > 0) {
        toast.error(
          `${failures} file${failures === 1 ? "" : "s"} failed to upload.`
        );
      }
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeMedia = (indexToRemove: number) => {
    const updated = mediaList.filter((_, idx) => idx !== indexToRemove);
    setMediaList(updated);
    onUpload(updated);
  };

  return (
    <div className="w-full space-y-4">
      <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center relative hover:bg-gray-100 transition-colors cursor-pointer w-full">
        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
        <h3 className="text-sm font-semibold text-gray-700">
          Click to upload or drag and drop
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, WebP, MP4 — up to {maxFiles} files
        </p>

        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading && (
          <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500 mb-2" />
            <span className="font-medium text-navy-800 text-sm">
              Uploading files...
            </span>
          </div>
        )}
      </label>

      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
          {mediaList.map((media, idx) => (
            <div
              key={`${media.url}-${idx}`}
              className="relative aspect-square rounded-lg overflow-hidden border group bg-gray-100"
            >
              {media.type === "IMAGE" ? (
                <Image
                  src={getOptimizedCloudinaryUrl(media.url)}
                  alt={`Upload ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
              ) : (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}

              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>

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
