'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export interface DarsMaterialiPdfCardProps {
  /** Google Drive PDF havolasi (masalan: https://drive.google.com/file/d/FILE_ID/view?usp=sharing) */
  pdfUrl: string | null | undefined;
  /** Sarlavha (ixtiyoriy) */
  title?: string;
  /** Card uchun qo‘shimcha class */
  className?: string;
  /** true bo‘lsa, platforma proxy orqali (login so‘ramaydi); false bo‘lsa, to‘g‘ridan-to‘g‘ri /preview */
  useProxy?: boolean;
}

export function DarsMaterialiPdfCard({ pdfUrl, title = "Dars materiali (PDF)", className, useProxy = false }: DarsMaterialiPdfCardProps) {
  const fileId = pdfUrl ? (pdfUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null) : null;
  const previewUrl = fileId
    ? useProxy
      ? `/api/pdf-proxy?id=${encodeURIComponent(fileId)}`
      : `https://drive.google.com/file/d/${fileId}/preview`
    : null;

  if (!pdfUrl?.trim()) {
    return null;
  }

  return (
    <Card className={className ?? 'w-full max-w-md bg-slate-900 border-slate-800'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {previewUrl ? (
          <div className="relative w-full aspect-[4/3] bg-white rounded-b-lg overflow-hidden min-h-[300px]">
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[300px] border-0"
              title={title}
              allow="autoplay; fullscreen"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        ) : (
          <div className="p-4 rounded-b-lg bg-slate-800/50 border-t border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Google Drive havolasi to‘g‘ri emas yoki file ID topilmadi.</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Yangi oynada ochish
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
