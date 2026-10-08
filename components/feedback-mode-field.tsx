"use client";

import { MessageSquareText, ShieldCheck } from "lucide-react";

export type FeedbackMode = "optional" | "required";

const OPTIONS: { value: FeedbackMode; title: string; hint: string; icon: typeof MessageSquareText }[] = [
  {
    value: "optional",
    title: "Ixtiyoriy",
    hint: "O‘quvchi xohlasa fikr qoldiradi",
    icon: MessageSquareText,
  },
  {
    value: "required",
    title: "Majburiy",
    hint: "Fikr qoldirmaguncha test ochilmaydi",
    icon: ShieldCheck,
  },
];

export function FeedbackModeField({
  value,
  onChange,
}: {
  value: FeedbackMode;
  onChange: (value: FeedbackMode) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#5D1111]">Dars bo‘yicha fikr</p>
      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-[#5D1111] bg-[#5D1111] text-white shadow-md"
                  : "border-[#7A2E2E]/20 bg-[#FEFBEE]/50 text-[#5D1111] hover:border-[#5D1111]/50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Icon className="h-4 w-4" />
                {opt.title}
              </span>
              <span className={`mt-1 block text-[11px] leading-snug ${active ? "text-white/80" : "text-[#7A2E2E]/70"}`}>
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
