export const DAY_COUNT = 40;

export const MONTHS = [
  { key: "01", name: "Yanvar" },
  { key: "02", name: "Fevral" },
  { key: "03", name: "Mart" },
  { key: "04", name: "Aprel" },
  { key: "05", name: "May" },
  { key: "06", name: "Iyun" },
  { key: "07", name: "Iyul" },
  { key: "08", name: "Avgust" },
  { key: "09", name: "Sentabr" },
  { key: "10", name: "Oktabr" },
  { key: "11", name: "Noyabr" },
  { key: "12", name: "Dekabr" },
] as const;

export type MonthKey = (typeof MONTHS)[number]["key"];

export function monthName(key: string): string {
  return MONTHS.find((month) => month.key === key)?.name || "Yanvar";
}

export function monthKeyFromIso(iso: string): MonthKey {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso);
  const key = match?.[2];
  return MONTHS.some((month) => month.key === key) ? (key as MonthKey) : "01";
}
export const TEMP_MIN = 35.5;
export const TEMP_MAX = 37.4;

export const FACTORS = [
  { code: "YT", excel: "YT", label: "Yangi termometr" },
  { code: "K", excel: "K", label: "Kech o‘lchash" },
  { code: "V", excel: "V", label: "Vaqtli" },
  { code: "X", excel: "X", label: "Xastalik" },
  { code: "BK", excel: "BK", label: "Bezovta kecha" },
  { code: "S", excel: "S", label: "Safar/Sayohat" },
  { code: "T", excel: "T", label: "Ta’til" },
  { code: "Y", excel: "Y", label: "Sistit/Yallig‘lanish" },
  { code: "D", excel: "D", label: "Dori" },
  { code: "B", excel: "B", label: "Boshqa sabab" },
] as const;

const LEGACY_FACTORS: Record<string, string> = {
  "НТ": "YT",
  "П": "K",
  "Р": "V",
  "ПС": "X",
  "БН": "BK",
  "Д": "S",
  "О": "T",
  "Ц": "Y",
  "М": "B",
  "Л": "D",
  "С": "B",
  E: "V",
  OY: "X",
  BU: "BK",
  SF: "S",
  TT: "T",
  SI: "Y",
  KD: "B",
  DV: "D",
  ST: "B",
};

export type FactorCode = (typeof FACTORS)[number]["code"];

export function factorExcelCode(code: string): string {
  return FACTORS.find((factor) => factor.code === code)?.excel ?? code;
}

export const MUCUS_OPTIONS = [
  { key: "menstruation", label: "Hayz ko‘rish", group: "hayz" },
  { key: "spotting", label: "Qonli ajralma", group: "hayz" },
  { key: "dry", label: "Quruqlik hissi", group: "quruq" },
  { key: "colorUnclear", label: "Rang aniqlanmadi", group: "quruq" },
  { key: "moist", label: "Namlik hissi", group: "nam" },
  { key: "white", label: "Oq rangli ajralma", group: "nam" },
  { key: "cloudy", label: "Loyqa", group: "nam" },
  { key: "creamy", label: "Quyuq, qaymoqsimon", group: "nam" },
  { key: "sticky", label: "Yopishqoq", group: "nam" },
  { key: "lumpy", label: "Bo‘lakchali yoki quyuq", group: "nam" },
  { key: "wet", label: "Ho‘llik hissi", group: "hol" },
  { key: "slippery", label: "Sirpanchiq / moysimon", group: "hol" },
  { key: "semiClear", label: "Yarim tiniq", group: "hol" },
  { key: "clear", label: "Tiniq", group: "hol" },
  { key: "stretchy", label: "Cho‘ziluvchan", group: "hol" },
  { key: "eggwhite", label: "Xom tuxum oqiga o‘xshash", group: "hol" },
] as const;

export type MucusKey = (typeof MUCUS_OPTIONS)[number]["key"];

const SECRETION_KEYS = new Set<MucusKey>([
  "moist",
  "white",
  "cloudy",
  "creamy",
  "sticky",
  "lumpy",
  "wet",
  "slippery",
  "semiClear",
  "clear",
  "stretchy",
  "eggwhite",
]);

