"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/bcb/types";

export function Sparkline({
  id,
  data,
  color,
}: {
  id: string;
  data: SeriesPoint[];
  color: string;
}) {
  const gradientId = `spark-${id}`;
  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || Math.abs(max) * 0.05 || 1) * 0.25;

  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[min - padding, max + padding]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          baseValue={min - padding}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
