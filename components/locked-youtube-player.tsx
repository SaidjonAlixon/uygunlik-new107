"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import { Maximize, Minimize, Pause, Play } from "lucide-react";

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
  setSize?: (width: number, height: number) => void;
  loadModule?: (module: string) => void;
  unloadModule?: (module: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
};

type OrientationLock = {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
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

/** YouTube avtomatik / CC subtitrlarini o‘chiradi (video ichidagi burned-in ga tegmaydi) */
function disableYouTubeCaptions(player: YTPlayer) {
  try {
    player.unloadModule?.("captions");
    player.unloadModule?.("cc");
    player.setOption?.("captions", "track", {});
  } catch {
    /* ignore */
  }
}

function isMobileLike() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && Math.min(window.innerWidth, window.innerHeight) < 900;
}

function viewportSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? window.innerHeight)),
  };
}

/** Ekranga sig‘adigan eng katta 16:9 (video to‘liq ko‘rinsin, kesilmasin) */
function fitContain16x9(vw: number, vh: number) {
  const screenRatio = vw / vh;
  if (screenRatio > 16 / 9) {
    const height = vh;
    const width = Math.round((height * 16) / 9);
    return { width, height };
  }
  const width = vw;
  const height = Math.round((width * 9) / 16);
  return { width, height };
}

function forceDomFill(root: HTMLElement, width: number, height: number) {
  const host = root.querySelector(".yt-host") as HTMLElement | null;
  if (host) {
    host.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;";
  }

  root.querySelectorAll(".yt-host > div, .yt-host iframe").forEach((node) => {
    const el = node as HTMLElement;
    el.style.setProperty("width", `${width}px`, "important");
    el.style.setProperty("height", `${height}px`, "important");
    el.style.setProperty("max-width", "none", "important");
    el.style.setProperty("max-height", "none", "important");
    el.setAttribute("width", String(width));
    el.setAttribute("height", String(height));
  });
}

function clearDomFill(root: HTMLElement) {
  const host = root.querySelector(".yt-host") as HTMLElement | null;
  if (host) host.style.cssText = "";
  root.querySelectorAll(".yt-host > div, .yt-host iframe").forEach((node) => {
    const el = node as HTMLElement;
    el.style.removeProperty("width");
    el.style.removeProperty("height");
    el.style.removeProperty("max-width");
    el.style.removeProperty("max-height");
  });
}

async function lockLandscape() {
  try {
    const orientation = screen.orientation as OrientationLock | undefined;
    await orientation?.lock?.("landscape");
  } catch {
    /* iOS ruxsat bermaydi */
  }
}

