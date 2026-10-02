import { View } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import type { DeterministicInsight } from '@/features/assistant/services/insight-engine';
import { useTheme } from '@/lib/theme';

export function InsightCards({ insights }: { insights: DeterministicInsight[] }) {
  const theme = useTheme();
  if (insights.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label" color="secondary">
        Insights do mês
      </Text>
      {insights.slice(0, 6).map((insight) => {
        const statusLabel =
          insight.severity === 'warning'
            ? 'Atenção'
            : insight.severity === 'positive'
              ? 'Positivo'
              : 'Informação';
        return (
          <View
            key={insight.id}
            accessibilityLabel={`${statusLabel}: ${insight.title}. ${insight.body}`}
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surfaceMuted,
              borderLeftWidth: 3,
              borderLeftColor:
                insight.severity === 'warning'
                  ? theme.colors.danger
                  : insight.severity === 'positive'
                    ? theme.colors.accent
                    : theme.colors.border,
            }}
          >
            <Text variant="caption" color="secondary">
              {statusLabel}
            </Text>
            <Text variant="label">{insight.title}</Text>
            <Spacer size="xs" />
            <Text variant="caption" color="secondary">
              {insight.body}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
