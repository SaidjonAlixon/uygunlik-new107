"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useUserStore } from "@/store/user.store";
import LessonService from "@/services/lesson.service";
import api from "@/lib/api";
import { Lesson } from "@/types/lesson";
import { LockedYouTubePlayer } from "@/components/locked-youtube-player";
import { LessonProgressPanel } from "@/components/lesson-progress-panel";
import { LessonFeedbackPanel, type LessonFeedback } from "@/components/lesson-feedback-panel";
import {
  isGoogleDriveUrl,
  convertGoogleDriveUrl,
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from "@/lib/utils";
import {
  addWatchedSpan,
  mergeRanges,
  watchPercent,
  watchedSeconds,
  type WatchRange,
} from "@/lib/watch-progress";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const SAVE_INTERVAL_MS = 5000;

type WatchState = {
  percent: number;
  ranges: WatchRange[];
  duration: number | null;
  lastPosition: number;
};

const EMPTY_WATCH: WatchState = { percent: 0, ranges: [], duration: null, lastPosition: 0 };

function WatchExitButton({ sectionId }: { sectionId?: number | null }) {
  const href = sectionId ? `/dashboard?section=${sectionId}` : "/dashboard";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Chiqish
    </Link>
  );
}

function WatchLayout({
  sectionId,
  children,
}: {
  sectionId?: number | null;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <header className="watch-page-header sticky top-0 z-[80] shrink-0 border-b border-white/10 bg-black px-3 sm:px-4 py-2.5 sm:py-3">
        <WatchExitButton sectionId={sectionId} />
      </header>
      <div className="flex w-full flex-col items-center gap-4 sm:gap-6 px-0 sm:px-4 py-2 sm:py-4 flex-1">
        {children}
      </div>
    </main>
  );
}

/**
 * Darsning haqiqiy ko‘rilgan soniyalarini yig‘adi va serverga saqlaydi.
 * Foiz = ko‘rilgan soniyalar / video davomiyligi (server ham qayta hisoblaydi).
 */
