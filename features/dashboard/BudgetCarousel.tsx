import { Pressable, ScrollView, View } from 'react-native';

import { ProgressBar, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import type { BudgetProgress } from '@/types/finance';
import { formatCentsToBRL } from '@/utils/money';

type Props = {
  items: BudgetProgress[];
  onPressAll?: () => void;
};

function toneFor(usagePercent: number): 'default' | 'warning' | 'danger' {
  if (usagePercent >= 100) return 'danger';
  if (usagePercent >= 80) return 'warning';
  return 'default';
}

export function BudgetCarousel({ items, onPressAll }: Props) {
  const theme = useTheme();

  if (items.length === 0) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
        }}
      >
        <Text variant="body" color="secondary">
          Defina limites em Planejamento para acompanhar o mês com calma.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text variant="label" color="secondary">
          Orçamentos
        </Text>
        {onPressAll ? (
          <Pressable onPress={onPressAll}>
            <Text variant="caption" color="accent">
              Ver todos
            </Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingRight: theme.spacing.md }}
      >
        {items.map((item) => (
          <View
            key={item.categoryKey}
            style={{
              width: 168,
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.lg,
              padding: theme.spacing.md,
            }}
          >
            <Text variant="label">{item.label}</Text>
            <Spacer size="xs" />
            <Text variant="caption">
              {formatCentsToBRL(item.spentCents)} de{' '}
              {formatCentsToBRL(item.limitCents)}
            </Text>
            <Spacer size="sm" />
            <ProgressBar
              progress={Math.min(1, item.usagePercent / 100)}
              tone={toneFor(item.usagePercent)}
            />
            <Spacer size="xs" />
            <Text variant="caption" color={item.usagePercent >= 100 ? 'danger' : 'secondary'}>
              {item.usagePercent}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
