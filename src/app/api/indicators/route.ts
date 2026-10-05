import { NextResponse, type NextRequest } from "next/server";
import { getAllIndicators } from "@/lib/bcb/service";
import { RateLimiter } from "@/lib/security/rateLimit";

/** O ticker consulta a cada 60s; 20 chamadas por minuto cobrem abas múltiplas. */
const limiter = new RateLimiter({ limit: 20, windowMs: 60_000 });

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "desconhecido";
}

export async function GET(request: NextRequest) {
  if (!limiter.take(clientKey(request))) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const indicators = await getAllIndicators();
    return NextResponse.json(
      { indicators, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    // O detalhe fica no log do servidor; o cliente recebe só a mensagem genérica.
    console.error("[BCB] falha ao montar a resposta de indicadores:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar a API do Banco Central agora." },
      { status: 502 },
    );
  }
}
