interface Bucket {
  tokens: number;
  updatedAt: number;
}

export interface RateLimitOptions {
  /** Quantidade de eventos permitidos dentro da janela. */
  limit: number;
  /** Janela em milissegundos. */
  windowMs: number;
}

/**
 * Token bucket em memória: suficiente para uma instância única.
 * Em um deploy com múltiplas réplicas isto precisa migrar para Redis — do
 * contrário cada réplica aplica o próprio limite.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly refillPerMs: number;

  constructor(private readonly options: RateLimitOptions) {
    this.refillPerMs = options.limit / options.windowMs;
  }

  /** Retorna true quando o evento pode prosseguir. */
  take(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key);

    if (!bucket) {
      this.buckets.set(key, { tokens: this.options.limit - 1, updatedAt: now });
      return true;
    }

    const refilled = Math.min(
      this.options.limit,
      bucket.tokens + (now - bucket.updatedAt) * this.refillPerMs,
    );
    bucket.updatedAt = now;

    if (refilled < 1) {
      bucket.tokens = refilled;
      return false;
    }

    bucket.tokens = refilled - 1;
    return true;
  }

  forget(key: string): void {
    this.buckets.delete(key);
  }

  /** Remove buckets ociosos para o mapa não crescer indefinidamente. */
  prune(now = Date.now()): void {
    const maxIdle = this.options.windowMs * 4;
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.updatedAt > maxIdle) this.buckets.delete(key);
    }
  }
}
