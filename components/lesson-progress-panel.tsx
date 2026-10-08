"use client";

import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { formatRemaining } from "@/lib/watch-progress";

function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

type Props = {
  percent: number;
  watchedSeconds: number;
  durationSeconds: number | null;
  hasQuiz: boolean;
  /** Izoh majburiy va hali qoldirilmagan — test izohdan keyin ochiladi */
  feedbackPending?: boolean;
  onStartQuiz: () => void;
};

export function LessonProgressPanel({
  percent,
  watchedSeconds,
  durationSeconds,
  hasQuiz,
  feedbackPending = false,
  onStartQuiz,
}: Props) {
  const done = percent >= 100;
  const quizOpen = done && !feedbackPending;
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : null;
  const seen = duration ? Math.min(duration, Math.max(watchedSeconds, (duration * percent) / 100)) : 0;
  const remaining = duration ? Math.max(0, duration - seen) : null;
  const remainingText = remaining != null && remaining > 0 ? formatRemaining(remaining) : `${100 - percent}%`;

  return (
    <div className="w-full max-w-5xl px-4 sm:px-0">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Darsni ko‘rish</p>
            <p className="mt-0.5 text-xs text-white/55">
              {duration
                ? `Ko‘rildi: ${formatClock(seen)} / ${formatClock(duration)}`
                : "Videoni boshlang — ko‘rilgan vaqt shu yerda hisoblanadi"}
            </p>
          </div>
          <span
            className={`text-3xl font-bold tabular-nums leading-none ${done ? "text-green-400" : "text-white"}`}
          >
            {percent}%
          </span>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${done ? "bg-green-500" : "bg-red-600"}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm">
          {done ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              <span className="text-green-300">
                Dars to‘liq ko‘rildi
                {hasQuiz ? (feedbackPending ? " — testni ochish uchun quyida izoh qoldiring" : " — test ochildi") : ""}
              </span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 shrink-0 text-white/50" />
              <span className="text-white/80">
                {hasQuiz ? "Test ochilishiga" : "Darsni yakunlashga"}{" "}
                <span className="font-semibold text-white">{remainingText}</span> qoldi
              </span>
            </>
          )}
        </p>
        {!done && (
          <p className="mt-1.5 text-xs text-white/45">
            Faqat haqiqatda ko‘rilgan qismlar hisoblanadi — oldinga o‘tkazib yuborilgan joylar foizga qo‘shilmaydi.
          </p>
        )}

        {hasQuiz && (
          <button
            type="button"
            onClick={onStartQuiz}
            disabled={!quizOpen}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all sm:w-auto ${
              quizOpen
                ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
                : "cursor-not-allowed bg-white/10 text-white/45"
            }`}
          >
            {quizOpen ? <PlayCircle className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            {quizOpen
              ? "Testni boshlash"
              : done
                ? "Test ochilishi uchun izoh qoldiring"
                : `Test ochilishiga ${remainingText} qoldi`}
          </button>
        )}
      </div>
    </div>
  );
}
