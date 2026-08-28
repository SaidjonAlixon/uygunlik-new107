"use client";

import { useEffect, useState } from "react";
import {
  COURSE_DURATION_WEEKS,
  formatCourseStartLabel,
  getCourseStartDate,
  getTimeRemaining,
} from "@/lib/course-info";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type UnitProps = {
  value: string;
  label: string;
};

function TicketUnit({ value, label }: UnitProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "min-w-[2.55rem] sm:min-w-[3.1rem] px-1.5 py-1.5 sm:py-2",
          "rounded-md bg-[#5D1111]/[0.05] ring-1 ring-[#5D1111]/10",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
        )}
      >
        <span className="block tabular-nums text-lg sm:text-2xl font-bold leading-none tracking-tight text-[#5D1111]">
          {value}
        </span>
      </div>
      <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.16em] text-[#5D1111]/50 font-semibold">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="self-center pb-4 sm:pb-5 flex flex-col gap-1"
    >
      <span className="h-1 w-1 rounded-full bg-[#5D1111]/30" />
      <span className="h-1 w-1 rounded-full bg-[#5D1111]/30" />
    </span>
  );
}

type CourseStartTicketProps = {
  className?: string;
  showMeta?: boolean;
};

export function CourseStartTicket({
  className,
  showMeta = true,
}: CourseStartTicketProps) {
  const startDate = getCourseStartDate();
  const startLabel = formatCourseStartLabel(startDate);
  const [remaining, setRemaining] = useState(() =>
    getTimeRemaining(startDate)
  );

  useEffect(() => {
    const tick = () => setRemaining(getTimeRemaining(getCourseStartDate()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-2 sm:gap-2.5", className)}>
      {showMeta && (
        <ul className="text-[#5D1111] flex items-center flex-col sm:flex-row gap-x-2 gap-y-0.5 text-base sm:text-lg md:text-xl">
          <li className="font-bold">Start:</li>
          <li>{startLabel}</li>
          <li className="font-bold">Davomiyligi:</li>
          <li>{COURSE_DURATION_WEEKS} hafta</li>
        </ul>
      )}

      <div
        className={cn(
          "relative w-full max-w-[22.5rem] sm:max-w-[27rem]",
          "rounded-lg",
          "bg-[linear-gradient(145deg,#FFFBF2_0%,#FBF0D8_48%,#F3E2C0_100%)]",
          "shadow-[0_10px_28px_-14px_rgba(93,17,17,0.45),0_2px_6px_-2px_rgba(93,17,17,0.12)]",
          "overflow-hidden"
        )}
        role="timer"
        aria-live="polite"
        aria-label={`Kurs boshlanishigacha: ${remaining.days} kun, ${remaining.hours} soat, ${remaining.minutes} daqiqa, ${remaining.seconds} soniya`}
      >
        {/* Soft edge glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_55%)]"
        />

        {/* Outer dashed frame */}
        <div className="absolute inset-[5px] rounded-md border border-dashed border-[#5D1111]/25 pointer-events-none" />

        {/* Ticket side notches */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-[42%] -translate-x-1/2 -translate-y-1/2 h-[1.35rem] w-[1.35rem] rounded-full bg-[#FEFBEE] shadow-[inset_-1px_0_0_rgba(93,17,17,0.12)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-[42%] translate-x-1/2 -translate-y-1/2 h-[1.35rem] w-[1.35rem] rounded-full bg-[#FEFBEE] shadow-[inset_1px_0_0_rgba(93,17,17,0.12)]"
        />

        <div className="relative px-5 sm:px-8 pt-2 pb-2.5 sm:pt-2.5 sm:pb-3">
          <div className="mb-2 text-center">
            <span className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5D1111]/55 leading-none">
              <span aria-hidden className="h-px w-4 sm:w-6 bg-[#5D1111]/25" />
              {remaining.isComplete ? "Boshlandi" : "Boshlanishigacha"}
              <span aria-hidden className="h-px w-4 sm:w-6 bg-[#5D1111]/25" />
            </span>
          </div>

          {remaining.isComplete ? (
            <p className="text-center text-sm sm:text-base font-semibold text-[#5D1111] py-2">
              Kurs boshlandi!
            </p>
          ) : (
            <div className="flex items-end justify-center gap-1.5 sm:gap-3">
              <TicketUnit value={String(remaining.days)} label="kun" />
              <Separator />
              <TicketUnit value={pad(remaining.hours)} label="soat" />
              <Separator />
              <TicketUnit value={pad(remaining.minutes)} label="daq" />
              <Separator />
              <TicketUnit value={pad(remaining.seconds)} label="son" />
            </div>
          )}

          <div className="mt-2.5 border-t border-dashed border-[#5D1111]/18 pt-2 text-center">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-[#5D1111]/55">
              <span>
                Start ·{" "}
                <span className="font-semibold text-[#5D1111]/80">
                  {startLabel}
                </span>
              </span>
              <span
                aria-hidden
                className="hidden sm:inline h-1 w-1 rounded-full bg-[#5D1111]/25"
              />
              <span>
                Davomiyligi ·{" "}
                <span className="font-semibold text-[#5D1111]/80">
                  {COURSE_DURATION_WEEKS} hafta
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
