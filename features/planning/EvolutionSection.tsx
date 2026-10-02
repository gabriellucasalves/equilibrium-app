import { View } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import { currentMonthKey } from '@/utils/date';
import { buildMonthSummary, categoryLabel } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';
import { monthLabelBR, shiftMonthKey } from '@/utils/month';

export function EvolutionSection() {
  const theme = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const monthlyIncomeCents = useFinanceStore((s) => s.monthlyIncomeCents);
  const monthKey = currentMonthKey();

  const months = Array.from({ length: 6 }, (_, i) =>
    shiftMonthKey(monthKey, -5 + i),
  );

  const series = months.map((key) => {
    const summary = buildMonthSummary(transactions, key, monthlyIncomeCents);
    return { key, ...summary };
  });

  const current = series[series.length - 1]!;
  const previous = series[series.length - 2]!;
  const delta = current.expenseCents - previous.expenseCents;
  const maxExpense = Math.max(...series.map((s) => s.expenseCents), 1);

  const prevKey = previous.key;
  const currKey = current.key;
  const map = new Map<string, { prev: number; curr: number }>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const mk = tx.date.slice(0, 7);
    if (mk !== prevKey && mk !== currKey) continue;
    const entry = map.get(tx.categoryKey) ?? { prev: 0, curr: 0 };
    if (mk === prevKey) entry.prev += tx.amountCents;
    else entry.curr += tx.amountCents;
    map.set(tx.categoryKey, entry);
  }
  const categoryDeltas = [...map.entries()]
    .map(([key, v]) => ({
      key,
      label: categoryLabel(key),
      delta: v.curr - v.prev,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <View>
      <Text variant="caption" color="secondary">
        Últimos 6 meses — gastos por mês
      </Text>
      <Spacer size="md" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          height: 120,
        }}
        accessibilityLabel="Gráfico de gastos dos últimos meses"
      >
        {series.map((s) => (
          <View key={s.key} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{
                width: '80%',
                height: Math.max(4, (s.expenseCents / maxExpense) * 100),
                backgroundColor: theme.colors.accent,
                borderRadius: 4,
              }}
            />
            <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
              {monthLabelBR(s.key).slice(0, 3)}
            </Text>
          </View>
        ))}
      </View>
      <Spacer size="lg" />
      <Text variant="label">
        {monthLabelBR(previous.key)} → {monthLabelBR(current.key)}
      </Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        {formatCentsToBRL(previous.expenseCents)} →{' '}
        {formatCentsToBRL(current.expenseCents)}
        {delta === 0
          ? ' (igual)'
          : delta > 0
            ? ` (↑ ${formatCentsToBRL(delta)})`
            : ` (↓ ${formatCentsToBRL(Math.abs(delta))})`}
      </Text>
      <Spacer size="md" />
      <Text variant="caption" color="secondary">
        Categorias que mais mudaram
      </Text>
      <Spacer size="xs" />
      {categoryDeltas.map((c) => (
        <Text key={c.key} variant="caption">
          {c.label}:{' '}
          {c.delta === 0
            ? 'sem mudança'
            : c.delta > 0
              ? `+${formatCentsToBRL(c.delta)}`
              : `−${formatCentsToBRL(Math.abs(c.delta))}`}
        </Text>
      ))}
    </View>
  );
}
