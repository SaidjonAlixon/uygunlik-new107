"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import LessonService from "@/services/lesson.service";
import api from "@/lib/api";
import { Lesson } from "@/types/lesson";
import { isGoogleDriveUrl, convertGoogleDriveUrl, isYouTubeUrl, getYouTubeEmbedUrl } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProgressSaveRef = useRef(0);

  // Timeout for video loading
  useEffect(() => {
    if (loading && videoUrl) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [loading, videoUrl]);

  // PDF ko'rilgan vaqtiga qarab dars foizini oshirish (har 15 soniyada 25%, 50%, 75%, 100%)
  useEffect(() => {
    const pdfUrl = lesson?.pdf_url?.trim() || null;
    const hasPdf = pdfUrl && (isGoogleDriveUrl(pdfUrl) || pdfUrl.startsWith('http'));
    if (!lesson?.id || !hasPdf) return;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const percent = Math.min(100, step * 25);
      api.post('/lesson-progress', { lesson_id: lesson.id, progress_percent: percent }).catch(() => {});
      if (percent >= 100) clearInterval(interval);
    }, 15000);
    return () => clearInterval(interval);
  }, [lesson?.id, lesson?.pdf_url]);

  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      router.push("/auth");
      return;
    }

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let idStr = id as string;
        
        // URL encoded bo'lsa, decode qilish (bir necha marta)
        try {
          while (idStr !== decodeURIComponent(idStr)) {
            idStr = decodeURIComponent(idStr);
          }
        } catch (e) {
          // Decode qilishda xatolik bo'lsa, asl qiymatni ishlatish
        }
        
        // 1. Agar to'g'ridan-to'g'ri YouTube linki bo'lsa (maxfiy/yopiq ham)
        if (isYouTubeUrl(idStr)) {
          const embedUrl = getYouTubeEmbedUrl(idStr);
          if (embedUrl) {
            setVideoUrl(embedUrl);
            setTimeout(() => setLoading(false), 500);
            return;
          }
        }

        // 2. Agar to'g'ridan-to'g'ri Google Drive URL bo'lsa (to'liq yoki qisman)
        if (idStr.includes('drive.google.com') || idStr.includes('/file/d/') || idStr.includes('google.com')) {
          let url = idStr.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
          }
          if (isGoogleDriveUrl(url)) {
            if (!url.includes('/preview')) {
              url = convertGoogleDriveUrl(url);
            }
          }
          setVideoUrl(url);
          // Iframe'ni darhol ko'rsatish uchun loading'ni tez o'chiramiz
          setTimeout(() => {
            setLoading(false);
          }, 1500);
          return;
        }
        
        // 3. Agar Google Drive file ID bo'lsa (faqat ID - 20+ belgi)
        if (idStr.match(/^[a-zA-Z0-9_-]{20,}$/)) {
          const previewUrl = `https://drive.google.com/file/d/${idStr}/preview`;
          setVideoUrl(previewUrl);
          // Iframe'ni darhol ko'rsatish uchun loading'ni tez o'chiramiz
          setTimeout(() => {
            setLoading(false);
          }, 1500);
          return;
        }
        
        // 4. Agar raqam bo'lsa, lesson ID sifatida qidirish (fallback)
        const idNum = parseInt(idStr);
        if (!isNaN(idNum) && idStr.length < 10) { // Faqat qisqa raqamlar lesson ID bo'lishi mumkin
          try {
            const fetchedLesson = await LessonService.findOne(idStr);
            if (!fetchedLesson) {
              setError("Dars topilmadi.");
              setLoading(false);
              return;
            }

            setLesson(fetchedLesson);
            
            // Video URL'ni olish va to'g'ri formatga o'tkazish
            if (!fetchedLesson.video_url || fetchedLesson.video_url.trim() === '') {
              setError("Bu dars uchun video URL mavjud emas.");
              setLoading(false);
              return;
            }
            
            let url = fetchedLesson.video_url.trim();
            if (isYouTubeUrl(url)) {
              const embedUrl = getYouTubeEmbedUrl(url);
              if (embedUrl) url = embedUrl;
            } else if (isGoogleDriveUrl(url)) {
              if (!url.includes('/preview')) url = convertGoogleDriveUrl(url);
            }
            setVideoUrl(url);
            // Iframe'ni darhol ko'rsatish uchun loading'ni tez o'chiramiz
            setTimeout(() => {
              setLoading(false);
            }, 1500);
            return;
          } catch (lessonErr: any) {
            setError("Darsni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
            setLoading(false);
            return;
          }
        }
        
        // 5. Agar hech qanday formatga mos kelmasa
        setError("Noto'g'ri video URL. YouTube, Google Drive havolasi yoki File ID kiriting.");
        setLoading(false);
      } catch (err: any) {
        setError("Videoni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setLoading(false);
      }
    };

    fetchVideo();
  }, [user, userLoading, router, id]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Video yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-red-400">
        <div className="text-center max-w-md px-4">
          <p className="mb-4 text-lg">{error}</p>
          {lesson && (
            <p className="mb-4 text-sm text-gray-500">
              Dars: {lesson.title}
            </p>
          )}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Videoni yangi oynada ochish
            </a>
          )}
          <button
            onClick={() => router.back()}
            className="mt-4 block mx-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">
        <div className="text-center">
          <p className="mb-4 text-lg">Video URL topilmadi.</p>
          {lesson && (
            <p className="mb-4 text-sm text-gray-500">
              Dars: {lesson.title}
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // YouTube video (maxfiy/yopiq link) — embed iframe
  // Qirralarda YouTube’ga o‘tish/ulashish tugmalarini bloklash uchun overlay (faqat video va pleer ishlashi uchun)
  const pdfUrl = lesson?.pdf_url?.trim() || null;
  const pdfIframeSrc = pdfUrl
    ? (isGoogleDriveUrl(pdfUrl) ? convertGoogleDriveUrl(pdfUrl) : pdfUrl)
    : null;

  if (videoUrl.includes('youtube.com/embed')) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center p-4 gap-6">
        <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl bg-black">
          <iframe
            ref={iframeRef}
            key={videoUrl}
            src={videoUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Dars videosi"
            style={{ width: '100%', height: '100%', border: 'none', zIndex: 10 }}
            onLoad={() => setLoading(false)}
          />
          {/* YouTube’dagi kanal, Ulashish, "YouTube’da ko‘rish" va boshqa tugmalarni bosishni bloklash */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-14 pointer-events-auto" aria-hidden />
            <div className="absolute top-0 left-0 bottom-0 w-28 pointer-events-auto" aria-hidden />
            <div className="absolute top-0 right-0 bottom-0 w-28 pointer-events-auto" aria-hidden />
            <div className="absolute bottom-0 left-0 h-14 w-52 pointer-events-auto" aria-hidden />
            <div className="absolute bottom-0 right-0 h-14 w-40 pointer-events-auto" aria-hidden />
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95 z-30 pointer-events-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
              <p className="absolute bottom-8 text-white text-sm">Video yuklanmoqda...</p>
            </div>
          )}
        </div>
        {pdfIframeSrc && (
          <div className="w-full max-w-5xl" style={{ marginTop: '30px' }}>
            <h3 className="text-white font-semibold mb-3">O'quv materiali</h3>
            <iframe
              src={pdfIframeSrc}
              width="100%"
              height={600}
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
              title="O'quv materiali"
            />
          </div>
        )}
      </main>
    );
  }

  // Google Drive video bo'lsa, iframe ko'rsatish
  if (isGoogleDriveUrl(videoUrl)) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center p-4 gap-6">
        <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl bg-black">
          <iframe
            ref={iframeRef}
            key={videoUrl}
            src={videoUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            frameBorder="0"
            allowFullScreen
            loading="eager"
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'black', zIndex: 10 }}
            onLoad={() => setLoading(false)}
            onError={() => setError("Videoni yuklashda xatolik yuz berdi.")}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95 z-30">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
              <p className="text-white text-lg">Video yuklanmoqda...</p>
            </div>
          )}
        </div>
        {pdfIframeSrc && (
          <div className="w-full max-w-5xl" style={{ marginTop: '30px' }}>
            <h3 className="text-white font-semibold mb-3">O'quv materiali</h3>
            <iframe
              src={pdfIframeSrc}
              width="100%"
              height={600}
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
              title="O'quv materiali"
            />
          </div>
        )}
      </main>
    );
  }

  const saveLessonProgress = (percent: number) => {
    if (!lesson?.id) return;
    const p = Math.min(100, Math.max(0, Math.round(percent)));
    api.post('/lesson-progress', { lesson_id: lesson.id, progress_percent: p }).catch(() => {});
  };

  // Oddiy video bo'lsa, video tag ko'rsatish
  return (
    <main className="min-h-screen bg-black flex flex-col items-center p-4 gap-6">
      <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl bg-black">
        <video
          ref={videoRef}
          src={videoUrl.startsWith('http') ? videoUrl : `${API_URL}/video-stream/stream/${videoUrl.split("/").pop()}`}
          className="w-full h-full object-cover"
          controls={true}
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          onLoadedData={() => setLoading(false)}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v?.duration || !lesson?.id) return;
            if (Date.now() - lastProgressSaveRef.current < 5000) return;
            lastProgressSaveRef.current = Date.now();
            saveLessonProgress((v.currentTime / v.duration) * 100);
          }}
          onEnded={() => saveLessonProgress(100)}
          onError={() => {
            setError("Videoni o'ynatishda xatolik yuz berdi.");
            setLoading(false);
          }}
        />
        {/* O'ng-bosishni bloklash */}
        <div
          className="absolute inset-0 pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      {pdfIframeSrc && (
        <div className="w-full max-w-5xl" style={{ marginTop: '30px' }}>
          <h3 className="text-white font-semibold mb-3">O'quv materiali</h3>
          <iframe
            src={pdfIframeSrc}
            width="100%"
            height={600}
            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
            title="O'quv materiali"
          />
        </div>
      )}
    </main>
  );
}
