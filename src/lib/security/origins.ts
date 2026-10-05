function resolve(): string[] {
  const configured = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) return configured;

  // Fail closed: em produção o servidor recusa subir sem a lista de origens.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ALLOWED_ORIGINS não configurado. Defina as origens permitidas (ex: https://seu-dominio.com) antes de subir em produção.",
    );
  }

  const port = process.env.PORT ?? "3000";
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}

/** Resolvido uma única vez na inicialização para falhar cedo, não por requisição. */
const ORIGINS = resolve();

export function allowedOrigins(): string[] {
  return ORIGINS;
}

/**
 * Bloqueia o sequestro de WebSocket por outro site (CSWSH).
 *
 * O navegador só manda `Origin` quando a requisição é de outra origem — que é
 * exatamente o caso do ataque. O handshake de mesma origem chega sem o
 * cabeçalho, então recusar a ausência derrubaria o próprio app.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return ORIGINS.includes(origin);
}