export interface DayEntry {
  date: string;
  temperature: number | null;
  factors: string[];
  mucus: MucusKey[];
  amount: number | null;
  peakMucus: boolean;
  firmness: "" | "hard" | "soft";
  position: "" | "low" | "high";
  opening: "" | "closed" | "open";
  mood: "" | "+" | "-";
  pain: boolean;
  bloating: boolean;
  breast: boolean;
  other: string;
  intercourse: boolean;
  fertile: boolean;
  note: string;
  saved: boolean;
}

export interface ObservationCard {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  cardNumber: string;
  cycleNumber: string;
  previousRise: "" | "ha" | "yoq";
  longestCycle: string;
  shortestCycle: string;
  measureTime: string;
  measureMethod: "" | "oral" | "rectal" | "vaginal";
  startDate: string;
  peakMucusDay: string;
  peakMucusPlus3: string;
  peakCervixPlus3: string;
  cycleLength: string;
  firstMucusDay: string;
  firstCervixDay: string;
  thirdRiseDay: string;
  lastInfertileDay: string;
  activeMonth: string;
  months: Record<string, { startDate: string; days: DayEntry[] }>;
  days: DayEntry[];
  updatedAt?: string;
}

export interface DerivedStats {
  peakMucusDay: number | null;
  peakMucusPlus3: number | null;
  firstMucusDay: number | null;
  firstCervixDay: number | null;
  thirdRiseDay: number | null;
  cycleLength: number | null;
  coverline: number | null;
}

export function emptyDay(): DayEntry {
  return {
    date: "",
    temperature: null,
    factors: [],
    mucus: [],
    amount: null,
    peakMucus: false,
    firmness: "",
    position: "",
    opening: "",
    mood: "",
    pain: false,
    bloating: false,
    breast: false,
    other: "",
    intercourse: false,
    fertile: false,
    note: "",
    saved: false,
  };
}

export function createEmptyCard(id: string): ObservationCard {
  return {
    id,
    firstName: "",
    lastName: "",
    age: "",
    cardNumber: "",
    cycleNumber: "",
    previousRise: "",
    longestCycle: "",
    shortestCycle: "",
    measureTime: "",
    measureMethod: "",
    startDate: "",
    peakMucusDay: "",
    peakMucusPlus3: "",
    peakCervixPlus3: "",
    cycleLength: "",
    firstMucusDay: "",
    firstCervixDay: "",
    thirdRiseDay: "",
    lastInfertileDay: "",
    activeMonth: "01",
    months: {},
    days: Array.from({ length: DAY_COUNT }, () => emptyDay()),
  };
}

export function cloneDays(days: DayEntry[]): DayEntry[] {
  return days.map((day) => ({ ...day, factors: [...day.factors], mucus: [...day.mucus] }));
}

export function rememberMonth(card: ObservationCard): ObservationCard {
  const activeMonth = MONTHS.some((month) => month.key === card.activeMonth) ? card.activeMonth : "01";
  return {
    ...card,
    activeMonth,
    months: {
      ...card.months,
      [activeMonth]: { startDate: card.startDate, days: cloneDays(card.days) },
    },
  };
}

export function openMonth(card: ObservationCard, key: string): ObservationCard {
  const saved = rememberMonth(card);
  const activeMonth = MONTHS.some((month) => month.key === key) ? key : "01";
  const found = saved.months[activeMonth];
  return {
    ...saved,
    activeMonth,
    startDate: found?.startDate || "",
    days: found ? cloneDays(found.days) : Array.from({ length: DAY_COUNT }, () => emptyDay()),
  };
}

export function monthIsFilled(card: ObservationCard, key: string): boolean {
  const days = key === card.activeMonth ? card.days : card.months[key]?.days;
  return Boolean(days?.some(dayHasData));
}

