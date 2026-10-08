export type WatchRange = [number, number];

/** Oxiridagi bir-ikki soniya (titrlar, YouTube kechikishi) to‘liq ko‘rish deb hisoblanadi */
export const COMPLETE_TOLERANCE_SECONDS = 2;
const MERGE_GAP_SECONDS = 0.75;
const MAX_RANGES = 4000;

export function mergeRanges(ranges: WatchRange[]): WatchRange[] {
  const sorted = ranges
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]) => [a, b] as WatchRange)
    .sort((x, y) => x[0] - y[0]);
  const out: WatchRange[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + MERGE_GAP_SECONDS) {
      last[1] = Math.max(last[1], b);
    } else {
      out.push([a, b]);
    }
  }
  return out;
}

export function addWatchedSpan(ranges: WatchRange[], start: number, end: number): WatchRange[] {
  if (!(end > start)) return ranges;
  return mergeRanges([...ranges, [start, end]]);
}

/** Tashqaridan kelgan qiymatni tekshirib, [0, duration] oralig‘iga keltiradi */
export function sanitizeRanges(input: unknown, duration: number): WatchRange[] {
  if (!Array.isArray(input) || input.length > MAX_RANGES) return [];
  const limit = duration > 0 ? duration : Number.POSITIVE_INFINITY;
  const ranges: WatchRange[] = [];
  for (const item of input) {
    if (!Array.isArray(item) || item.length !== 2) continue;
    const a = Math.max(0, Number(item[0]));
    const b = Math.min(limit, Number(item[1]));
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) ranges.push([a, b]);
  }
  return mergeRanges(ranges);
}

export function watchedSeconds(ranges: WatchRange[]): number {
  return ranges.reduce((sum, [a, b]) => sum + (b - a), 0);
}

export function watchPercent(ranges: WatchRange[], duration: number): number {
  if (!(duration > 0)) return 0;
  const seen = watchedSeconds(ranges);
  if (seen >= duration - COMPLETE_TOLERANCE_SECONDS) return 100;
  return Math.min(99, Math.floor((seen / duration) * 100));
}

export function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} soat ${m} daqiqa`;
  if (m > 0) return sec > 0 ? `${m} daqiqa ${sec} soniya` : `${m} daqiqa`;
  return `${sec} soniya`;
}
