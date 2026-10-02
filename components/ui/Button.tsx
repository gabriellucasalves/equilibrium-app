import { useState } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const backgrounds = {
    primary: theme.colors.accent,
    secondary: theme.colors.accentSoft,
    ghost: 'transparent',
  } as const;

  const labelColors = {
    primary: 'inverse' as const,
    secondary: 'accent' as const,
    ghost: 'secondary' as const,
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderRadius: theme.radii.lg,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          borderWidth: focused || variant === 'ghost' ? 1 : 0,
          borderColor: focused ? theme.colors.accent : theme.colors.border,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text variant="label" color={labelColors[variant]} align="center">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