export function parseTemperature(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!text) return null;
  if (!/^\d{2}(\.\d{1,2})?$/.test(text)) return null;
  const value = Math.round(Number(text) * 100) / 100;
  if (!Number.isFinite(value)) return null;
  const steps = Math.round(value * 20);
  if (Math.abs(steps / 20 - value) > 0.001) return null;
  if (value < TEMP_MIN - 0.001 || value > TEMP_MAX + 0.001) return null;
  return value;
}

export function formatTemperature(value: number | null): string {
  if (value == null) return "";
  return value.toFixed(2);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

export function applyStartDate(card: ObservationCard, startDate: string): ObservationCard {
  return rememberMonth({
    ...card,
    startDate,
    days: card.days.map((day, index) => ({
      ...day,
      date: startDate ? addDays(startDate, index) : day.date,
    })),
  });
}

export function dayHasData(day: DayEntry): boolean {
  return Boolean(
    day.temperature != null ||
      day.factors.length ||
      day.mucus.length ||
      day.amount ||
      day.peakMucus ||
      day.firmness ||
      day.position ||
      day.opening ||
      day.mood ||
      day.pain ||
      day.bloating ||
      day.breast ||
      day.other ||
      day.intercourse ||
      day.fertile ||
      day.note
  );
}

function firstIndex(flags: boolean[]): number | null {
  const index = flags.findIndex(Boolean);
  return index >= 0 ? index + 1 : null;
}

export function deriveStats(card: ObservationCard): DerivedStats {
  const temps = card.days.map((day) => day.temperature);
  const peakIndex = card.days.findIndex((day) => day.peakMucus);
  const peakMucusDay = peakIndex >= 0 ? peakIndex + 1 : null;
  const firstMucusDay = firstIndex(
    card.days.map((day) => day.mucus.some((key) => SECRETION_KEYS.has(key)))
  );
  const firstCervixDay = firstIndex(
    card.days.map((day) => Boolean(day.firmness || day.position || day.opening))
  );

  let thirdRiseDay: number | null = null;
  let coverline: number | null = null;
  for (let i = 6; i <= temps.length - 3; i++) {
    const previous = temps.slice(i - 6, i);
    if (previous.some((temp) => temp == null)) continue;
    const maxPrev = Math.max(...(previous as number[]));
    const next = temps.slice(i, i + 3);
    if (next.some((temp) => temp == null)) continue;
    const highs = next as number[];
    const allAbove = highs.every((temp) => temp > maxPrev);
    const thirdClear = highs[2] >= maxPrev + 0.2 - 0.001;
    if (allAbove && thirdClear) {
      thirdRiseDay = i + 3;
      coverline = Math.round((maxPrev + 0.05) * 100) / 100;
      break;
    }
  }

  let lastFilled = -1;
  card.days.forEach((day, index) => {
    if (dayHasData(day)) lastFilled = index;
  });
  const cycleLength = lastFilled >= 0 ? lastFilled + 1 : null;

  return {
    peakMucusDay,
    peakMucusPlus3: peakMucusDay != null ? Math.min(40, peakMucusDay + 3) : null,
    firstMucusDay,
    firstCervixDay,
    thirdRiseDay,
    cycleLength,
    coverline,
  };
}

export function displayDayNumber(manual: string, computed: number | null): string {
  const trimmed = manual.trim();
  if (trimmed) return trimmed;
  return computed == null ? "" : String(computed);
}

export function todayCycleDay(card: ObservationCard): number | null {
  if (!card.startDate) return null;
  const start = new Date(card.startDate + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - start.getTime()) / 86400000);
  if (diff < 0 || diff >= DAY_COUNT) return null;
  return diff + 1;
}

