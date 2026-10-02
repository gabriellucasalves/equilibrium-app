import { distanceKm, formatDistanceKm } from '@/features/external/distance';

describe('distanceKm', () => {
  it('calcula distância aproximada', () => {
    const km = distanceKm(
      { lat: -16.066, lng: -47.976 },
      { lat: -16.07, lng: -47.98 },
    );
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
    expect(formatDistanceKm(2.4)).toBe('2,4 km');
  });
});
