import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  if (url.startsWith('http')) {
    try {
      const parsedUrl = new URL(url);
      
      // Di produksi (atau diakses remote), kita tidak ingin mengakses localhost
      const isLocalhostUrl = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
      const isProduction = process.env.NODE_ENV === 'production' || 
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
      
      if (isLocalhostUrl && isProduction) {
        return parsedUrl.pathname;
      }
    } catch (e) {
      // Abaikan error parsing URL
    }
    return url;
  }
  
  if (url.startsWith('/')) {
    return url;
  }
  
  return `/uploads/${url}`;
}
