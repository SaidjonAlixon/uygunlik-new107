"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user.store";

/**
 * Brauzerda skrinshotni 100% bloklab bo‘lmaydi.
 * Bu himoya: PrintScreen / tez skrinshot tugmalari va oynadan chiqishda
 * kontentni qoraytiradi — ko‘p hollarda skrinshot qora chiqadi.
 */
function shouldProtectPath(pathname: string, isLoggedIn: boolean) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth") || pathname.startsWith("/register")) {
    return false;
  }
  if (
    pathname.startsWith("/watch") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/course") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/kalkulyator")
  ) {
    return true;
  }
  return isLoggedIn;
}

export function ScreenshotShield() {
  const pathname = usePathname() || "/";
  const user = useUserStore((s) => s.user);
  const active = shouldProtectPath(pathname, Boolean(user));
  const [blocked, setBlocked] = useState(false);
  const clearTimerRef = useRef<number | null>(null);
  const blockedRef = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const cover = useCallback(
    (ms?: number) => {
      blockedRef.current = true;
      setBlocked(true);
      clearHideTimer();
      if (ms != null && ms > 0) {
        clearTimerRef.current = window.setTimeout(() => {
          blockedRef.current = false;
          setBlocked(false);
          clearTimerRef.current = null;
        }, ms);
      }
    },
    [clearHideTimer]
  );

  const uncover = useCallback(() => {
    clearHideTimer();
    blockedRef.current = false;
    setBlocked(false);
  }, [clearHideTimer]);

  useEffect(() => {
    if (!active) {
      uncover();
      return;
    }

    const isScreenshotChord = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") return true;
      const key = e.key.toLowerCase();
      // Win+Shift+S / Ctrl+Shift+S / Cmd+Shift+3|4|5
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && ["s", "3", "4", "5"].includes(key)) return true;
      if (e.shiftKey && (e.key === "PrintScreen" || e.code === "PrintScreen")) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isScreenshotChord(e)) return;
      e.preventDefault();
      cover(3500);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        cover(3500);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") cover();
      else uncover();
    };

    const onBlur = () => cover();
    const onFocus = () => {
      if (document.visibilityState === "visible") uncover();
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("video, img, canvas, iframe") || t.tagName === "VIDEO" || t.tagName === "IMG")) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onDragStart, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("dragstart", onDragStart, true);
      clearHideTimer();
    };
  }, [active, cover, uncover, clearHideTimer]);

  if (!active || !blocked) return null;

  return (
    <div
      className="screenshot-shield-overlay"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        background: "#000",
        pointerEvents: "none",
      }}
    />
  );
}