function useLessonWatch(lessonId: number | null) {
  const [state, setState] = useState<WatchState>(EMPTY_WATCH);
  const [ready, setReady] = useState(false);
  const rangesRef = useRef<WatchRange[]>([]);
  const durationRef = useRef(0);
  const positionRef = useRef(0);
  const serverPercentRef = useRef(0);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const lastSaveAtRef = useRef(0);

  useEffect(() => {
    rangesRef.current = [];
    durationRef.current = 0;
    positionRef.current = 0;
    serverPercentRef.current = 0;
    versionRef.current = 0;
    savedVersionRef.current = 0;
    setState(EMPTY_WATCH);
    setReady(false);
    if (!lessonId) {
      setReady(true);
      return;
    }
    let cancelled = false;
    api
      .get(`/lesson-progress?lessonId=${lessonId}`)
      .then((res) => {
        if (cancelled) return;
        const d = res.data || {};
        const ranges = mergeRanges(Array.isArray(d.watched_ranges) ? d.watched_ranges : []);
        rangesRef.current = ranges;
        durationRef.current = Number(d.duration_seconds) || 0;
        positionRef.current = Number(d.last_position) || 0;
        serverPercentRef.current = Number(d.progress_percent) || 0;
        setState({
          percent: serverPercentRef.current,
          ranges,
          duration: durationRef.current || null,
          lastPosition: positionRef.current,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = useCallback(
    async (keepalive = false) => {
      if (!lessonId || !(durationRef.current > 0)) return;
      if (savingRef.current && !keepalive) {
        pendingSaveRef.current = true;
        return;
      }
      const version = versionRef.current;
      const body = JSON.stringify({
        lesson_id: lessonId,
        watched_ranges: rangesRef.current,
        duration: durationRef.current,
        position: positionRef.current,
      });
      lastSaveAtRef.current = Date.now();

      if (keepalive) {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        fetch("/api/lesson-progress", {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
        }).catch(() => {});
        return;
      }

      savingRef.current = true;
      try {
        const res = await api.post("/lesson-progress", JSON.parse(body));
        const d = res.data || {};
        serverPercentRef.current = Math.max(serverPercentRef.current, Number(d.progress_percent) || 0);
        if (d.accepted) {
          savedVersionRef.current = Math.max(savedVersionRef.current, version);
          if (Array.isArray(d.watched_ranges)) {
            rangesRef.current = mergeRanges([...rangesRef.current, ...d.watched_ranges]);
          }
        }
        setState((prev) => ({
          ...prev,
          ranges: rangesRef.current,
          percent: Math.max(prev.percent, serverPercentRef.current),
        }));
      } catch {
        /* keyingi saqlashda qayta yuboriladi */
      } finally {
        savingRef.current = false;
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          void save();
        }
      }
    },
    [lessonId]
  );

  const onWatchedSpan = useCallback(
    (start: number, end: number, duration: number) => {
      rangesRef.current = addWatchedSpan(rangesRef.current, start, end);
      durationRef.current = Math.max(durationRef.current, duration);
      positionRef.current = end;
      versionRef.current += 1;
      const localPercent = watchPercent(rangesRef.current, durationRef.current);
      const percent = Math.max(serverPercentRef.current, localPercent);
      setState({
        percent,
        ranges: rangesRef.current,
        duration: durationRef.current,
        lastPosition: end,
      });
      const justCompleted = localPercent >= 100 && serverPercentRef.current < 100;
      if (justCompleted || Date.now() - lastSaveAtRef.current >= SAVE_INTERVAL_MS) {
        void save();
      }
    },
    [save]
  );

  const onCheckpoint = useCallback(
    (position: number, duration: number) => {
      if (duration > 0) durationRef.current = Math.max(durationRef.current, duration);
      if (Number.isFinite(position)) positionRef.current = position;
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      void save(hidden);
    },
    [save]
  );

  // Sahifadan chiqib ketilsa saqlanmay qolgan soniyalar yo‘qolmasin
  useEffect(() => {
    return () => {
      if (versionRef.current > savedVersionRef.current) void save(true);
    };
  }, [save]);

  return { ...state, ready, onWatchedSpan, onCheckpoint };
}

function useLessonFeedback(lessonId: number | null) {
  const [data, setData] = useState<LessonFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(null);
    if (!lessonId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    api
      .get(`/lesson-feedback?lessonId=${lessonId}`)
      .then((res) => {
        if (!cancelled) setData(res.data?.feedback ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return { data, loading, setData };
}

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
  const videoTickRef = useRef<{ t: number; at: number } | null>(null);
  const [hasInternalQuiz, setHasInternalQuiz] = useState(false);
  const watch = useLessonWatch(lesson?.id ?? null);
  const feedback = useLessonFeedback(lesson?.id ?? null);

  useEffect(() => {
    if (!lesson?.id) {
      setHasInternalQuiz(false);
      return;
    }
    const own = Array.isArray(lesson.test_questions) && lesson.test_questions.length > 0;
    if (own) {
      setHasInternalQuiz(true);
      return;
    }
    api
      .get(`/lessons/${lesson.id}/quiz`)
      .then(() => setHasInternalQuiz(true))
      .catch(() => setHasInternalQuiz(false));
  }, [lesson?.id, lesson?.test_questions]);

  // Timeout for video loading — qotib qolmasin
  useEffect(() => {
    if (loading && videoUrl) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [loading, videoUrl]);

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
        setVideoUrl(null);
        setLesson(null);

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

  // Faqat video hali yo'q bo'lsa to'liq spinner — qayta ochilganda o'yinchi ochiq qolsin
  if ((loading || userLoading) && !videoUrl) {
    return (
      <WatchLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-white">
          <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Video yuklanmoqda...</p>
        </div>
        </div>
      </WatchLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <WatchLayout sectionId={lesson?.section_id}>
        <div className="flex items-center justify-center min-h-[60vh] text-red-400">
          <div className="text-center max-w-md px-4">
            <p className="mb-4 text-lg">{error}</p>
          {lesson && (
            <p className="mb-4 text-sm text-gray-500">
              Dars: {lesson.title}
            </p>
          )}
          {videoUrl && !isYouTubeUrl(videoUrl) && (
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
      </WatchLayout>
    );
  }

  if (!videoUrl) {
    return (
      <WatchLayout sectionId={lesson?.section_id}>
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
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
      </WatchLayout>
    );
  }

  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const isYouTubeEmbed = Boolean(youtubeVideoId);
  const hasQuiz = Boolean(lesson?.test_url || hasInternalQuiz);
  const feedbackMode = lesson?.feedback_mode === "optional" ? "optional" : "required";
  const feedbackRequired = feedbackMode === "required";
  const feedbackGiven = Boolean(feedback.data);

  const startQuiz = () => {
    if (!lesson || watch.percent < 100 || (feedbackRequired && !feedbackGiven)) return;
    if (hasInternalQuiz) {
      window.open(`/quiz/${lesson.id}`, '_blank');
    } else if (lesson.test_url) {
      window.open(lesson.test_url, '_blank');
    }
  };

  const progressPanel = lesson ? (
    <LessonProgressPanel
      percent={watch.percent}
      watchedSeconds={watchedSeconds(watch.ranges)}
      durationSeconds={watch.duration}
      hasQuiz={hasQuiz}
      feedbackRequired={feedbackRequired}
      feedbackGiven={feedbackGiven}
      onStartQuiz={startQuiz}
      onWriteFeedback={() =>
        document.getElementById("lesson-izoh")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    />
  ) : null;

  const feedbackPanel = lesson ? (
    <LessonFeedbackPanel
      lessonId={lesson.id}
      mode={feedbackMode}
      unlocked={watch.percent >= 100}
      feedback={feedback.data}
      loading={feedback.loading}
      onSaved={feedback.setData}
      hasQuiz={hasQuiz}
      onStartQuiz={startQuiz}
    />
  ) : null;

  if (isYouTubeEmbed && youtubeVideoId) {
    return (
      <WatchLayout sectionId={lesson?.section_id}>
        <div className="w-full max-w-5xl aspect-video relative rounded-none sm:rounded-xl overflow-hidden shadow-2xl bg-black mt-0 sm:mt-1">
          {watch.ready && (
            <LockedYouTubePlayer
              videoId={youtubeVideoId}
              startLabel={
                watch.percent >= 100
                  ? "Qayta ko'rish"
                  : watch.lastPosition > 3
                    ? "Davom ettirish"
                    : "Darsni boshlash"
              }
              resumeAt={watch.percent >= 100 ? 0 : watch.lastPosition}
              watchedRanges={watch.ranges}
              onWatchedSpan={watch.onWatchedSpan}
              onCheckpoint={watch.onCheckpoint}
            />
          )}
        </div>
        {progressPanel}
        {feedbackPanel}
      </WatchLayout>
    );
  }

  // Google Drive video bo'lsa, iframe ko'rsatish
  if (isGoogleDriveUrl(videoUrl)) {
    return (
      <WatchLayout sectionId={lesson?.section_id}>
        <div className="w-full max-w-5xl aspect-video relative rounded-none sm:rounded-xl overflow-hidden shadow-2xl bg-black mt-0 sm:mt-1">
          <iframe
            ref={iframeRef}
            key={videoUrl}
            src={videoUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            frameBorder="0"
            loading="eager"
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'black', zIndex: 10 }}
            onLoad={() => setLoading(false)}
            onError={() => setError("Videoni yuklashda xatolik yuz berdi.")}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 pointer-events-none">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
            </div>
          )}
        </div>
        {progressPanel}
        {feedbackPanel}
      </WatchLayout>
    );
  }

  // Oddiy video bo'lsa, video tag ko'rsatish
  return (
    <WatchLayout sectionId={lesson?.section_id}>
      <div className="w-full max-w-5xl aspect-video relative rounded-none sm:rounded-xl overflow-hidden shadow-2xl bg-black mt-0 sm:mt-1">
        <video
          ref={videoRef}
          src={videoUrl.startsWith('http') ? videoUrl : `${API_URL}/video-stream/stream/${videoUrl.split("/").pop()}`}
          className="w-full h-full object-contain bg-black"
          controls={true}
          controlsList="nodownload"
          disablePictureInPicture
          playsInline
          onLoadedData={() => setLoading(false)}
          onSeeking={() => {
            videoTickRef.current = null;
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v?.duration || !lesson?.id) return;
            const now = performance.now();
            const prev = videoTickRef.current;
            videoTickRef.current = { t: v.currentTime, at: now };
            if (!prev || v.seeking) return;
            const advanced = v.currentTime - prev.t;
            const wall = (now - prev.at) / 1000;
            if (advanced > 0 && advanced <= wall * 1.25 + 0.75) {
              watch.onWatchedSpan(prev.t, v.currentTime, v.duration);
            }
          }}
          onPause={() => {
            const v = videoRef.current;
            if (v) watch.onCheckpoint(v.currentTime, v.duration || 0);
          }}
          onEnded={() => {
            const v = videoRef.current;
            if (v) watch.onCheckpoint(v.duration, v.duration);
          }}
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
      {progressPanel}
      {feedbackPanel}
    </WatchLayout>
  );
}
