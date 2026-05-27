import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOptimizedCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80';
  
  if (url.includes('res.cloudinary.com') && !url.includes('q_auto')) {
    // If it's a Cloudinary upload URL, inject q_auto,f_auto
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/q_auto,f_auto/${parts[1]}`;
    }
  }
  return url;
}
