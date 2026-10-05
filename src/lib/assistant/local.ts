import type { IndicatorSummary } from "@/lib/bcb/types";
import { annualizeDailyRate, compoundAccumulated } from "@/lib/bcb/service";
import { buildInsights } from "@/lib/bcb/insights";
import { formatNumber } from "@/lib/format";

/**
 * Motor determinístico: responde às perguntas mais comuns direto das séries do
 * Banco Central, sem depender de LLM. É o modo padrão quando não há chave de
 * API configurada — e serve de rede de segurança quando a chamada ao modelo
 * falha.
 */

const INDICATOR_ALIASES: Record<string, string[]> = {
  selic: ["selic", "juros basicos", "taxa basica", "copom"],
  cdi: ["cdi", "interbancario", "interbancário"],
  ipca: ["ipca", "inflacao", "inflação", "precos", "preços"],
  dolar: ["dolar", "dólar", "ptax", "cambio", "câmbio", "moeda americana"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function detectIndicators(question: string): string[] {
  const texto = normalize(question);
  return Object.entries(INDICATOR_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => texto.includes(normalize(alias))))
    .map(([code]) => code);
}

/** Extrai um valor monetário em pt-BR: "R$ 5.000,50", "5000", "2 mil". */
function detectAmount(question: string): number | null {
  const comMil = question.match(/(\d+(?:[.,]\d+)?)\s*mil\b/i);
  if (comMil) {
    return Number.parseFloat(comMil[1].replace(".", "").replace(",", ".")) * 1000;
  }

  const bruto = question.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i);
  if (!bruto) return null;

  const valor = Number.parseFloat(bruto[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(valor) ? valor : null;
}

function describe(indicator: IndicatorSummary): string {
  const valor = `${indicator.prefix ?? ""}${formatNumber(indicator.current, indicator.decimals)}`;
  const unidade = indicator.prefix ? "" : ` ${indicator.unit}`;
  const movimento =
    indicator.trend === "stable"
      ? "estável em relação à leitura anterior"
      : `${indicator.trend === "up" ? "em alta" : "em queda"} de ${formatNumber(Math.abs(indicator.variation), indicator.decimals)} ante a leitura anterior`;

  return `${indicator.label} está em ${valor}${unidade}, ${movimento} (atualizado em ${indicator.updatedAt}).`;
}

function rendimentoCdi(indicator: IndicatorSummary, valor: number): string {
  const anual = annualizeDailyRate(indicator.current);
  const bruto = valor * (anual / 100);
  return [
    `A ${formatNumber(anual)}% ao ano (100% do CDI, taxa diária atual de ${formatNumber(indicator.current, 4)}%),`,
    `R$ ${formatNumber(valor)} rendem cerca de R$ ${formatNumber(bruto)} em 12 meses,`,
    `chegando a R$ ${formatNumber(valor + bruto)} — valor bruto, antes de imposto de renda.`,
  ].join(" ");
}

function resumoGeral(indicators: IndicatorSummary[]): string {
  const linhas = indicators.map((indicator) => `• ${describe(indicator)}`);
  return [
    "Panorama atual, direto das séries do Banco Central:",
    ...linhas,
    "",
    "Posso detalhar juro real, inflação acumulada em 12 meses, oscilação do dólar ou quanto um valor rende no CDI.",
  ].join("\n");
}

export function answerLocally(question: string, indicators: IndicatorSummary[]): string {
  if (indicators.length === 0) {
    return "Não consegui falar com a API do Banco Central agora, então prefiro não responder com número desatualizado. Tente de novo em instantes.";
  }

  const texto = normalize(question);
  const encontrados = detectIndicators(question);
  const porCodigo = (code: string) => indicators.find((i) => i.code === code);

  const cdi = porCodigo("cdi");
  const valor = detectAmount(question);
  const perguntaRendimento = /rend|aplic|invest|ganh|retorn/.test(texto);

  if (perguntaRendimento && cdi && valor) {
    return rendimentoCdi(cdi, valor);
  }

  if (/juro real/.test(texto)) {
    const juroReal = buildInsights(indicators).find((i) => i.title === "Juro real");
    if (juroReal) return `${juroReal.value} — ${juroReal.description}`;
  }

  const ipca = porCodigo("ipca");
  if (/meta|acima|abaixo|control/.test(texto) && ipca) {
    const comparacao = buildInsights(indicators).find((i) => i.title === "IPCA vs. meta");
    if (comparacao) return `${comparacao.value}. ${comparacao.description}`;
  }

  if (/acumulad|12 meses|doze meses|ano/.test(texto) && ipca) {
    const acumulado = compoundAccumulated(ipca.series.slice(-12));
    return `A inflação acumulada em 12 meses pelo IPCA está em ${formatNumber(acumulado)}%. A meta definida pelo CMN é de 3,00% ao ano.`;
  }

  if (encontrados.length === 1) {
    const indicator = porCodigo(encontrados[0]);
    if (indicator) {
      const extra = indicator.extra ? ` ${indicator.extra.label}: ${indicator.extra.value}.` : "";
      return `${describe(indicator)}${extra}`;
    }
  }

  if (encontrados.length > 1) {
    return encontrados
      .map((code) => porCodigo(code))
      .filter((i): i is IndicatorSummary => Boolean(i))
      .map((i) => `• ${describe(i)}`)
      .join("\n");
  }

  return resumoGeral(indicators);
}
