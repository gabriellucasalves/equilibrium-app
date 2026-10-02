import { ASSISTANT_LIMITS } from '@/constants/feature-flags';

const stamps: number[] = [];

export function canRunExternalSearch(now = Date.now()): boolean {
  const windowMs = 60_000;
  while (stamps.length > 0 && now - stamps[0]! > windowMs) {
    stamps.shift();
  }
  return stamps.length < ASSISTANT_LIMITS.externalRateLimitPerMinute;
}

export function markExternalSearch(now = Date.now()): void {
  stamps.push(now);
}

/** Testes. */
export function resetExternalRateLimit(): void {
  stamps.length = 0;
}
