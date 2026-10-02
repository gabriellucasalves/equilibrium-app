import { View } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import { useRecurringStore } from '@/store/recurring-store';
import { currentMonthKey, toISODate } from '@/utils/date';
import { getMonthProjection } from '@/utils/month-projection';
import { formatCentsToBRL } from '@/utils/money';

export function ProjectionCard() {
  const theme = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const monthlyIncomeCents = useFinanceStore((s) => s.monthlyIncomeCents);
  const recurring = useRecurringStore((s) => s.items);

  const projection = getMonthProjection({
    transactions,
    recurring,
    monthKey: currentMonthKey(),
    monthlyIncomeCents,
    todayISO: toISODate(),
  });

  return (
    <View
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surfaceMuted,
        marginBottom: theme.spacing.md,
      }}
      accessibilityLabel="Projeção do mês"
    >
      <Text variant="label">Projeção do mês</Text>
      <Spacer size="xs" />
      <Text variant="caption" color="secondary">
        Estimativa — não é o saldo atual da sua conta.
      </Text>
      <Spacer size="sm" />
      <Text variant="body">
        Disponível agora: {formatCentsToBRL(projection.currentAvailableCents)}
      </Text>
      <Text variant="body">
        Contas previstas: {formatCentsToBRL(projection.upcomingRecurringCents)}
        {projection.upcomingCount > 0
          ? ` (${projection.upcomingCount})`
          : ''}
      </Text>
      <Text variant="label" color="accent">
        Disponível projetado:{' '}
        {formatCentsToBRL(projection.projectedAvailableCents)}
      </Text>
    </View>
  );
}
