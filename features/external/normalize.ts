import { createId } from '@/utils/id';
import { distanceKm } from '@/features/external/distance';
import {
  preferHttpsUrl,
  sanitizeExternalText,
  wrapAsExternalData,
} from '@/features/external/security';
import type { ExternalKind, ExternalResult } from '@/features/external/types';

export type RawExternalItem = {
  title: string;
  description?: string;
  sourceName: string;
  sourceUrl: string;
  location?: string | null;
  priceInCents?: number | null;
  previousPriceInCents?: number | null;
  validUntil?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  category?: string | null;
  kind: ExternalKind;
  retrievedAt?: string;
};

export function normalizeExternalItem(
  raw: RawExternalItem,
  userCoords?: { lat: number; lng: number } | null,
): ExternalResult | null {
  const sourceUrl = preferHttpsUrl(raw.sourceUrl);
  if (!sourceUrl) return null;

  const title = sanitizeExternalText(raw.title, 120);
  const description = sanitizeExternalText(raw.description ?? '', 280);
  if (!title || !raw.sourceName.trim()) return null;

  const retrievedAt = raw.retrievedAt ?? new Date().toISOString();
  let dist: number | null = null;
  if (userCoords && raw.coordinates) {
    dist = Math.round(distanceKm(userCoords, raw.coordinates) * 10) / 10;
  }

  return {
    id: createId('ext'),
    kind: raw.kind,
    title,
    description,
    sourceName: sanitizeExternalText(raw.sourceName, 80),
    sourceUrl,
    retrievedAt,
    location: raw.location ? sanitizeExternalText(raw.location, 120) : null,
    priceInCents: raw.priceInCents ?? null,
    previousPriceInCents: raw.previousPriceInCents ?? null,
    validUntil: raw.validUntil ?? null,
    coordinates: raw.coordinates ?? null,
    distanceKm: dist,
    category: raw.category ?? null,
    externalDataSafe: wrapAsExternalData({
      title,
      description,
      sourceName: raw.sourceName,
      sourceUrl,
      location: raw.location,
      priceInCents: raw.priceInCents,
      validUntil: raw.validUntil,
    }),
  };
}
