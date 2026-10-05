"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  FACTORS,
  MUCUS_OPTIONS,
  dayHasData,
  formatTemperature,
  parseTemperature,
  type DayEntry,
  type MucusKey,
} from "@/lib/kalkulyator/model";

interface DayEditorProps {
  dayNumber: number;
  day: DayEntry;
  onChange: (day: DayEntry) => void;
  onCommit: (day: DayEntry, target: "next" | "prev" | "first") => void;
  onClose: () => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-left text-sm transition ${
        active
          ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]"
          : "border-[#e6dfd6] bg-white text-[#1c1412] hover:border-[#5D1111]/40"
      }`}
    >
      {children}
    </button>
  );
}

export function DayEditor({ dayNumber, day, onChange, onCommit, onClose }: DayEditorProps) {
  const [tempText, setTempText] = useState(formatTemperature(day.temperature));
  const [tempError, setTempError] = useState("");
  const [choiceError, setChoiceError] = useState("");

  useEffect(() => {
    setTempText(formatTemperature(day.temperature));
    setTempError("");
  }, [dayNumber, day.temperature]);

  const commitTemperature = (raw: string) => {
    if (!raw.trim()) {
      setTempError("");
      onChange({ ...day, temperature: null });
      return;
    }
    const value = parseTemperature(raw);
    if (value == null) {
      setTempError("Noto‘g‘ri qiymat. 35.50–37.40 oralig‘ida, 0.05 qadam bilan kiriting.");
      return;
    }
    setTempError("");
    setTempText(value.toFixed(2));
    onChange({ ...day, temperature: value });
  };

  const stepTemperature = (delta: number) => {
    const typed = parseTemperature(tempText);
    const current = typed ?? day.temperature ?? 36.5;
    const next = Math.round((current + delta) * 100) / 100;
    const value = parseTemperature(next.toFixed(2));
    if (value == null) return;
    setTempText(value.toFixed(2));
    setTempError("");
    onChange({ ...day, temperature: value });
  };

  const toggleMucus = (key: MucusKey) => {
    const mucus = day.mucus.includes(key) ? day.mucus.filter((item) => item !== key) : [...day.mucus, key];
    onChange({ ...day, mucus });
  };

  const toggleFactor = (code: string) => {
    const factors = day.factors.includes(code)
      ? day.factors.filter((item) => item !== code)
      : [...day.factors, code];
    onChange({ ...day, factors });
  };

  const save = (target: "next" | "prev" | "first", requireChoice = false) => {
    const typed = tempText.trim();
    const temperature = typed ? parseTemperature(typed) : null;
    if (typed && temperature == null) {
      setTempError("Noto‘g‘ri qiymat. 35.50–37.40 oralig‘ida, 0.05 qadam bilan kiriting.");
      return;
    }
    if (requireChoice && day.mucus.length === 0) {
      setChoiceError("Keyingi kunga o‘tish uchun shilliq holatidan kamida bittasini tanlang.");
      return;
    }
    setTempError("");
    setChoiceError("");
    if (temperature != null) setTempText(temperature.toFixed(2));
    const next = { ...day, temperature };
    onCommit({ ...next, saved: dayHasData(next) }, target);
  };

  return (
    <div className="flex max-h-[86vh] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-[#efe8df] px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7b74]">Sikl kuni</p>
          <h2 className="text-2xl font-semibold text-[#1c1412]">{dayNumber}-kun</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-[#5D1111]">
          Yopish
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto px-4 py-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Sana</span>
          <input
            type="date"
            value={day.date}
            onChange={(event) => onChange({ ...day, date: event.target.value })}
            className="h-11 w-full rounded-2xl border border-[#e6dfd6] bg-white px-3 text-base"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Bazal tana harorati</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => stepTemperature(-0.05)} className="h-11 w-11 rounded-2xl border border-[#e6dfd6] text-lg">
              −
            </button>
            <input
              inputMode="decimal"
              value={tempText}
              placeholder="36.50"
              onChange={(event) => {
                setTempText(event.target.value);
                setTempError("");
              }}
              onBlur={() => commitTemperature(tempText)}
              className="h-11 flex-1 rounded-2xl border border-[#e6dfd6] bg-white px-3 text-center text-lg"
              aria-label="Harorat qiymati"
            />
            <span className="text-sm text-[#6d625c]">°C</span>
            <button type="button" onClick={() => stepTemperature(0.05)} className="h-11 w-11 rounded-2xl border border-[#e6dfd6] text-lg">
              +
            </button>
          </div>
          {tempError && <p className="mt-1.5 text-sm text-[#9b2332]">{tempError}</p>}
        </div>

        <Section title="Buzilish sabablari" hint="Haroratga ta’sir qilgan bo‘lsa belgilang.">
          <div className="flex flex-wrap gap-2">
            {FACTORS.map((factor) => (
              <Chip key={factor.code} active={day.factors.includes(factor.code)} onClick={() => toggleFactor(factor.code)}>
                {factor.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Shilliq holati" hint="Kamida bittasini tanlang. Exceldagi shu qatorga belgi tushadi." required>
          {(
            [
              ["hayz", "Hayz", "#f7d5e2"],
              ["quruq", "Quruq", "#f8d7b0"],
              ["nam", "Nam", "#f8efb8"],
              ["hol", "Ho‘l", "#cfeedd"],
            ] as const
          ).map(([group, title, color]) => (
            <div key={group} className="overflow-hidden rounded-2xl border border-[#efe8df]">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c4038]" style={{ backgroundColor: color }}>
                {title}
              </div>
              <div className="divide-y divide-[#f3ece4] bg-white">
                {MUCUS_OPTIONS.filter((option) => option.group === group).map((option) => (
                  <RowChoice
                    key={option.key}
                    label={option.label}
                    active={day.mucus.includes(option.key)}
                    onClick={() => toggleMucus(option.key)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Shilliq cho‘qqi kuni">
          <Toggle label="Shu kun cho‘qqi kuni" checked={day.peakMucus} onChange={(peakMucus) => onChange({ ...day, peakMucus })} />
        </Section>

        <Section title="Ajralma miqdori (1–5)">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onChange({ ...day, amount: day.amount === amount ? null : amount })}
                className={`h-11 rounded-2xl border text-sm font-semibold ${
                  day.amount === amount ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#e6dfd6] bg-white"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Bachadon bo‘yni">
          <Choice
            label="Qattiq yoki yumshoq"
            value={day.firmness}
            options={[
              ["hard", "Qattiq"],
              ["soft", "Yumshoq"],
            ]}
            onChange={(firmness) =>
              onChange({ ...day, firmness: (day.firmness === firmness ? "" : firmness) as DayEntry["firmness"] })
            }
          />
          <Choice
            label="Past yoki yuqori"
            value={day.position}
            options={[
              ["low", "Past"],
              ["high", "Yuqori"],
            ]}
            onChange={(position) =>
              onChange({ ...day, position: (day.position === position ? "" : position) as DayEntry["position"] })
            }
          />
          <Choice
            label="Yopiq yoki ochiq"
            value={day.opening}
            options={[
              ["closed", "Yopiq"],
              ["open", "Ochiq"],
            ]}
            onChange={(opening) =>
              onChange({ ...day, opening: (day.opening === opening ? "" : opening) as DayEntry["opening"] })
            }
          />
        </Section>

        <Section title="Tana belgilaridagi o‘zgarishlar">
          <div>
            <span className="mb-1.5 block text-sm font-medium">Kayfiyat +/-</span>
            <div className="grid grid-cols-2 gap-2">
              {(["+", "-"] as const).map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => onChange({ ...day, mood: day.mood === mood ? "" : mood })}
                  className={`h-11 rounded-2xl border text-base font-semibold ${
                    day.mood === mood ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#e6dfd6] bg-white"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Og‘riq, qorin dam bo‘lishi"
            checked={day.pain || day.bloating}
            onChange={(checked) => onChange({ ...day, pain: checked, bloating: checked })}
          />
          <Toggle label="Ko‘krakdagi taranglik" checked={day.breast} onChange={(breast) => onChange({ ...day, breast })} />
          <Toggle label="Serhosil kunlar" checked={day.fertile} onChange={(fertile) => onChange({ ...day, fertile })} />
          <Toggle label="Er-xotin yaqinligi" checked={day.intercourse} onChange={(intercourse) => onChange({ ...day, intercourse })} />
        </Section>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Boshqa tana belgilar</span>
          <input
            value={day.other}
            onChange={(event) => onChange({ ...day, other: event.target.value })}
            className="h-11 w-full rounded-2xl border border-[#e6dfd6] bg-white px-3"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Qo‘shimcha belgilar</span>
          <textarea
            value={day.note}
            onChange={(event) => onChange({ ...day, note: event.target.value })}
            rows={2}
            className="w-full rounded-2xl border border-[#e6dfd6] bg-white px-3 py-2"
          />
        </label>
      </div>

      <div className="space-y-2 border-t border-[#efe8df] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {choiceError && <p className="text-sm text-[#9b2332]">{choiceError}</p>}
        <button
          type="button"
          onClick={() => save(dayNumber < 40 ? "next" : "first", true)}
          className="h-12 w-full rounded-2xl bg-[#5D1111] text-base font-semibold text-[#FEFBEE]"
        >
          {dayNumber < 40 ? "Saqlash va keyingi kun" : "Saqlash va 1-kunga qaytish"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => save("prev")}
            disabled={dayNumber === 1}
            className="h-11 rounded-2xl border border-[#e6dfd6] bg-white text-sm font-medium disabled:opacity-40"
          >
            Oldingi kun
          </button>
          <button
            type="button"
            onClick={() => save("first")}
            className="h-11 rounded-2xl border border-[#e6dfd6] bg-white text-sm font-medium"
          >
            1-kunga qaytish
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  required = false,
  children,
}: {
  title: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-[#efe8df] bg-[#FBF7F2] p-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1c1412]">{title}</h3>
          {required && (
            <span className="rounded-full bg-[#5D1111] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FEFBEE]">
              Majburiy
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-xs leading-5 text-[#8a7b74]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function RowChoice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm">
      <span className={active ? "font-medium text-[#5D1111]" : "text-[#1c1412]"}>{label}</span>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
          active ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#d9cfc6] bg-white"
        }`}
      >
        {active ? "✓" : ""}
      </span>
    </button>
  );
}

function Choice({
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
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue || "empty"}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`min-h-11 rounded-2xl border px-2 py-2 text-sm ${
              value === optionValue ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#e6dfd6] bg-white"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm ${
        checked ? "border-[#5D1111] bg-[#5D1111]/5" : "border-[#e6dfd6] bg-white"
      }`}
    >
      <span>{label}</span>
      <span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#cfc6bd]"}`}>
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}
