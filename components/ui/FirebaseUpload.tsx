"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UploadedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
  path?: string | null;
}

interface FirebaseUploadProps {
  onUpload: (media: UploadedMedia[]) => void;
  /** Storage folder, e.g. `properties/{uid}`. Must match storage.rules. */
  storageFolder: string;
  maxFiles?: number;
  existingMedia?: UploadedMedia[];
  allowVideo?: boolean;
}

const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const MAX_EDGE = 1600;

/** Resize to at most 1600px and re-encode as JPEG (~200 KB). Keeps hosting costs low. */
export async function compressImage(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function FirebaseUpload({ onUpload, storageFolder, maxFiles = 10, existingMedia = [], allowVideo = false }: FirebaseUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>(existingMedia);

  const update = (next: UploadedMedia[]) => {
    setMediaList(next);
    onUpload(next);
  };

  const validate = (file: File): string | null => {
    const isImage = /^image\/(jpeg|png|webp|heic|heif)$/.test(file.type);
    const isVideo = /^video\/(mp4|quicktime|webm)$/.test(file.type);
    if (isVideo && !allowVideo) return `${file.name}: only photos can be uploaded`;
    if (!isImage && !isVideo) return `${file.name}: use a JPG, PNG or WebP photo`;
    if (isImage && file.size > MAX_SOURCE_IMAGE_BYTES) return `${file.name}: photo is larger than 20 MB`;
    if (isVideo && file.size > MAX_VIDEO_BYTES) return `${file.name}: video is larger than 60 MB`;
    return null;
  };

  const uploadOne = async (file: File): Promise<UploadedMedia> => {
    const isVideo = file.type.startsWith("video/");
    const body = isVideo ? file : await compressImage(file);
    const ext = isVideo ? file.name.split(".").pop() || "mp4" : body === file ? file.name.split(".").pop() || "jpg" : "jpg";
    const path = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const contentType = isVideo ? file.type : body === file ? file.type : "image/jpeg";
    const snap = await uploadBytes(ref(storage, path), body, { contentType, cacheControl: "public,max-age=31536000" });
    return { url: await getDownloadURL(snap.ref), type: isVideo ? "VIDEO" : "IMAGE", path };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    input.value = "";
    if (files.length === 0) return;
    if (mediaList.length + files.length > maxFiles) {
      toast.error(`You can add up to ${maxFiles} photos on your plan.`);
      return;
    }
    for (const f of files) {
      const err = validate(f);
      if (err) return void toast.error(err);
    }

    const uploaded: UploadedMedia[] = [];
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      setUploading(`Uploading ${i + 1} of ${files.length}…`);
      try {
        uploaded.push(await uploadOne(files[i]));
      } catch (err) {
        console.error("Upload failed", err);
        failed++;
      }
    }
    setUploading(null);
    if (uploaded.length) update([...mediaList, ...uploaded]);
    if (failed) toast.error(`${failed} file${failed === 1 ? "" : "s"} could not be uploaded. Check your connection and try again.`);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...mediaList];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  return (
    <div className="w-full space-y-4">
      <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center relative hover:bg-gray-100 transition-colors cursor-pointer w-full">
        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
        <span className="text-sm font-semibold text-gray-700">Tap to add photos</span>
        <span className="text-xs text-gray-500 mt-1">
          {mediaList.length} of {maxFiles} added · photos are resized automatically
        </span>
        <input
          type="file"
          multiple
          accept={allowVideo ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*"}
          className="sr-only"
          onChange={handleFileChange}
          disabled={!!uploading}
        />
        {uploading && (
          <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500 mb-2" />
            <span className="font-medium text-navy-800 text-sm">{uploading}</span>
          </div>
        )}
      </label>

      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {mediaList.map((media, idx) => (
            <div key={`${media.url}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
              {media.type === "IMAGE" ? (
                <Image src={media.url} alt={`Photo ${idx + 1}`} fill className="object-cover" sizes="200px" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover" muted playsInline />
              )}
              {idx === 0 && <span className="absolute top-1 left-1 bg-navy-900 text-gold-500 text-[10px] font-bold px-1.5 py-0.5 rounded">COVER</span>}
              <button type="button" onClick={() => update(mediaList.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1" aria-label={`Remove photo ${idx + 1}`}>
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 inset-x-1 flex justify-between">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="bg-white/90 rounded p-1 disabled:opacity-30" aria-label="Move earlier">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === mediaList.length - 1} className="bg-white/90 rounded p-1 disabled:opacity-30" aria-label="Move later">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