export function normalizeCard(input: Partial<ObservationCard> | null | undefined): ObservationCard {
  const base = createEmptyCard(typeof input?.id === "string" && input.id ? input.id : "");
  if (!input || typeof input !== "object") return base;
  const readDays = (raw: DayEntry[] | undefined) =>
    Array.from({ length: DAY_COUNT }, (_, index) => {
    const source = raw?.[index];
    const day = emptyDay();
    if (!source || typeof source !== "object") return day;
    const temperature =
      typeof source.temperature === "number" && parseTemperature(source.temperature.toFixed(2)) != null
        ? Math.round(source.temperature * 100) / 100
        : null;
    const mucus = Array.isArray(source.mucus)
      ? source.mucus.filter((key): key is MucusKey =>
          MUCUS_OPTIONS.some((option) => option.key === key)
        )
      : [];
    const factors = Array.isArray(source.factors)
      ? [...new Set(source.factors.map((code) => LEGACY_FACTORS[String(code)] || String(code)))].filter((code): code is FactorCode =>
          FACTORS.some((factor) => factor.code === code)
        )
      : [];
    const amount =
      typeof source.amount === "number" && source.amount >= 1 && source.amount <= 5
        ? Math.round(source.amount)
        : null;
    const next: DayEntry = {
      ...day,
      date: typeof source.date === "string" ? source.date.slice(0, 10) : "",
      temperature,
      factors,
      mucus,
      amount,
      peakMucus: Boolean(source.peakMucus),
      firmness: source.firmness === "hard" || source.firmness === "soft" ? source.firmness : "",
      position: source.position === "low" || source.position === "high" ? source.position : "",
      opening: source.opening === "closed" || source.opening === "open" ? source.opening : "",
      mood: source.mood === "+" || source.mood === "-" ? source.mood : "",
      pain: Boolean(source.pain),
      bloating: Boolean(source.bloating),
      breast: Boolean(source.breast),
      other: typeof source.other === "string" ? source.other.slice(0, 200) : "",
      intercourse: Boolean(source.intercourse),
      fertile: Boolean(source.fertile),
      note: typeof source.note === "string" ? source.note.slice(0, 300) : "",
      saved: Boolean(source.saved),
    };
    return next;
  });

  const text = (value: unknown, max = 80) => (typeof value === "string" ? value.slice(0, max) : "");
  const months: ObservationCard["months"] = {};
  const rawMonths = input.months;
  if (rawMonths && typeof rawMonths === "object") {
    for (const month of MONTHS) {
      const source = rawMonths[month.key];
      if (!source || typeof source !== "object") continue;
      months[month.key] = {
        startDate: text(source.startDate, 10),
        days: readDays(source.days),
      };
    }
  }
  const requested = text(input.activeMonth, 2);
  const activeMonth = MONTHS.some((month) => month.key === requested)
    ? requested
    : monthKeyFromIso(text(input.startDate, 10));
  if (!months[activeMonth]) {
    months[activeMonth] = { startDate: text(input.startDate, 10), days: readDays(input.days) };
  }
  const current = months[activeMonth];

  return {
    ...base,
    id: text(input.id, 80) || base.id,
    firstName: text(input.firstName, 80),
    lastName: text(input.lastName, 80),
    age: text(input.age, 8),
    cardNumber: text(input.cardNumber, 12),
    cycleNumber: text(input.cycleNumber, 12),
    previousRise: input.previousRise === "ha" || input.previousRise === "yoq" ? input.previousRise : "",
    longestCycle: text(input.longestCycle, 8),
    shortestCycle: text(input.shortestCycle, 8),
    measureTime: text(input.measureTime, 8),
    measureMethod:
      input.measureMethod === "oral" || input.measureMethod === "rectal" || input.measureMethod === "vaginal"
        ? input.measureMethod
        : "",
    peakMucusDay: text(input.peakMucusDay, 8),
    peakMucusPlus3: text(input.peakMucusPlus3, 8),
    peakCervixPlus3: text(input.peakCervixPlus3, 8),
    cycleLength: text(input.cycleLength, 8),
    firstMucusDay: text(input.firstMucusDay, 8),
    firstCervixDay: text(input.firstCervixDay, 8),
    thirdRiseDay: text(input.thirdRiseDay, 8),
    lastInfertileDay: text(input.lastInfertileDay, 8),
    activeMonth,
    months,
    startDate: current.startDate,
    days: current.days,
    updatedAt: text(input.updatedAt, 40),
  };
}
