import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, EmptyState, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useRecurringStore } from '@/store/recurring-store';
import { categoryLabel } from '@/utils/finance-summary';
import { formatISODateBR } from '@/utils/date';
import { formatCentsToBRL } from '@/utils/money';
import {
  dueUrgency,
  dueUrgencyLabel,
  effectiveRecurringAmountCents,
  advanceAfterPayment,
} from '@/utils/recurring';
import { softSuccessHaptic } from '@/lib/haptics';

export function RecurringSection() {
  const theme = useTheme();
  const items = useRecurringStore((s) => s.items).filter((r) => r.isActive);
  const dismissThisMonth = useRecurringStore((s) => s.dismissThisMonth);
  const updateItem = useRecurringStore((s) => s.updateItem);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';

  if (items.length === 0) {
    return (
      <EmptyState
        title="Contas do mês"
        body="Adicione contas que aparecem todo mês para visualizar seu mês antes que ele aconteça."
        actionLabel="Adicionar conta"
        onAction={() => router.push('/(app)/recurring/form')}
      />
    );
  }

  return (
    <View>
      {items
        .slice()
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
        .map((item) => {
          const urgency = dueUrgency(item.nextDueDate);
          const amount = effectiveRecurringAmountCents(item);
          const label = dueUrgencyLabel(urgency);
          return (
            <View
              key={item.id}
              style={{
                marginBottom: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <Text variant="label">{item.name}</Text>
                <Text variant="caption">
                  {amount > 0 ? formatCentsToBRL(amount) : 'Valor variável'}
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                {categoryLabel(item.categoryKey)} ·{' '}
                {formatISODateBR(item.nextDueDate)}
                {label ? ` · ${label}` : ''}
              </Text>
              <Spacer size="sm" />
              <Button
                label="Registrar pagamento"
                onPress={() => {
                  router.push({
                    pathname: '/(app)/transaction/form',
                    params: {
                      type: 'expense',
                      prefillNote: item.name,
                      prefillCategory: item.categoryKey,
                      prefillAmount:
                        amount > 0
                          ? formatCentsToBRL(amount).replace('R$\u00a0', '')
                          : '',
                      recurringId: item.id,
                    },
                  });
                }}
              />
              <Spacer size="xs" />
              <Button
                label="Dispensar este mês"
                variant="ghost"
                onPress={() => {
                  void dismissThisMonth(item.id, isDemo).then(() =>
                    softSuccessHaptic(),
                  );
                }}
              />
              <Button
                label="Adiar"
                variant="ghost"
                onPress={() => {
                  const next = advanceAfterPayment(item);
                  void updateItem(item.id, { nextDueDate: next }, isDemo);
                }}
              />
            </View>
          );
        })}
      <Button
        label="Nova conta"
        variant="secondary"
        onPress={() => router.push('/(app)/recurring/form')}
      />
    </View>
  );
}
