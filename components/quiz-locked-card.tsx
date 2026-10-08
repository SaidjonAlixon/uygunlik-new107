"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  percent: number;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export function QuizLockedCard({ title, percent, message, actionLabel, onAction }: Props) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-3 bg-[#5D1111]" />
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FEFBEE] text-[#5D1111]">
              <Lock className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-serif font-bold text-[#5D1111]">Test hali yopiq</CardTitle>
              {title && <p className="text-[#7A2E2E]/60">{title}</p>}
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-sm text-[#7A2E2E]/70">
                <span>Ko'rilgan</span>
                <span className="font-bold text-[#5D1111]">{p}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#7A2E2E]/10">
                <div className="h-full rounded-full bg-[#5D1111]" style={{ width: `${p}%` }} />
              </div>
            </div>
            <p className="text-sm text-[#7A2E2E]/80 bg-[#FEFBEE] rounded-xl p-4 border border-[#7A2E2E]/10">
              {message}
            </p>
            <Button
              onClick={onAction}
              className="rounded-xl h-14 w-full sm:w-auto px-8 bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
            >
              {actionLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
