"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IndicatorSummary } from "@/lib/bcb/types";
import { formatNumber } from "@/lib/format";

export function SeriesChart({ indicator }: { indicator: IndicatorSummary }) {
  const { decimals } = indicator;
  const values = indicator.series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Séries estáveis (Selic entre reuniões do Copom) ficariam achatadas no domínio automático.
  const padding = (max - min || Math.abs(max) * 0.04 || 1) * 0.3;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={indicator.series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--ink-700)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--paper-400)", fontSize: 11 }}
          stroke="var(--ink-600)"
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: "var(--paper-400)", fontSize: 11 }}
          stroke="var(--ink-600)"
          tickFormatter={(value: number) => formatNumber(value, decimals === 4 ? 2 : decimals)}
          domain={[min - padding, max + padding]}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "var(--ink-800)",
            border: "1px solid var(--ink-600)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--paper-400)" }}
          itemStyle={{ color: "var(--paper-100)" }}
          formatter={(value) => [
            `${formatNumber(Number(value), decimals)} ${indicator.unit}`,
            indicator.label,
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--gold-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--gold-400)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
