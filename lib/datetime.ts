/** Toshkent vaqti (UTC+5) — barcha sana/vaqt ko‘rsatish uchun */

export const TASHKENT_TZ = 'Asia/Tashkent';

const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

const WEEKDAY_EN_TO_UZ: Record<string, string> = {
  Sunday: 'yakshanba',
  Monday: 'dushanba',
  Tuesday: 'seshanba',
  Wednesday: 'chorshanba',
  Thursday: 'payshanba',
  Friday: 'juma',
  Saturday: 'shanba',
  Sun: 'yakshanba',
  Mon: 'dushanba',
  Tue: 'seshanba',
  Wed: 'chorshanba',
  Thu: 'payshanba',
  Fri: 'juma',
  Sat: 'shanba',
};

function getTashkentParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TASHKENT_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';

  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const weekdayEn = get('weekday');
  let hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  if (hour === '24') hour = '00';

  return {
    year,
    month,
    day,
    weekdayUz: WEEKDAY_EN_TO_UZ[weekdayEn] || weekdayEn.toLowerCase(),
    hour: hour.padStart(2, '0'),
    minute: minute.padStart(2, '0'),
    second: second.padStart(2, '0'),
  };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * DB/API sanasini UTC sifatida o'qiydi.
 * Timezone yo'q timestamp (masalan "2026-07-19 07:48:34") lokal TZ bilan chalkashmasin.
 */
export function parseToDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // "2026-07-19 07:48:34.275" yoki "2026-07-19T07:48:34" — TZ yo'q bo'lsa UTC deb olamiz
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(raw)) {
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const hasTz = /[zZ]|[+-]\d{2}(:?\d{2})?$/.test(normalized);
    const date = new Date(hasTz ? normalized : `${normalized}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Masalan: 12.07.2026, 18:38:24 (Asia/Tashkent) */
export function formatTashkentDateTime(
  value: string | Date | null | undefined,
  options?: { withSeconds?: boolean }
): string {
  const date = parseToDate(value);
  if (!date) return '—';

  const p = getTashkentParts(date);
  const withSeconds = options?.withSeconds ?? true;
  const time = withSeconds
    ? `${p.hour}:${p.minute}:${p.second}`
    : `${p.hour}:${p.minute}`;

  return `${pad2(p.day)}.${pad2(p.month)}.${p.year}, ${time}`;
}

/** Masalan: 12.07.2026 */
export function formatTashkentDate(value: string | Date | null | undefined): string {
  const date = parseToDate(value);
  if (!date) return '—';

  const p = getTashkentParts(date);
  return `${pad2(p.day)}.${pad2(p.month)}.${p.year}`;
}

/**
 * Masalan: yakshanba, 12 iyul 2026-yil, 18:38:24
 */
export function formatTashkentNow(now: Date = new Date()): string {
  const p = getTashkentParts(now);
  const monthName = MONTHS_UZ[p.month - 1];

  return `${p.weekdayUz}, ${p.day} ${monthName} ${p.year}-yil, ${p.hour}:${p.minute}:${p.second}`;
}
