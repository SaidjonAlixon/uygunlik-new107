"use client";

import { FACTORS, type DayEntry } from "@/lib/kalkulyator/model";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TempChartProps {
  days: DayEntry[];
  coverline: number | null;
  onSelect: (day: number) => void;
}

export function TempChart({ days, coverline, onSelect }: TempChartProps) {
  const data = days.map((day, index) => ({
    day: index + 1,
    temperature: day.temperature,
    factors: day.factors,
  }));
  const hasAny = data.some((item) => item.temperature != null);

  return (
    <div>
      {!hasAny && (
        <p className="mb-2 text-sm text-[#6d625c]">Harorat kiritilmagan. Nuqta kun tanlangach paydo bo‘ladi.</p>
      )}
      <p className="mb-2 text-xs text-[#8a7b74]">1-kundan 40-kungacha. Telefonda chapga suring.</p>
      <div className="overflow-x-auto">
      <div className="h-64 min-w-[1080px] sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
          onClick={(state) => {
            const day = state?.activePayload?.[0]?.payload?.day;
            if (typeof day === "number") onSelect(day);
          }}
        >
          <CartesianGrid stroke="#E6DFD6" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: "#6d625c", fontSize: 11 }}
            height={28}
          />
          <YAxis
            domain={[35.5, 37.4]}
            ticks={[35.5, 36.0, 36.5, 37.0, 37.4]}
            tickLine={false}
            axisLine={false}
            width={42}
            tick={{ fill: "#6d625c", fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          {coverline != null && (
            <ReferenceLine
              y={coverline}
              stroke="#5D1111"
              strokeDasharray="4 4"
              label={{ value: "Qoplama", fill: "#5D1111", fontSize: 11, position: "insideTopRight" }}
            />
          )}
          <Tooltip
            cursor={{ stroke: "#5D1111", strokeOpacity: 0.25 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as { day: number; temperature: number | null; factors: string[] };
              if (point.temperature == null) {
                return (
                  <div className="rounded-xl bg-[#1c1412] px-3 py-2 text-xs text-[#FEFBEE]">
                    {point.day}-kun — harorat yo‘q
                  </div>
                );
              }
              const factorText = point.factors
                .map((code) => FACTORS.find((factor) => factor.code === code)?.label || code)
                .join(", ");
              return (
                <div className="rounded-xl bg-[#1c1412] px-3 py-2 text-xs text-[#FEFBEE]">
                  <div className="font-semibold">
                    {point.day}-kun — {point.temperature.toFixed(2)}°C
                  </div>
                  {factorText && <div className="mt-1 text-[#FEFBEE]/80">{factorText}</div>}
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="temperature"
            stroke="#1c1412"
            strokeWidth={2}
            connectNulls={false}
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx?: number;
                cy?: number;
                payload?: { temperature: number | null; factors: string[] };
              };
              if (cx == null || cy == null || payload?.temperature == null) return <g key={`${cx}-${cy}`} />;
              const marked = payload.factors.length > 0;
              return (
                <circle
                  key={`${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={marked ? 5 : 3.5}
                  fill={marked ? "#FEFBEE" : "#1c1412"}
                  stroke="#1c1412"
                  strokeWidth={1.6}
                />
              );
            }}
            activeDot={{ r: 6, fill: "#5D1111", stroke: "#FEFBEE", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
