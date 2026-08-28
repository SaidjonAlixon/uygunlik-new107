"use client";

import Link from "next/link";
import { Home, LogOut } from "lucide-react";
import { useUserStore } from "@/store/user.store";
import { cn } from "@/lib/utils";

type PageTopActionsProps = {
  variant?: "light" | "dark";
  showLogout?: boolean;
  className?: string;
};

export function PageTopActions({
  variant = "light",
  showLogout = true,
  className,
}: PageTopActionsProps) {
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    clearUser();
    window.location.href = "/";
  };

  const homeButtonClass =
    variant === "dark"
      ? "border-white/20 bg-black/80 text-white hover:bg-black"
      : "border-[#5D1111]/15 bg-[#FEFBEE]/95 text-[#5D1111] hover:bg-[#FEFBEE]";

  const logoutButtonClass =
    variant === "dark"
      ? "border-red-400/35 bg-red-950/85 text-red-100 hover:bg-red-900"
      : "border-red-300 bg-white/95 text-red-700 hover:bg-red-50";

  return (
    <div
      className={cn(
        "fixed top-3 left-3 right-3 z-[60] flex items-center justify-between gap-3 pointer-events-none",
        className
      )}
    >
      <Link
        href="/"
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-colors",
          homeButtonClass
        )}
      >
        <Home className="h-4 w-4 shrink-0" />
        <span>Asosiy sahifa</span>
      </Link>

      {showLogout && user && (
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Chiqish"
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-sm transition-colors",
            logoutButtonClass
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Chiqish</span>
        </button>
      )}
    </div>
  );
}
