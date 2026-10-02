type ExternalObsEvent = {
  provider: string;
  kind: string;
  latencyMs: number;
  status: 'ok' | 'error' | 'cache' | 'offline' | 'rate_limited' | 'unavailable';
  resultCount: number;
  cacheHit: boolean;
};

/** Sem coordenadas, sem lista de compras, sem texto sensível. */
export function logExternalSearch(event: ExternalObsEvent): void {
  if (!__DEV__) return;
  console.info('[external-search]', {
    provider: event.provider,
    kind: event.kind,
    latencyMs: event.latencyMs,
    status: event.status,
    resultCount: event.resultCount,
    cacheHit: event.cacheHit,
  });
}
