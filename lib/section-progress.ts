/** Darsni ko‘rish 90%, izoh qoldirish qolgan 10% — dars faqat ikkalasi bajarilganda 100% hisoblanadi. */
export const WATCH_WEIGHT = 0.9;

export type LessonStep = "watch" | "feedback" | "done";

export function lessonScore(watchPercent: number, feedbackOk: boolean): number {
  const p = Math.max(0, Math.min(100, Number(watchPercent) || 0));
  if (p >= 100 && feedbackOk) return 100;
  return p * WATCH_WEIGHT;
}

export function lessonStep(watchPercent: number, feedbackOk: boolean): LessonStep {
  if ((Number(watchPercent) || 0) < 100) return "watch";
  return feedbackOk ? "done" : "feedback";
}

export function sectionPercent(items: { percent: number; feedbackOk: boolean }[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + lessonScore(item.percent, item.feedbackOk), 0);
  return Math.floor(total / items.length);
}
