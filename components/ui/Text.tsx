import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { typography } from '@/constants/tokens';
import { useTheme } from '@/lib/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type VariantMeta = {
  size: keyof typeof typography.sizes;
  font: keyof typeof typography.fonts;
  secondary?: boolean;
};

const variantStyle: Record<Variant, VariantMeta> = {
  hero: { size: 'hero', font: 'display' },
  title: { size: 'xxl', font: 'display' },
  subtitle: { size: 'lg', font: 'body' },
  body: { size: 'md', font: 'body' },
  caption: { size: 'sm', font: 'body', secondary: true },
  label: { size: 'sm', font: 'bodySemi' },
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: 'default' | 'secondary' | 'accent' | 'inverse' | 'danger';
  align?: TextStyle['textAlign'];
};

export function Text({
  variant = 'body',
  color = 'default',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const meta = variantStyle[variant];

  const colorMap = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    accent: theme.colors.accent,
    inverse: theme.colors.textInverse,
    danger: theme.colors.danger,
  } as const;

  return (
    <RNText
      style={[
        {
          fontFamily: theme.typography.fonts[meta.font],
          fontSize: theme.typography.sizes[meta.size],
          lineHeight:
            theme.typography.sizes[meta.size] *
            (variant === 'hero' || variant === 'title'
              ? theme.typography.lineHeights.tight
              : theme.typography.lineHeights.normal),
          color:
            color === 'default' && meta.secondary
              ? theme.colors.textSecondary
              : colorMap[color],
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}
