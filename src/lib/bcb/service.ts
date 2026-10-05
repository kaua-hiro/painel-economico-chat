import type { IndicatorCode, IndicatorSummary, SeriesPoint } from "./types";
import { formatNumber } from "@/lib/format";

/**
 * Serviço de integração com o SGS — Sistema Gerenciador de Séries Temporais do
 * Banco Central do Brasil. API pública, sem autenticação.
 * https://dadosabertos.bcb.gov.br/
 */
const SGS_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

/** O endpoint `/dados/ultimos/{n}` rejeita requisições acima de 20 valores. */
const MAX_POINTS = 20;
const DEFAULT_POINTS = 18;

/** Dias úteis usados para anualizar taxas diárias (padrão do mercado brasileiro). */
const BUSINESS_DAYS_PER_YEAR = 252;

const INDICATOR_META: Record<
  IndicatorCode,
  {
    sgsCode: number;
    label: string;
    unit: string;
    description: string;
    decimals: number;
    prefix?: string;
  }
> = {
  selic: {
    sgsCode: 432,
    label: "Selic",
    unit: "% a.a.",
    description: "Meta da taxa básica de juros definida pelo Copom",
    decimals: 2,
  },
  cdi: {
    sgsCode: 12,
    label: "CDI",
    unit: "% a.d.",
    description: "Taxa diária dos Certificados de Depósito Interbancário",
    decimals: 4,
  },
  ipca: {
    sgsCode: 433,
    label: "IPCA",
    unit: "% a.m.",
    description: "Inflação oficial medida pelo IBGE, variação mensal",
    decimals: 2,
  },
  dolar: {
    sgsCode: 1,
    label: "Dólar (PTAX)",
    unit: "R$",
    description: "Cotação de venda do dólar americano no mercado à vista",
    decimals: 4,
    prefix: "R$ ",
  },
};

interface BcbRawPoint {
  data: string;
  valor: string;
}

const MAX_ATTEMPTS = 3;
/** Sem timeout, uma resposta lenta do BCB seguraria a requisição indefinidamente. */
const REQUEST_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  series: SeriesPoint[];
  expiresAt: number;
}

/**
 * Cache próprio, preenchido **depois** da validação.
 *
 * O cache de fetch do Next guarda qualquer resposta com status 200 — inclusive o
 * envelope XML de erro que o gateway do BCB às vezes devolve. Quando isso
 * acontecia, a entrada envenenada ficava uma hora no cache e as retentativas
 * reliam o mesmo lixo em vez de consultar a origem. Por isso a requisição vai
 * sem cache e só o conteúdo já parseado é memorizado aqui.
 */
const seriesCache = new Map<string, CacheEntry>();
/** Requisições idênticas em voo compartilham a mesma promessa (evita estouro na API). */
const inFlight = new Map<string, Promise<SeriesPoint[]>>();

/**
 * Busca os últimos N pontos de uma série do SGS.
 * O gateway do BCB ocasionalmente responde com um envelope XML de erro usando
 * status 200, então o corpo é validado como JSON antes de ser aceito.
 */
