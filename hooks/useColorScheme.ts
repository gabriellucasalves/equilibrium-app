import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useOnboardingStore } from '@/store/onboarding-store';
import type { ColorSchemeName } from '@/constants/tokens';

export function useColorScheme(): ColorSchemeName {
  const preference = useOnboardingStore((s) => s.themePreference);
  const system = useSystemColorScheme();

  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}
