import { View } from 'react-native';

import { EmptyState, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import { useRecurringStore } from '@/store/recurring-store';
import { useGoalsStore } from '@/store/goals-store';
import { currentMonthKey, formatISODateBR } from '@/utils/date';
import { filterTransactionsByMonth } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';
import { effectiveRecurringAmountCents } from '@/utils/recurring';

type CalItem = {
  id: string;
  date: string;
  title: string;
  amountLabel: string;
  kind: 'income' | 'expense' | 'recurring' | 'goal';
};

export function CalendarSection() {
  const theme = useTheme();
  const monthKey = currentMonthKey();
  const transactions = useFinanceStore((s) => s.transactions);
  const recurring = useRecurringStore((s) => s.items);
  const goals = useGoalsStore((s) => s.goals);

  const items: CalItem[] = [];

  for (const tx of filterTransactionsByMonth(transactions, monthKey)) {
    items.push({
      id: `tx-${tx.id}`,
      date: tx.date,
      title: tx.note || (tx.type === 'income' ? 'Receita' : 'Despesa'),
      amountLabel: `${tx.type === 'income' ? '+' : '−'}${formatCentsToBRL(tx.amountCents)}`,
      kind: tx.type,
    });
  }

  for (const r of recurring.filter((x) => x.isActive)) {
    if (!r.nextDueDate.startsWith(monthKey)) continue;
    const amount = effectiveRecurringAmountCents(r);
    items.push({
      id: `rec-${r.id}`,
      date: r.nextDueDate,
      title: r.name,
      amountLabel: amount > 0 ? formatCentsToBRL(amount) : 'Variável',
      kind: 'recurring',
    });
  }

  for (const g of goals) {
    if (!g.targetDate || !g.targetDate.startsWith(monthKey)) continue;
    items.push({
      id: `goal-${g.id}`,
      date: g.targetDate,
      title: `Meta: ${g.name}`,
      amountLabel: formatCentsToBRL(g.targetAmountCents),
      kind: 'goal',
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  if (items.length === 0) {
    return (
      <EmptyState
        title="Calendário do mês"
        body="Quando houver receitas, contas ou prazos de metas, eles aparecem aqui em ordem."
      />
    );
  }

  let lastDate = '';
  return (
    <View>
      <Text variant="caption" color="secondary">
        Lista cronológica do mês — simples e clara.
      </Text>
      <Spacer size="md" />
      {items.map((item) => {
        const showDate = item.date !== lastDate;
        lastDate = item.date;
        return (
          <View key={item.id} style={{ marginBottom: theme.spacing.sm }}>
            {showDate ? (
              <>
                <Text variant="label">{formatISODateBR(item.date)}</Text>
                <Spacer size="xs" />
              </>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text variant="body">{item.title}</Text>
              <Text
                variant="caption"
                color={item.kind === 'income' ? 'accent' : 'default'}
              >
                {item.amountLabel}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
