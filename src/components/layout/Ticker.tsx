"use client";

import { useEffect, useState } from "react";
import type { IndicatorSummary } from "@/lib/bcb/types";
import { formatNumber, formatSigned, trendArrow } from "@/lib/format";
import clsx from "clsx";

const REFRESH_MS = 60_000;

function trendColor(trend: IndicatorSummary["trend"]) {
  if (trend === "up") return "text-signal-up";
  if (trend === "down") return "text-signal-down";
  return "text-paper-400";
}

function TickerItem({ item }: { item: IndicatorSummary }) {
  return (
    <span className="mx-6 inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-xs tracking-widest text-paper-400 uppercase">{item.label}</span>
      <span className="font-mono tabular text-sm text-paper-100">
        {item.prefix}
        {formatNumber(item.current, item.decimals)}
        {!item.prefix && <span className="ml-1 text-paper-400">{item.unit}</span>}
      </span>
      <span className={clsx("font-mono tabular text-xs", trendColor(item.trend))}>
        {trendArrow(item.trend)} {formatSigned(item.variation, item.decimals)}
      </span>
      <span className="text-ink-600">/</span>
    </span>
  );
}

/**
 * Carrega no cliente: assim o layout continua estático e uma instabilidade da
 * API do BCB não bloqueia a renderização de nenhuma página.
 */
export function Ticker() {
  const [items, setItems] = useState<IndicatorSummary[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await fetch("/api/indicators");
        if (!res.ok) return;
        const data: { indicators: IndicatorSummary[] } = await res.json();
        if (ativo) setItems(data.indicators);
      } catch {
        // mantém os últimos valores conhecidos em caso de falha de rede
      }
    }

    carregar();
    const id = setInterval(carregar, REFRESH_MS);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="ticker-row h-9 overflow-hidden border-b border-ink-700 bg-ink-900 py-2">
      {items.length > 0 && (
        <div className="ticker-track flex w-max">
          {[...items, ...items].map((item, i) => (
            <TickerItem key={`${item.code}-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
