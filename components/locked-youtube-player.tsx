"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  videoId: string;
  startLabel?: string;
  onWatchProgress?: (percent: number) => void;
};

/**
 * Platformada ko'rish: YouTube UI/havolalar bosilmaydi.
 * controls=0 + to'liq overlay + o'z scrubber.
 */
export function LockedYouTubePlayer({ videoId, startLabel, onWatchProgress }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const seekingRef = useRef(false);
  const onProgressRef = useRef(onWatchProgress);
  onProgressRef.current = onWatchProgress;

  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let destroyed = false;
    let player: YTPlayer | null = null;

    setReady(false);
    setStarted(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);

    loadYouTubeAPI().then(() => {
      if (destroyed || !hostRef.current || !window.YT?.Player) return;
      hostRef.current.innerHTML = "";
      const mount = document.createElement("div");
      hostRef.current.appendChild(mount);

      player = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            if (destroyed) return;
            playerRef.current = event.target;
            setReady(true);
            try {
              setDuration(event.target.getDuration() || 0);
            } catch {
              /* ignore */
            }
          },
          onStateChange: (event: { data: number }) => {
            if (destroyed || !window.YT) return;
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) setPlaying(true);
            if (event.data === PAUSED) setPlaying(false);
            if (event.data === ENDED) {
              setPlaying(false);
              onProgressRef.current?.(100);
            }
          },
        },
      }) as YTPlayer;
      playerRef.current = player;
    });

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (!started || !ready) return;
    const timer = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || seekingRef.current) return;
      try {
        const t = p.getCurrentTime() || 0;
        const d = p.getDuration() || 0;
        setCurrent(t);
        if (d > 0) {
          setDuration(d);
          onProgressRef.current?.(Math.min(100, Math.round((t / d) * 100)));
        }
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [started, ready]);

  const handleStart = useCallback(() => {
    setStarted(true);
    try {
      playerRef.current?.playVideo();
      setPlaying(true);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (playing) p.pauseVideo();
      else p.playVideo();
    } catch {
      /* ignore */
    }
  }, [playing]);

  const onSeek = useCallback(
    (pct: number) => {
      const p = playerRef.current;
      if (!p || duration <= 0) return;
      const t = (pct / 100) * duration;
      seekingRef.current = true;
      setCurrent(t);
      try {
        p.seekTo(t, true);
      } catch {
        /* ignore */
      }
      seekingRef.current = false;
    },
    [duration]
  );

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 bg-black select-none">
      {/* Iframe bosilmaydi — barcha interaktivlik overlayda */}
      <div
        ref={hostRef}
        className="absolute inset-0 pointer-events-none [&>div]:!h-full [&>div]:!w-full [&>iframe]:!h-full [&>iframe]:!w-full"
      />

      <div
        className="absolute inset-0 z-20"
        onContextMenu={(e) => e.preventDefault()}
      >
        {!started ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={!ready}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-label={startLabel || "Darsni boshlash"}
          >
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-xl">
              <Play className="h-10 w-10 ml-1 fill-white text-white" />
            </span>
            <span className="relative text-sm font-semibold">
              {!ready ? "Yuklanmoqda…" : startLabel || "Darsni boshlash"}
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="absolute inset-0 bottom-16"
              onClick={togglePlay}
              aria-label={playing ? "Pauza" : "Davom etish"}
            />
            {!playing && (
              <div className="pointer-events-none absolute inset-0 bottom-16 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 shadow-lg">
                  <Play className="h-8 w-8 ml-1 fill-white text-white" />
                </span>
              </div>
            )}

            {/* Platforma scrubber — YouTube pastki tugmalari yashirin + bosilmaydi */}
            <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-3 pt-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="shrink-0 rounded-full p-1.5 text-white hover:bg-white/10"
                  aria-label={playing ? "Pauza" : "Play"}
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 fill-white" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progressPct}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  onPointerDown={() => {
                    seekingRef.current = true;
                  }}
                  onPointerUp={() => {
                    seekingRef.current = false;
                  }}
                  className="yt-seek-locked flex-1 cursor-pointer"
                  style={{ touchAction: "none" }}
                  aria-label="Video progress"
                />
                <span className="w-[78px] shrink-0 text-right text-[11px] tabular-nums text-white/90">
                  {formatTime(current)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .yt-seek-locked {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
          outline: none;
        }
        .yt-seek-locked::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #dc2626;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        }
        .yt-seek-locked::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #dc2626;
          border: 2px solid #fff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
