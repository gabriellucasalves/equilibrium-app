/**
 * Design tokens — única fonte de cores/espaçamento/tipografia.
 * Componentes não devem usar hex soltos.
 */

export const palette = {
  sage50: '#F3F7F4',
  sage100: '#E4EDE7',
  sage200: '#C8D9CE',
  sage500: '#3D7A62',
  sage600: '#2F6150',
  sage700: '#244C3E',
  ink900: '#141A17',
  ink700: '#2C3631',
  ink500: '#5A6860',
  ink300: '#9AABA2',
  cream: '#FAFBF9',
  white: '#FFFFFF',
  night950: '#0E1311',
  night900: '#161C19',
  night800: '#1F2824',
  danger: '#B33B3B',
  warning: '#C4872A',
  success: '#2F6150',
} as const;

export const colorSchemes = {
  light: {
    background: palette.cream,
    surface: palette.white,
    surfaceMuted: palette.sage50,
    text: palette.ink900,
    textSecondary: palette.ink500,
    textInverse: palette.white,
    accent: palette.sage600,
    accentSoft: palette.sage100,
    border: palette.sage200,
    danger: palette.danger,
    warning: palette.warning,
    success: palette.success,
    progressTrack: palette.sage100,
    progressFill: palette.sage600,
    overlay: 'rgba(20, 26, 23, 0.4)',
  },
  dark: {
    background: palette.night950,
    surface: palette.night900,
    surfaceMuted: palette.night800,
    text: palette.sage50,
    textSecondary: palette.ink300,
    textInverse: palette.ink900,
    accent: '#6BA890',
    accentSoft: '#24352E',
    border: '#2E3B35',
    danger: '#E07070',
    warning: '#E0A84A',
    success: '#6BA890',
    progressTrack: '#24352E',
    progressFill: '#6BA890',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },
} as const;

export type ThemeColors = (typeof colorSchemes)[keyof typeof colorSchemes];
export type ColorSchemeName = keyof typeof colorSchemes;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  fonts: {
    display: 'Fraunces_600SemiBold',
    displayRegular: 'Fraunces_400Regular',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodySemi: 'DMSans_600SemiBold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;

export const motion = {
  fast: 160,
  normal: 240,
  slow: 360,
} as const;
