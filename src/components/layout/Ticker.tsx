"use client";

import { useEffect, useState } from "react";
import type { IndicatorSummary } from "@/lib/bcb/types";
import { formatNumber, formatSigned } from "@/lib/format";
import clsx from "clsx";

const REFRESH_MS = 60_000;

function trendColor(trend: IndicatorSummary["trend"]) {
  if (trend === "up") return "text-up";
  if (trend === "down") return "text-down";
  return "text-muted";
}

function TickerItem({ item }: { item: IndicatorSummary }) {
  return (
    <span className="mx-7 inline-flex items-baseline gap-2.5 whitespace-nowrap">
      <span className="label">{item.label}</span>
      <span className="tabular font-display text-[0.8125rem] font-semibold text-ink">
        {item.prefix}
        {formatNumber(item.current, item.decimals)}
        {!item.prefix && <span className="ml-1 font-normal text-muted">{item.unit}</span>}
      </span>
      <span className={clsx("tabular font-mono text-[0.6875rem]", trendColor(item.trend))}>
        {item.trend === "stable" ? "—" : formatSigned(item.variation, item.decimals)}
      </span>
    </span>
  );
}

/**
 * Carrega no cliente: assim o layout continua estático e uma instabilidade da
 * API do BCB não bloqueia a renderização de nenhuma página.
 *
 * A fita reserva a própria altura desde o primeiro paint, com um esqueleto no
 * lugar dos valores. Sem isso o conteúdo abaixo salta quando os dados chegam.
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
    <div className="ticker-row h-10 overflow-hidden border-b border-rule bg-sunk">
      {items.length > 0 ? (
        <div className="ticker-track flex h-full w-max items-center">
          {[...items, ...items].map((item, i) => (
            <TickerItem key={`${item.code}-${i}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center gap-7 px-7" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex items-center gap-2.5">
              <span className="h-2 w-12 rounded-[2px] bg-rule" />
              <span className="h-3 w-14 rounded-[2px] bg-rule-strong/50" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
