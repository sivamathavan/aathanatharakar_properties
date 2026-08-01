"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export interface UploadedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
  publicId?: string;
  thumbnailUrl?: string | null;
}

interface FirebaseUploadProps {
  onUpload: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  existingMedia?: UploadedMedia[];
  storageFolder?: string;
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

export function FirebaseUpload({
  onUpload,
  maxFiles = 10,
  existingMedia = [],
  storageFolder = "media",
}: FirebaseUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>(existingMedia);

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

  const uploadFile = (file: File): Promise<UploadedMedia> => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith("video/");
      const fileExt = file.name.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const storageRef = ref(storage, `${storageFolder}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress logging if needed
        },
        (error) => {
          console.error("Firebase upload failed: ", error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadUrl,
              type: isVideo ? "VIDEO" : "IMAGE",
              publicId: uniqueFileName,
              thumbnailUrl: downloadUrl, // Firebase download URLs serve as thumbnails natively
            });
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

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
    const failureMessages: string[] = [];

    try {
      for (const file of files) {
        try {
          const mediaItem = await uploadFile(file);
          uploaded.push(mediaItem);
        } catch (uploadErr: any) {
          const reason = uploadErr?.message || "Storage error";
          failureMessages.push(`${file.name}: ${reason}`);
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
      if (failureMessages.length > 0) {
        toast.error(failureMessages[0], {
          description:
            failureMessages.length > 1
              ? `${failureMessages.length - 1} more failures. Check connection.`
              : "Check Firebase Storage rules and settings.",
          duration: 8000,
        });
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
              Uploading files to storage...
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
                  src={media.url}
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
