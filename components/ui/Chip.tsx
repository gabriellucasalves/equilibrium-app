import { Pressable, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radii.pill,
          backgroundColor: selected
            ? theme.colors.accent
            : theme.colors.surfaceMuted,
          opacity: pressed ? 0.85 : 1,
          borderWidth: 1,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        },
        style,
      ]}
    >
      <Text
        variant="label"
        color={selected ? 'inverse' : 'secondary'}
      >
        {label}
      </Text>
    </Pressable>
  );
}
