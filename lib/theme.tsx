import React, { createContext, useContext, useMemo } from 'react';

import {
  colorSchemes,
  radii,
  spacing,
  typography,
  type ThemeColors,
} from '@/constants/tokens';
import { useColorScheme } from '@/hooks/useColorScheme';

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: colorSchemes[scheme],
      spacing,
      radii,
      typography,
    }),
    [scheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de AppThemeProvider');
  }
  return ctx;
}
