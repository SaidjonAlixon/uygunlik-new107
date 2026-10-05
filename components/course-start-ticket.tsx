"use client";

import { cn } from "@/lib/utils";

type CourseStartTicketProps = {
  className?: string;
  showMeta?: boolean;
};

export function CourseStartTicket({
  className,
}: CourseStartTicketProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative w-full max-w-[22.5rem] sm:max-w-[27rem]",
          "rounded-lg",
          "bg-[linear-gradient(145deg,#FFFBF2_0%,#FBF0D8_48%,#F3E2C0_100%)]",
          "shadow-[0_10px_28px_-14px_rgba(93,17,17,0.45),0_2px_6px_-2px_rgba(93,17,17,0.12)]",
          "overflow-hidden"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_55%)]"
        />
        <div className="absolute inset-[5px] rounded-md border border-dashed border-[#5D1111]/25 pointer-events-none" />
        <p className="relative px-5 py-4 text-center text-sm font-semibold leading-snug text-[#5D1111] sm:px-8 sm:py-5 sm:text-base">
          Keyingi mavsumga qabul 2027 yil, mart oyida ochiladi
        </p>
      </div>
    </div>
  );
}
