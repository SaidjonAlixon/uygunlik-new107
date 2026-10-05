"use client";

import { scriptFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type CourseStartTicketProps = {
  className?: string;
  showMeta?: boolean;
};

export function CourseStartTicket({
  className,
}: CourseStartTicketProps) {
  return (
    <div className={cn("flex w-full max-w-[23rem] flex-col items-center sm:max-w-[28rem]", className)}>
      <div
        className={cn(
          "relative w-full",
          "rounded-[1.15rem]",
          "bg-[linear-gradient(180deg,#FFFCF7_0%,#FBF4E6_52%,#F3E3C6_100%)]",
          "shadow-[0_18px_36px_-22px_rgba(93,17,17,0.5),0_1px_0_rgba(255,255,255,0.7)_inset]",
          "px-6 py-4 sm:px-8 sm:py-5"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.15rem] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.7),transparent_58%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[6px] rounded-[0.9rem] border border-[#C6A36A]/80"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[10px] rounded-[0.72rem] border border-dashed border-[#5D1111]/18"
        />

        <div className="relative flex flex-col items-center text-center">
          <p className={cn("text-[1.35rem] leading-none text-[#8B3A3A] sm:text-[1.65rem]", scriptFont.className)}>
            Keyingi mavsum
          </p>
          <span className="my-2 flex items-center gap-2 sm:my-2.5" aria-hidden>
            <span className="h-px w-7 bg-gradient-to-r from-transparent to-[#C6A36A] sm:w-10" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#8B2E2E]" />
            <span className="h-px w-7 bg-gradient-to-l from-transparent to-[#C6A36A] sm:w-10" />
          </span>
          <p className="font-serif text-[0.95rem] font-medium leading-snug tracking-[0.01em] text-[#5D1111] sm:text-[1.05rem]">
            Qabul <span className="font-semibold">2027-yil, mart</span> oyida ochiladi
          </p>
        </div>
      </div>
    </div>
  );
}
