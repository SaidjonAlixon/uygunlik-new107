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

  const save = (target: "next" | "prev" | "first") => {
    const typed = tempText.trim();
    const temperature = typed ? parseTemperature(typed) : null;
    if (typed && temperature == null) {
      setTempError("Noto‘g‘ri qiymat. 35.50–37.40 oralig‘ida, 0.05 qadam bilan kiriting.");
      return;
    }
    setTempError("");
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

        <div>
          <span className="mb-1.5 block text-sm font-medium">Haroratga ta’sir qiluvchi omillar</span>
          <div className="flex flex-wrap gap-2">
            {FACTORS.map((factor) => (
              <Chip key={factor.code} active={day.factors.includes(factor.code)} onClick={() => toggleFactor(factor.code)}>
                {factor.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="block text-sm font-medium">Shilliq holati</span>
          {(
            [
              ["hayz", "Hayz"],
              ["quruq", "Quruqlik"],
              ["nam", "Namlik"],
              ["hol", "Ho‘llik"],
            ] as const
          ).map(([group, title]) => (
            <div key={group}>
              <p className="mb-1.5 text-xs text-[#8a7b74]">{title}</p>
              <div className="flex flex-wrap gap-2">
                {MUCUS_OPTIONS.filter((option) => option.group === group).map((option) => (
                  <Chip key={option.key} active={day.mucus.includes(option.key)} onClick={() => toggleMucus(option.key)}>
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Ajralma miqdori</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onChange({ ...day, amount: day.amount === amount ? null : amount })}
                className={`h-11 w-11 rounded-2xl border text-sm font-semibold ${
                  day.amount === amount ? "border-[#5D1111] bg-[#5D1111] text-[#FEFBEE]" : "border-[#e6dfd6] bg-white"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        <Choice
          label="Bachadon bo‘ynining qattiqligi"
          value={day.firmness}
          options={[
            ["", "Tanlanmagan"],
            ["hard", "Qattiq"],
            ["soft", "Yumshoq"],
          ]}
          onChange={(firmness) => onChange({ ...day, firmness: firmness as DayEntry["firmness"] })}
        />
        <Choice
          label="Bachadon bo‘ynining joylashuvi"
          value={day.position}
          options={[
            ["", "Tanlanmagan"],
            ["low", "Past"],
            ["high", "Yuqori"],
          ]}
          onChange={(position) => onChange({ ...day, position: position as DayEntry["position"] })}
        />
        <Choice
          label="Bachadon bo‘ynining ochilish holati"
          value={day.opening}
          options={[
            ["", "Tanlanmagan"],
            ["closed", "Yopiq"],
            ["open", "Ochiq"],
          ]}
          onChange={(opening) => onChange({ ...day, opening: opening as DayEntry["opening"] })}
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium">Kayfiyat</span>
          <div className="flex gap-2">
            {(["", "+", "-"] as const).map((mood) => (
              <Chip key={mood || "empty"} active={day.mood === mood} onClick={() => onChange({ ...day, mood })}>
                {mood === "" ? "Yo‘q" : mood}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Toggle label="Og‘riq" checked={day.pain} onChange={(pain) => onChange({ ...day, pain })} />
          <Toggle label="Qorin dam bo‘lishi" checked={day.bloating} onChange={(bloating) => onChange({ ...day, bloating })} />
          <Toggle label="Ko‘krakdagi taranglik" checked={day.breast} onChange={(breast) => onChange({ ...day, breast })} />
          <Toggle label="Serhosil kun" checked={day.fertile} onChange={(fertile) => onChange({ ...day, fertile })} />
          <Toggle label="Er-xotin yaqinligi" checked={day.intercourse} onChange={(intercourse) => onChange({ ...day, intercourse })} />
          <Toggle label="Shilliq cho‘qqi kuni" checked={day.peakMucus} onChange={(peakMucus) => onChange({ ...day, peakMucus })} />
        </div>

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
        <button
          type="button"
          onClick={() => save(dayNumber < 40 ? "next" : "first")}
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
      <div className="grid grid-cols-3 gap-2">
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