function unlockOrientation() {
  try {
    const orientation = screen.orientation as OrientationLock | undefined;
    orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

type Props = {
  videoId: string;
  startLabel?: string;
  onWatchProgress?: (percent: number) => void;
};

/**
 * Maximize → butun ekran, video to‘liq ko‘rinadi.
 * Minimize → vertikal oddiy oyna.
 * Rotate YO‘Q — burchakda yonboshi bo‘lib qolmasin.
 */
export function LockedYouTubePlayer({ videoId, startLabel, onWatchProgress }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const seekingRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const touchFsRef = useRef(false);
  const fsRef = useRef(false);
  const onProgressRef = useRef(onWatchProgress);
  onProgressRef.current = onWatchProgress;

  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsShellStyle, setFsShellStyle] = useState<CSSProperties | undefined>(undefined);
  const [stageStyle, setStageStyle] = useState<CSSProperties | undefined>(undefined);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2200);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const sizeToContainer = useCallback(() => {
    const player = playerRef.current;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!player?.setSize || !root) return;

    if (fsRef.current) {
      const { w: vw, h: vh } = viewportSize();
      const box = fitContain16x9(vw, vh);
      setFsShellStyle({
        position: "fixed",
        top: 0,
        left: 0,
        width: `${vw}px`,
        height: `${vh}px`,
        zIndex: 2147483000,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "none",
        borderRadius: 0,
        maxWidth: "none",
      });
      setStageStyle({
        position: "relative",
        width: `${box.width}px`,
        height: `${box.height}px`,
        maxWidth: "100%",
        maxHeight: "100%",
        flexShrink: 0,
        background: "#000",
      });
      player.setSize(box.width, box.height);
      // Stage ichidagi DOM ni majburan to‘ldirish
      requestAnimationFrame(() => {
        const stageEl = stageRef.current;
        if (stageEl) forceDomFill(stageEl, box.width, box.height);
      });
      return;
    }

    setFsShellStyle(undefined);
    setStageStyle({ position: "absolute", inset: 0, width: "100%", height: "100%" });
    const rect = (stage ?? root).getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    player.setSize(w, h);
    clearDomFill(stage ?? root);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    sizeToContainer();
    const onResize = () => sizeToContainer();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [isFullscreen, sizeToContainer]);

  useEffect(() => {
    return () => {
      fsRef.current = false;
      document.body.classList.remove("yt-player-fs-open");
      document.documentElement.classList.remove("yt-player-fs-open");
      unlockOrientation();
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;

    fsRef.current = true;
    document.body.classList.add("yt-player-fs-open");
    document.documentElement.classList.add("yt-player-fs-open");

    if (!isMobileLike()) {
      try {
        await el.requestFullscreen?.();
      } catch {
        /* CSS immersive */
      }
    } else {
      await lockLandscape();
    }

    setIsFullscreen(true);
    // state yangilangach o‘lcham
    requestAnimationFrame(() => {
      sizeToContainer();
      setTimeout(() => sizeToContainer(), 100);
      setTimeout(() => sizeToContainer(), 300);
    });
    revealControls();
  }, [revealControls, sizeToContainer]);

  const exitFullscreen = useCallback(async () => {
    fsRef.current = false;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
    document.body.classList.remove("yt-player-fs-open");
    document.documentElement.classList.remove("yt-player-fs-open");
    unlockOrientation();
    setIsFullscreen(false);
    setFsShellStyle(undefined);
    setStageStyle({ position: "absolute", inset: 0, width: "100%", height: "100%" });
    requestAnimationFrame(() => {
      setTimeout(() => sizeToContainer(), 50);
    });
    revealControls();
  }, [revealControls, sizeToContainer]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !isMobileLike() && fsRef.current) {
        fsRef.current = false;
        document.body.classList.remove("yt-player-fs-open");
        document.documentElement.classList.remove("yt-player-fs-open");
        setIsFullscreen(false);
        setFsShellStyle(undefined);
        sizeToContainer();
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [sizeToContainer]);

  const toggleFullscreen = useCallback(
    (e?: SyntheticEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (isFullscreen) void exitFullscreen();
      else void enterFullscreen();
    },
    [isFullscreen, enterFullscreen, exitFullscreen]
  );

  useEffect(() => {
    let destroyed = false;

    setReady(false);
    setStarted(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setControlsVisible(true);

    loadYouTubeAPI().then(() => {
      if (destroyed || !hostRef.current || !window.YT?.Player) return;
      hostRef.current.innerHTML = "";
      const mount = document.createElement("div");
      hostRef.current.appendChild(mount);

      const player = new window.YT.Player(mount, {
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
            disableYouTubeCaptions(event.target);
            setReady(true);
            try {
              setDuration(event.target.getDuration() || 0);
            } catch {
              /* ignore */
            }
            requestAnimationFrame(() => sizeToContainer());
          },
          onStateChange: (event: { data: number }) => {
            if (destroyed || !window.YT) return;
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) {
              setPlaying(true);
              if (playerRef.current) disableYouTubeCaptions(playerRef.current);
              setControlsVisible(true);
              scheduleHideControls();
            }
            if (event.data === PAUSED) {
              setPlaying(false);
              clearHideTimer();
              setControlsVisible(true);
            }
            if (event.data === ENDED) {
              setPlaying(false);
              clearHideTimer();
              setControlsVisible(true);
              onProgressRef.current?.(100);
            }
          },
        },
      }) as YTPlayer;
      playerRef.current = player;
    });

    return () => {
      destroyed = true;
      clearHideTimer();
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, clearHideTimer, scheduleHideControls, sizeToContainer]);

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
      revealControls();
    } catch {
      /* ignore */
    }
  }, [revealControls]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (playing) p.pauseVideo();
      else p.playVideo();
      revealControls();
    } catch {
      /* ignore */
    }
  }, [playing, revealControls]);

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
      revealControls();
    },
    [duration, revealControls]
  );

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;
  const showChrome = !started || controlsVisible || !playing;

  return (
    <div
      ref={rootRef}
      className={`bg-black select-none yt-locked-root ${
        isFullscreen ? "yt-fs-on" : "absolute inset-0"
      }`}
      style={isFullscreen ? fsShellStyle : undefined}
    >
      {/* Video stage — FS da 16:9 markazda, oddiyda to‘liq ota */}
      <div
        ref={stageRef}
        className={isFullscreen ? "yt-stage" : "absolute inset-0"}
        style={stageStyle ?? { position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <div
          ref={hostRef}
          className="absolute inset-0 pointer-events-none yt-host [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!max-w-none"
        />
      </div>

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
              className="absolute inset-0"
              onClick={() => {
                if (!controlsVisible) {
                  revealControls();
                  return;
                }
                togglePlay();
              }}
              aria-label={playing ? "Pauza" : "Davom etish"}
            />
            {showChrome && !playing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-14">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 shadow-lg">
                  <Play className="h-8 w-8 ml-1 fill-white" />
                </span>
              </div>
            )}

            <div
              className={`absolute bottom-0 inset-x-0 z-30 transition-opacity duration-300 ${
                showChrome ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-8 safe-bottom">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
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
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      seekingRef.current = true;
                      clearHideTimer();
                      setControlsVisible(true);
                    }}
                    onPointerUp={() => {
                      seekingRef.current = false;
                      scheduleHideControls();
                    }}
                    className="yt-seek-locked flex-1 cursor-pointer"
                    style={{ touchAction: "none" }}
                    aria-label="Video progress"
                  />
                  <span className="w-[72px] sm:w-[78px] shrink-0 text-right text-[11px] tabular-nums text-white/90">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (touchFsRef.current) {
                        touchFsRef.current = false;
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      toggleFullscreen(e);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      touchFsRef.current = true;
                      toggleFullscreen(e);
                    }}
                    className="shrink-0 rounded-full p-2 text-white hover:bg-white/10 active:bg-white/20"
                    aria-label={isFullscreen ? "Kichik oynaga qaytish" : "Katta ekran"}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" strokeWidth={2.25} />
                    ) : (
                      <Maximize className="h-5 w-5" strokeWidth={2.25} />
                    )}
                  </button>
                </div>
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
        .yt-fs-on .yt-host,
        .yt-fs-on .yt-host > div,
        .yt-fs-on .yt-host iframe {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
        }
        html.yt-player-fs-open,
        body.yt-player-fs-open {
          overflow: hidden !important;
          touch-action: none;
          overscroll-behavior: none;
          height: 100% !important;
        }
        body.yt-player-fs-open .watch-page-header {
          display: none !important;
        }
        .safe-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
