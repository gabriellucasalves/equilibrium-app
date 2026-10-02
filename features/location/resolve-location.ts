import * as Location from 'expo-location';

import { FEATURE_FLAGS } from '@/constants/feature-flags';
import type { LocationContext } from '@/features/location/types';
import { useLocationPreferencesStore } from '@/store/location-preferences-store';

export type LocationResolveResult =
  | { status: 'ready'; context: LocationContext }
  | { status: 'needs_permission' }
  | { status: 'needs_manual' }
  | { status: 'disabled' };

/** Resolve contexto aproximado. Não persiste coordenadas precisas. */
export async function resolveLocationContext(options?: {
  requestPermission?: boolean;
}): Promise<LocationResolveResult> {
  if (!FEATURE_FLAGS.LOCATION_FEATURES_ENABLED) {
    return { status: 'disabled' };
  }

  const prefs = useLocationPreferencesStore.getState();
  if (prefs.mode === 'disabled') {
    return { status: 'disabled' };
  }

  if (prefs.mode === 'manual') {
    if (!prefs.manualCity || !prefs.manualState) {
      return { status: 'needs_manual' };
    }
    return {
      status: 'ready',
      context: {
        city: prefs.manualCity,
        state: prefs.manualState,
        country: 'BR',
        coordinates: null,
        source: 'manual',
      },
    };
  }

  // automatic
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    if (!options?.requestPermission) {
      return { status: 'needs_permission' };
    }
    const asked = await Location.requestForegroundPermissionsAsync();
    if (!asked.granted) {
      return { status: 'needs_manual' };
    }
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const city =
      place?.city || place?.subregion || place?.district || 'Sua região';
    const state = (place?.region || '').slice(0, 2).toUpperCase() || 'BR';
    return {
      status: 'ready',
      context: {
        city,
        state,
        country: place?.isoCountryCode || 'BR',
        // coords só em memória para distância — não vão ao LLM
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        source: 'gps',
      },
    };
  } catch {
    return { status: 'needs_manual' };
  }
}

export function locationLabel(ctx: LocationContext): string {
  return `${ctx.city}, ${ctx.state}`;
}
