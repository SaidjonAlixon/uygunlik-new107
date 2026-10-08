"use client";

import { CheckCircle2, ChevronDown, ClipboardCheck, Eye, Lock, MessageSquareText, PlayCircle } from "lucide-react";
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
  /** Izoh majburiy bo‘lsa test tugmasi bu yerda chiqmaydi — u izoh yuborilgach izoh blokida chiqadi */
  feedbackRequired?: boolean;
  feedbackGiven?: boolean;
  onStartQuiz: () => void;
  onWriteFeedback?: () => void;
};

type StepState = "done" | "active" | "locked";

function Step({ index, label, state, icon: Icon }: { index: number; label: string; state: StepState; icon: typeof Eye }) {
  const tone =
    state === "done"
      ? "border-green-500/40 bg-green-500/10 text-green-300"
      : state === "active"
        ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
        : "border-white/10 bg-white/[0.03] text-white/40";
  return (
    <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${tone}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/30 text-xs font-bold">
        {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : index}
      </span>
      <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
      <span className="text-xs font-semibold sm:text-sm">{label}</span>
    </div>
  );
}

export function LessonProgressPanel({
  percent,
  watchedSeconds,
  durationSeconds,
  hasQuiz,
  feedbackRequired = false,
  feedbackGiven = false,
  onStartQuiz,
  onWriteFeedback,
}: Props) {
  const done = percent >= 100;
  const gated = hasQuiz && feedbackRequired;
  const quizOpen = done && (!feedbackRequired || feedbackGiven);
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

        {gated && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Step index={1} label="Darsni to‘liq ko‘rish" icon={Eye} state={done ? "done" : "active"} />
            <Step
              index={2}
              label="Izoh yozish"
              icon={MessageSquareText}
              state={feedbackGiven ? "done" : done ? "active" : "locked"}
            />
            <Step
              index={3}
              label="Testni ishlash"
              icon={ClipboardCheck}
              state={quizOpen ? "active" : "locked"}
            />
          </div>
        )}

        <p className="mt-3 flex items-start gap-2 text-sm">
          {!done ? (
            <>
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
              <span className="text-white/80">
                Darsni yakunlashga <span className="font-semibold text-white">{remainingText}</span> qoldi
                {gated ? " — so‘ng izoh yozasiz va test ochiladi" : ""}
              </span>
            </>
          ) : gated && !feedbackGiven ? (
            <>
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span className="text-amber-200">
                Dars to‘liq ko‘rildi. Endi pastda shu darsga izoh yozing — izoh yuborilgach test ochiladi.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              <span className="text-green-300">
                {gated
                  ? "Dars ko‘rildi va izoh qoldirildi — testni pastdagi tugma orqali boshlang"
                  : `Dars to‘liq ko‘rildi${hasQuiz ? " — test ochildi" : ""}`}
              </span>
            </>
          )}
        </p>
        {!done && (
          <p className="mt-1.5 text-xs text-white/45">
            Faqat haqiqatda ko‘rilgan qismlar hisoblanadi — oldinga o‘tkazib yuborilgan joylar foizga qo‘shilmaydi.
          </p>
        )}

        {gated && done && !feedbackGiven && onWriteFeedback && (
          <button
            type="button"
            onClick={onWriteFeedback}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-base font-bold text-black transition-all hover:bg-amber-300 sm:w-auto"
          >
            <MessageSquareText className="h-5 w-5" />
            Izoh yozish
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {hasQuiz && !feedbackRequired && (
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
            {quizOpen ? "Testni boshlash" : `Test ochilishiga ${remainingText} qoldi`}
          </button>
        )}
      </div>
    </div>
  );
}
