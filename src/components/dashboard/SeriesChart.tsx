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
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={indicator.series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--rule)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          stroke="var(--rule)"
          tickMargin={10}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          stroke="var(--rule)"
          tickFormatter={(value: number) => formatNumber(value, decimals === 4 ? 2 : decimals)}
          domain={[min - padding, max + padding]}
          width={64}
        />
        <Tooltip
          cursor={{ stroke: "var(--rule-strong)", strokeWidth: 1 }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--rule-strong)",
            borderRadius: 0,
            fontSize: 12,
            boxShadow: "0 2px 12px rgb(14 17 22 / 0.08)",
          }}
          labelStyle={{ color: "var(--muted)" }}
          itemStyle={{ color: "var(--ink)" }}
          formatter={(value) => [
            `${formatNumber(Number(value), decimals)} ${indicator.unit}`,
            indicator.label,
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--signal)"
          strokeWidth={1.75}
          dot={false}
          activeDot={{ r: 3.5, fill: "var(--signal)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
