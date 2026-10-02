import { View } from 'react-native';

import { useTheme } from '@/lib/theme';

export type ProgressBarProps = {
  /** 0–1 */
  progress: number;
  tone?: 'default' | 'warning' | 'danger';
  height?: number;
};

export function ProgressBar({
  progress,
  tone = 'default',
  height = 6,
}: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const fill =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.progressFill;

  return (
    <View
      accessibilityRole="progressbar"
      style={{
        height,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.progressTrack,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: fill,
          borderRadius: theme.radii.pill,
        }}
      />
    </View>
  );
}
