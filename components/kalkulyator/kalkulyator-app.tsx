"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DayEditor } from "@/components/kalkulyator/day-editor";
import { TempChart } from "@/components/kalkulyator/temp-chart";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  applyStartDate,
  createEmptyCard,
  dayHasData,
  deriveStats,
  displayDayNumber,
  monthIsFilled,
  monthName,
  MONTHS,
  normalizeCard,
  openMonth,
  rememberMonth,
  todayCycleDay,
  type ObservationCard,
} from "@/lib/kalkulyator/model";
import { useUserStore } from "@/store/user.store";

const DRAFT_KEY = "uygunlik-karta-draft";

type SaveState = "idle" | "saving" | "saved" | "local";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function KalkulyatorApp() {
  const user = useUserStore((state) => state.user);
  const userLoading = useUserStore((state) => state.loading);
  const [card, setCardState] = useState<ObservationCard | null>(null);
  const setCard: typeof setCardState = (value) => {
    setCardState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      return next ? rememberMonth(next) : next;
    });
  };
  const [ready, setReady] = useState(false);
  const [allowSave, setAllowSave] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [selected, setSelected] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const id = `user-${user.id}`;
    const draftRaw = localStorage.getItem(`${DRAFT_KEY}:${id}`);
    let draft = createEmptyCard(id);
    if (draftRaw) {
      try {
        const parsed = normalizeCard({ ...JSON.parse(draftRaw), id });
        if (parsed.id === id) draft = parsed;
      } catch {
        draft = createEmptyCard(id);
      }
    }
    if (!draft.firstName && !draft.lastName) {
      draft = { ...draft, firstName: user.first_name || "", lastName: user.last_name || "" };
    }
    setCard(draft);
    setReady(true);
    setAllowSave(false);

    fetch("/api/kalkulyator", { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const remote = normalizeCard(data.card);
        const remoteTime = Date.parse(remote.updatedAt || "") || 0;
        const localTime = Date.parse(draft.updatedAt || "") || 0;
        const chosen = remoteTime >= localTime ? remote : draft;
        setCard({
          ...chosen,
          id,
          cardNumber: remote.cardNumber || chosen.cardNumber,
          firstName: chosen.firstName || user.first_name || "",
          lastName: chosen.lastName || user.last_name || "",
        });
      })
      .catch(() => undefined)
      .finally(() => setAllowSave(true));
  }, [user]);

  useEffect(() => {
    if (!ready || !allowSave || !card) return;
    const withTime = { ...card, updatedAt: new Date().toISOString() };
    localStorage.setItem(`${DRAFT_KEY}:${card.id}`, JSON.stringify(withTime));
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      fetch("/api/kalkulyator", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(withTime),
      })
        .then(async (response) => {
          if (!response.ok) {
            setSaveState("local");
            return;
          }
          const data = await response.json();
          const remoteNumber = typeof data.card?.cardNumber === "string" ? data.card.cardNumber : "";
          if (remoteNumber) {
            setCard((current) => (current && current.cardNumber !== remoteNumber ? { ...current, cardNumber: remoteNumber } : current));
          }
          setSaveState("saved");
        })
        .catch(() => setSaveState("local"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [card, ready, allowSave]);

  const derived = useMemo(() => (card ? deriveStats(card) : null), [card]);
  const today = card ? todayCycleDay(card) : null;

  if (userLoading || user === undefined) {
    return <main className="grid min-h-screen place-items-center bg-[#F6F3EE] text-[#5D1111]">Yuklanmoqda...</main>;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F6F3EE] px-4 text-[#1c1412]">
        <section className="w-full max-w-md rounded-3xl border border-[#e6dfd6] bg-white p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a7b74]">Uyg‘unlik</p>
          <h1 className="mt-2 text-2xl font-semibold">Kalkulyator</h1>
          <p className="mt-3 text-sm leading-6 text-[#6d625c]">
            Kuzatuv kartasi faqat ro‘yxatdan o‘tgan foydalanuvchi uchun ochiladi. Ism, familiya va karta raqami hisobingizga bog‘lanadi.
          </p>
          <div className="mt-5 grid gap-2">
            <Link href="/register?next=/kalkulyator" className="grid h-12 place-items-center rounded-2xl bg-[#5D1111] text-sm font-semibold text-[#FEFBEE]">
              Ro‘yxatdan o‘tish
            </Link>
            <Link href="/auth?next=/kalkulyator" className="grid h-12 place-items-center rounded-2xl border border-[#5D1111] text-sm font-semibold text-[#5D1111]">
              Kirish
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!card || !derived) {
    return <main className="grid min-h-screen place-items-center bg-[#F6F3EE] text-[#5D1111]">Yuklanmoqda...</main>;
  }

  const fullName = [card.firstName, card.lastName].filter(Boolean).join(" ");

  const updateDay = (index: number, next: ObservationCard["days"][number]) => {
    setCard((current) =>
      current
        ? {
            ...current,
            days: current.days.map((day, dayIndex) => (dayIndex === index ? next : day)),
          }
        : current
    );
  };

  const downloadExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/kalkulyator/excel", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(card),
      });
      if (!response.ok) {
        toast.error("Excel fayl yaratilmadi");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const person = [card.firstName, card.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
      const fileName = [person, monthName(card.activeMonth)].filter(Boolean).join(" - ") || "Karta";
      link.download = `${fileName.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel fayl yaratilmadi");
    } finally {
      setExporting(false);
    }
  };

  const saveLabel =
    saveState === "saving" ? "Saqlanmoqda..." : saveState === "saved" ? "Saqlandi" : saveState === "local" ? "Qurilmada saqlandi" : "";

  return (
    <main className="min-h-screen bg-[#F6F3EE] text-[#1c1412] [color-scheme:light]">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        <header className="sticky top-0 z-40 -mx-4 mb-4 border-b border-[#e6dfd6]/80 bg-[#F6F3EE]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link href="/" className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a7b74]">
                Uyg‘unlik
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight">Kalkulyator</h1>
            </div>
            <p className="text-sm text-[#6d625c]" aria-live="polite">
              {saveLabel}
            </p>
          </div>
        </header>

        <section className="mb-4 rounded-3xl border border-[#e6dfd6] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7b74]">Kuzatuv</p>
          <h2 className="mt-1 text-xl font-semibold">{fullName || "Ism familiya"}</h2>
          <p className="mt-1 text-sm text-[#6d625c]">
            Karta raqami{" "}
            <span className="font-semibold tracking-[0.12em] text-[#1c1412]">{card.cardNumber || "yaratilmoqda"}</span>
          </p>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-[#5c514c]">Oy</p>
            <div className="flex gap-2 overflow-x-auto rounded-2xl bg-[#FBF7F2] p-2">
              {MONTHS.map((month) => {
                const active = card.activeMonth === month.key;
                const filled = monthIsFilled(card, month.key);
                return (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => setCardState((current) => (current ? openMonth(current, month.key) : current))}
                    className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${
                      active
                        ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE] shadow-sm"
                        : filled
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-[#eadfd4] bg-white text-[#1c1412]"
                    }`}
                  >
                    {month.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#8a7b74]">
              Kerakli oyni tanlang. To‘ldirilgan oy yashil, bo‘sh oy ochiq turadi.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Ism" value={card.firstName} onChange={(firstName) => setCard((current) => (current ? { ...current, firstName } : current))} />
            <Field label="Familiya" value={card.lastName} onChange={(lastName) => setCard((current) => (current ? { ...current, lastName } : current))} />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">1-kun sanasi</span>
              <span className="mb-1.5 block text-xs text-[#8a7b74]">Shu sanadan keyingi kunlar pastga o‘zi hisoblanadi.</span>
              <input
                type="date"
                value={card.startDate}
                onChange={(event) => setCard((current) => (current ? applyStartDate(current, event.target.value) : current))}
                className={controlClass}
              />
            </label>
          </div>
        </section>

        <section className="mb-4 rounded-3xl border border-[#e6dfd6] bg-white p-4">
              <div className="mb-2 flex items-end justify-between">
                <h2 className="text-lg font-semibold">Harorat grafigi</h2>
                <p className="text-xs text-[#8a7b74]">1–40 kun</p>
              </div>
              <TempChart
                days={card.days}
                coverline={derived.coverline}
                onSelect={(day) => {
                  setSelected(day);
                  setEditorOpen(true);
                }}
              />
            </section>

            <section className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sikl kunlari</h2>
                <p className="text-xs text-[#8a7b74]">Kun tanlash</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {card.days.map((day, index) => {
                  const number = index + 1;
                  const active = selected === number;
                  const isToday = today === number;
                  const saved = dayHasData(day);
                  return (
                    <button
                      key={number}
                      type="button"
                      onClick={() => {
                        setSelected(number);
                        setEditorOpen(true);
                      }}
                      className={`flex h-16 w-16 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border text-center ${
                        active
                          ? saved
                            ? "border-emerald-800 bg-emerald-800 text-white"
                            : "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]"
                          : saved
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-[#e6dfd6] bg-white"
                      }`}
                    >
                      <span className="block text-base font-semibold leading-none">{number}</span>
                      <span className="mt-0.5 block text-[10px] leading-none">kun</span>
                      <span className="mt-1 block text-[10px] leading-none">{isToday ? "Bugun" : saved ? "Saqlandi" : "Bo‘sh"}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="mt-2 h-11 w-full rounded-2xl bg-[#1c1412] text-sm font-semibold text-[#FEFBEE]"
              >
                {selected}-kunni to‘ldirish
              </button>
            </section>

          <section className="mb-4 rounded-3xl border border-[#e6dfd6] bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Yakuniy ma’lumotlar</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6d625c]">
              Bo‘sh qoldirilgan kunlar avtomatik hisoblanadi. Qo‘lda yozsangiz, shu qiymat saqlanadi.
            </p>
            <div className="mt-4 rounded-2xl bg-[#FBF7F2] p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-[#5D1111]">O‘lchash</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Yosh" value={card.age} onChange={(age) => setCard({ ...card, age })} />
                <Field label="Sikl raqami" value={card.cycleNumber} onChange={(cycleNumber) => setCard({ ...card, cycleNumber })} />
                <SelectField
                  label="Oldingi kartada harorat ko‘tarilishi"
                  value={card.previousRise}
                  onChange={(previousRise) => setCard({ ...card, previousRise: previousRise as ObservationCard["previousRise"] })}
                  options={[
                    ["", "Tanlash"],
                    ["ha", "Ha"],
                    ["yoq", "Yo‘q"],
                  ]}
                />
                <SelectField
                  label="O‘lchash joyi"
                  value={card.measureMethod}
                  onChange={(measureMethod) => setCard({ ...card, measureMethod: measureMethod as ObservationCard["measureMethod"] })}
                  options={[
                    ["", "Tanlash"],
                    ["oral", "Og‘iz"],
                    ["rectal", "Orqa teshik"],
                    ["vaginal", "Vaginal"],
                  ]}
                />
                <SelectField
                  label="O‘lchash vaqti"
                  value={shownMeasureTime(card.measureTime)}
                  onChange={(measureTime) => setCard({ ...card, measureTime })}
                  options={[["", "Tanlash"], ...MEASURE_TIMES.map((time) => [time, time] as [string, string])]}
                />
                <Field label="Eng uzun sikl" value={card.longestCycle} onChange={(longestCycle) => setCard({ ...card, longestCycle })} />
                <Field label="Eng qisqa sikl" value={card.shortestCycle} onChange={(shortestCycle) => setCard({ ...card, shortestCycle })} />
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-[#FBF7F2] p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-[#5D1111]">Hisoblangan kunlar</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Stat label="Shilliq cho‘qqi kuni" value={displayDayNumber(card.peakMucusDay, derived.peakMucusDay)} onChange={(peakMucusDay) => setCard({ ...card, peakMucusDay })} />
                <Stat label="Cho‘qqidan keyingi 3-kun" value={displayDayNumber(card.peakMucusPlus3, derived.peakMucusPlus3)} onChange={(peakMucusPlus3) => setCard({ ...card, peakMucusPlus3 })} />
                <Stat label="Birinchi shilliq kuni" value={displayDayNumber(card.firstMucusDay, derived.firstMucusDay)} onChange={(firstMucusDay) => setCard({ ...card, firstMucusDay })} />
                <Stat label="Bachadon bo‘yni o‘zgarishi" value={displayDayNumber(card.firstCervixDay, derived.firstCervixDay)} onChange={(firstCervixDay) => setCard({ ...card, firstCervixDay })} />
                <Stat label="Harorat ko‘tarilishining 3-kuni" value={displayDayNumber(card.thirdRiseDay, derived.thirdRiseDay)} onChange={(thirdRiseDay) => setCard({ ...card, thirdRiseDay })} />
                <Stat label="Sikl davomiyligi" value={displayDayNumber(card.cycleLength, derived.cycleLength)} onChange={(cycleLength) => setCard({ ...card, cycleLength })} />
                <Field label="Birinchi fazadagi oxirgi noserhosil kun" value={card.lastInfertileDay} onChange={(lastInfertileDay) => setCard({ ...card, lastInfertileDay })} />
                <Field label="Bachadon bo‘yni cho‘qqisi + 3 kun" value={card.peakCervixPlus3} onChange={(peakCervixPlus3) => setCard({ ...card, peakCervixPlus3 })} />
              </div>
            </div>
          </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6dfd6] bg-[#F6F3EE]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-5xl gap-2">
            <button
              type="button"
              onClick={downloadExcel}
              disabled={exporting}
              className="h-12 w-full rounded-2xl bg-[#5D1111] text-sm font-semibold text-[#FEFBEE] disabled:opacity-60"
            >
              {exporting ? "Saqlanmoqda..." : "Excel yuklab olish"}
            </button>
          </div>
        </div>
      </div>

      <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
        <DrawerContent className="mx-auto max-w-lg border-[#e6dfd6] bg-[#F6F3EE]">
          <DrawerTitle className="sr-only">{selected}-kun</DrawerTitle>
          <DayEditor
            dayNumber={selected}
            day={card.days[selected - 1]}
            onChange={(day) => updateDay(selected - 1, day)}
            onCommit={(day, target) => {
              updateDay(selected - 1, day);
              if (target === "next" && selected < 40) setSelected(selected + 1);
              if (target === "prev" && selected > 1) setSelected(selected - 1);
              if (target === "first") setSelected(1);
            }}
            onClose={() => setEditorOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </main>
  );
}

const MEASURE_TIMES = Array.from({ length: 17 }, (_, index) => {
  const total = 4 * 60 + index * 30;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
});

function shownMeasureTime(value: string): string {
  const match = /^0?(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  const shown = `${Number(match[1])}:${match[2]}`;
  return MEASURE_TIMES.includes(shown) ? shown : value;
}

const controlClass =
  "h-12 w-full rounded-2xl border border-[#e4d9cc] bg-white px-3.5 text-[15px] text-[#1c1412] shadow-[0_1px_0_rgba(255,255,255,0.9)] outline-none transition placeholder:text-[#b3a59c] focus:border-[#5D1111] focus:ring-2 focus:ring-[#5D1111]/15 [color-scheme:light]";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#5c514c]">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#5c514c]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "empty"} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return <Field label={label} value={value} onChange={onChange} />;
}
