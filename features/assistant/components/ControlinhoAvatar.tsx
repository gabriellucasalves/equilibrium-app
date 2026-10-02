import { useEffect } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import type { ControlinhoMood } from '@/features/assistant/types';
import { useTheme } from '@/lib/theme';

const MOOD_LABEL: Record<ControlinhoMood, string> = {
  idle: 'Pronto',
  thinking: 'Pensando…',
  searching: 'Buscando…',
  celebrating: 'Boa!',
  warning: 'Atenção',
  sleeping: 'Offline',
  happy: 'Boa notícia',
  alert: 'Atenção',
  speaking: 'Aqui vai',
};

function resolveVisualMood(mood: ControlinhoMood): ControlinhoMood {
  if (mood === 'happy') return 'celebrating';
  if (mood === 'alert') return 'warning';
  return mood;
}

export function ControlinhoAvatar({ mood }: { mood: ControlinhoMood }) {
  const theme = useTheme();
  const visual = resolveVisualMood(mood);
  const pulse = useSharedValue(1);
  const drift = useSharedValue(0);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled?.().then((reduce) => {
      if (!active || reduce || Platform.OS === 'web') {
        pulse.value = 1;
        drift.value = 0;
        return;
      }
      cancelAnimation(pulse);
      cancelAnimation(drift);
      if (visual === 'thinking' || visual === 'searching') {
        pulse.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 700 }),
            withTiming(1, { duration: 700 }),
          ),
          -1,
          false,
        );
      } else if (visual === 'celebrating') {
        pulse.value = withSequence(
          withTiming(1.08, { duration: 180 }),
          withTiming(1, { duration: 220 }),
        );
      } else if (visual === 'idle') {
        drift.value = withRepeat(
          withSequence(
            withTiming(-1.5, { duration: 1800 }),
            withTiming(1.5, { duration: 1800 }),
          ),
          -1,
          true,
        );
      } else {
        pulse.value = 1;
        drift.value = 0;
      }
    });
    return () => {
      active = false;
      cancelAnimation(pulse);
      cancelAnimation(drift);
    };
  }, [visual, pulse, drift]);

  const accent =
    visual === 'warning'
      ? theme.colors.danger
      : visual === 'sleeping'
        ? theme.colors.textSecondary
        : theme.colors.accent;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { translateY: drift.value }],
  }));

  return (
    <View
      style={{ alignItems: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={`Controlinho, ${MOOD_LABEL[mood]}`}
    >
      <Animated.View
        style={[
          {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.colors.accentSoft,
            borderWidth: 2,
            borderColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: visual === 'sleeping' ? 0.55 : 1,
          },
          animatedStyle,
        ]}
      >
        <Text variant="title" color="accent">
          C
        </Text>
      </Animated.View>
      <Text variant="caption" color="secondary" style={{ marginTop: 6 }}>
        {MOOD_LABEL[mood]}
      </Text>
    </View>
  );
}