async function fetchSeries(sgsCode: number, lastN: number): Promise<SeriesPoint[]> {
  const points = Math.min(lastN, MAX_POINTS);
  const key = `${sgsCode}:${points}`;

  const cached = seriesCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.series;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = requestSeries(sgsCode, points)
    .then((series) => {
      seriesCache.set(key, { series, expiresAt: Date.now() + CACHE_TTL_MS });
      return series;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}

async function requestSeries(sgsCode: number, points: number): Promise<SeriesPoint[]> {
  const url = `${SGS_BASE_URL}.${sgsCode}/dados/ultimos/${points}?formato=json`;

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Série ${sgsCode} indisponível no BCB (status ${res.status})`);
    }

    const body = await res.text();

    try {
      const raw: BcbRawPoint[] = JSON.parse(body);
      return raw.map((point) => ({
        date: point.data,
        value: Number.parseFloat(point.valor.replace(",", ".")),
      }));
    } catch {
      lastError = body.slice(0, 120).replace(/\s+/g, " ");
      console.warn(
        `[BCB] Resposta não-JSON na série ${sgsCode} (tentativa ${attempt}/${MAX_ATTEMPTS})`,
      );
      if (attempt < MAX_ATTEMPTS) {
        // Backoff exponencial com jitter: a instabilidade do gateway dura mais
        // que algumas centenas de milissegundos.
        const delay = 400 * 2 ** (attempt - 1) + Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Série ${sgsCode} devolveu conteúdo inválido: ${lastError}`);
}

/** Compõe variações percentuais sucessivas: usado no IPCA acumulado. */
export function compoundAccumulated(points: SeriesPoint[]): number {
  const factor = points.reduce((acc, point) => acc * (1 + point.value / 100), 1);
  return (factor - 1) * 100;
}

/** Converte uma taxa diária em taxa anual equivalente (252 dias úteis). */
export function annualizeDailyRate(dailyPercent: number): number {
  return ((1 + dailyPercent / 100) ** BUSINESS_DAYS_PER_YEAR - 1) * 100;
}

const TREND_EPSILON = 0.00005;

async function buildExtra(
  code: IndicatorCode,
  sgsCode: number,
  current: number,
): Promise<IndicatorSummary["extra"]> {
  if (code === "ipca") {
    const last12 = await fetchSeries(sgsCode, 12);
    return {
      label: "Acumulado 12 meses",
      value: `${formatNumber(compoundAccumulated(last12))}%`,
    };
  }

  if (code === "cdi") {
    return {
      label: "Equivalente anual",
      value: `${formatNumber(annualizeDailyRate(current))}% a.a.`,
    };
  }

  return undefined;
}

export async function getIndicator(
  code: IndicatorCode,
  points = DEFAULT_POINTS,
): Promise<IndicatorSummary> {
  const meta = INDICATOR_META[code];
  const series = await fetchSeries(meta.sgsCode, points);

  const current = series[series.length - 1];
  const previous = series[series.length - 2] ?? current;

  const variation = current.value - previous.value;
  const variationPercent = previous.value !== 0 ? (variation / previous.value) * 100 : 0;
  const trend = variation > TREND_EPSILON ? "up" : variation < -TREND_EPSILON ? "down" : "stable";

  return {
    code,
    sgsCode: meta.sgsCode,
    label: meta.label,
    unit: meta.unit,
    description: meta.description,
    decimals: meta.decimals,
    prefix: meta.prefix,
    current: current.value,
    previous: previous.value,
    variation,
    variationPercent,
    trend,
    updatedAt: current.date,
    series,
    extra: await buildExtra(code, meta.sgsCode, current.value),
  };
}

export interface IndicatorsReport {
  indicators: IndicatorSummary[];
  /** Séries que o BCB não devolveu nesta consulta, para avisar quem está lendo. */
  unavailable: string[];
}

/**
 * Uma série fora do ar não derruba o painel: as demais são exibidas e a falha
 * é reportada explicitamente, em vez de sumir da tela sem explicação.
 */
export async function getIndicatorsReport(): Promise<IndicatorsReport> {
  const codes: IndicatorCode[] = ["selic", "cdi", "ipca", "dolar"];
  const results = await Promise.allSettled(codes.map((code) => getIndicator(code)));

  const indicators: IndicatorSummary[] = [];
  const unavailable: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      indicators.push(result.value);
      return;
    }
    const label = INDICATOR_META[codes[index]].label;
    unavailable.push(label);
    console.error(`[BCB] Indicador "${codes[index]}" indisponível:`, result.reason);
  });

  return { indicators, unavailable };
}

export async function getAllIndicators(): Promise<IndicatorSummary[]> {
  const { indicators } = await getIndicatorsReport();
  return indicators;
}
