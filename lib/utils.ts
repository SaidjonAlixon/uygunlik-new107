import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Google Drive linkini preview formatiga o'tkazadi
 * @param url - Google Drive file URL
 * @returns Preview URL yoki asl URL
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  // URL ni trim qilish
  url = url.trim();
  
  // Google Drive file ID ni ajratib olish
  // Turli formatlarni qo'llab-quvvatlash:
  // - /file/d/FILE_ID/view
  // - /file/d/FILE_ID/view?usp=drive_link
  // - /file/d/FILE_ID/preview
  // - /file/d/FILE_ID/edit
  // - /file/d/FILE_ID?usp=drive_link
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    // Preview URL formatiga o'tkazish (video o'ynatish uchun)
    // Google Drive preview URL - bu iframe orqali video o'ynatish uchun ishlatiladi
    // Ehtimol muammo shundaki, preview URL ishlamayapti, shuning uchun view formatini ham sinab ko'ramiz
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    return previewUrl;
  }
  
  // Agar allaqachon preview formatida bo'lsa
  if (url.includes('/preview')) {
    return url;
  }
  
  // Agar boshqa format bo'lsa, asl URL ni qaytaradi
  return url;
}

/**
 * Google Drive videoni to'g'ridan-to'g'ri o'ynatish uchun preview URL yaratadi
 * @param url - Google Drive file URL
 * @returns Preview URL yoki null
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : null;
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * URL Google Drive linkini aniqlaydi
 * @param url - URL
 * @returns true agar Google Drive linki bo'lsa
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') && url.includes('/file/d/');
}

/**
 * YouTube linkini aniqlaydi (maxfiy/yopiq linklar ham)
 * @param url - URL
 * @returns true agar YouTube linki bo'lsa
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  return (
    u.includes('youtube.com/watch') ||
    u.includes('youtu.be/') ||
    u.includes('youtube.com/embed/') ||
    u.includes('youtube.com/v/')
  );
}

/**
 * YouTube URL dan embed (iframe) uchun link oladi.
 * Maxfiy/yopiq videolar ham shu formatda o'ynatiladi.
 * @param url - youtube.com/watch?v=ID, youtu.be/ID yoki embed link
 * @returns https://www.youtube.com/embed/VIDEO_ID yoki null
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  let videoId: string | null = null;
  // youtu.be/VIDEO_ID
  const shortMatch = u.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?.*)?$/);
  if (shortMatch && shortMatch[1]) {
    videoId = shortMatch[1];
  }
  // youtube.com/watch?v=VIDEO_ID
  if (!videoId) {
    const watchMatch = u.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) videoId = watchMatch[1];
  }
  // youtube.com/embed/VIDEO_ID yoki youtube.com/v/VIDEO_ID
  if (!videoId) {
    const embedMatch = u.match(/(?:youtube\.com\/(?:embed|v)\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) videoId = embedMatch[1];
  }
  if (!videoId) return null;
  // modestbranding=1 — YouTube logotipini kamaytiradi
  // rel=0 — tugagach boshqa kanal videolari ko‘rsatilmasin (faqat shu kanal)
  // iv_load_policy=3 — annotatsiyalar yopiq
  const params = new URLSearchParams({
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
