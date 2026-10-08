"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, MessageSquareText, Pencil, PlayCircle, Send, Star } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatTashkentDateTime } from "@/lib/datetime";

export type LessonFeedback = {
  rating: number;
  comment: string;
  updated_at?: string;
};

const MAX_COMMENT = 2000;
const RATING_LABELS = ["", "Juda yomon", "Qoniqarsiz", "O‘rtacha", "Yaxshi", "A’lo"];

type Props = {
  lessonId: number;
  mode: "optional" | "required";
  unlocked: boolean;
  feedback: LessonFeedback | null;
  loading: boolean;
  onSaved: (feedback: LessonFeedback) => void;
  hasQuiz?: boolean;
  onStartQuiz?: () => void;
};

function Stars({
  value,
  onChange,
  size = "h-8 w-8",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} yulduz`}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
          className={`rounded-md p-0.5 transition-transform ${onChange ? "hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400" : "cursor-default"}`}
        >
          <Star
            className={`${size} transition-colors ${n <= shown ? "fill-amber-400 text-amber-400" : "text-white/25"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function LessonFeedbackPanel({
  lessonId,
  mode,
  unlocked,
  feedback,
  loading,
  onSaved,
  hasQuiz = false,
  onStartQuiz,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRating(feedback?.rating ?? 0);
    setComment(feedback?.comment ?? "");
    setEditing(false);
  }, [feedback, lessonId]);

  const required = mode === "required";
  const showForm = unlocked && (!feedback || editing);
  const trimmed = comment.trim();
  const canSubmit = rating >= 1 && trimmed.length >= 3 && !saving;

  const submit = async () => {
    if (!canSubmit) {
      toast.error(rating < 1 ? "Iltimos, darsni yulduzlar bilan baholang" : "Izohingizni yozing (kamida 3 ta belgi)");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/lesson-feedback", { lesson_id: lessonId, rating, comment: trimmed });
      const saved = res.data?.feedback;
      onSaved({ rating: saved.rating, comment: saved.comment, updated_at: saved.updated_at });
      toast.success(
        feedback ? "Izohingiz yangilandi" : hasQuiz ? "Rahmat! Izoh qabul qilindi — test ochildi" : "Rahmat! Izoh qabul qilindi"
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Izohni yuborib bo‘lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="lesson-izoh" className="w-full max-w-5xl scroll-mt-4 px-4 sm:px-0 pb-6">
      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          required && unlocked && !feedback && !loading
            ? "border-amber-400/40 bg-amber-400/[0.05]"
            : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Dars bo‘yicha izoh</p>
              <p className="mt-0.5 text-xs text-white/55">
                {required
                  ? hasQuiz
                    ? "Izoh qoldirish majburiy — izohdan so‘ng shu darsning testi ochiladi"
                    : "Bu dars uchun izoh qoldirish majburiy"
                  : "Izohingiz darslarni yanada yaxshilashimizga yordam beradi"}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              required ? "bg-red-600/20 text-red-300 ring-1 ring-red-500/30" : "bg-white/10 text-white/60"
            }`}
          >
            {required ? "Majburiy" : "Ixtiyoriy"}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
          </div>
        ) : !unlocked ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-white/60">
            <Lock className="h-4 w-4 shrink-0" />
            Darsni oxirigacha ko‘rganingizdan so‘ng izoh qoldirishingiz mumkin bo‘ladi.
          </p>
        ) : showForm ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-white/45">Baholang</p>
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={rating} onChange={setRating} />
                {rating > 0 && <span className="text-sm font-medium text-amber-300">{RATING_LABELS[rating]}</span>}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-white/45">Izohingiz</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                rows={4}
                placeholder="Dars sizga nimasi bilan foydali bo‘ldi? Nimani yaxshilash mumkin?"
                className="w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3.5 py-3 text-sm text-white placeholder:text-white/35 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
              <div className="mt-1 text-right text-[11px] tabular-nums text-white/40">
                {comment.length} / {MAX_COMMENT}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                  canSubmit ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-white/10 text-white/50"
                }`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {feedback ? "Saqlash" : "Izohni yuborish"}
              </button>
              {!feedback && required && hasQuiz && (
                <span className="flex items-center gap-1.5 text-xs text-white/50">
                  <Lock className="h-3.5 w-3.5" /> Izoh yuborilgach test ochiladi
                </span>
              )}
              {feedback && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </div>
        ) : feedback ? (
          <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-300">
                <CheckCircle2 className="h-4 w-4" /> Izohingiz qabul qilindi
              </p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" /> Tahrirlash
              </button>
            </div>
            <div className="mt-3">
              <Stars value={feedback.rating} size="h-5 w-5" />
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">
              {feedback.comment}
            </p>
            {feedback.updated_at && (
              <p className="mt-2 text-[11px] text-white/40">{formatTashkentDateTime(feedback.updated_at)}</p>
            )}
            {hasQuiz && onStartQuiz && (
              <button
                type="button"
                onClick={onStartQuiz}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 sm:w-auto"
              >
                <PlayCircle className="h-5 w-5" />
                Testni boshlash
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
