import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { Chip, EmptyState, Screen, Skeleton, Spacer, Text } from '@/components/ui';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import type { Transaction } from '@/types/finance';
import { currentMonthKey } from '@/utils/date';
import { filterTransactionsByMonth } from '@/utils/finance-summary';

type Filter = 'all' | 'income' | 'expense';

const PAGE_SIZE = 30;

export default function TransactionsScreen() {
  const theme = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const hydrated = useFinanceStore((s) => s.hydrated);
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const monthKey = currentMonthKey();

  const list = useMemo(() => {
    const month = filterTransactionsByMonth(transactions, monthKey);
    const filtered =
      filter === 'all' ? month : month.filter((t) => t.type === filter);
    return filtered
      .slice()
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      );
  }, [transactions, monthKey, filter]);

  const visible = list.slice(0, visibleCount);

  const onEndReached = useCallback(() => {
    setVisibleCount((n) => Math.min(list.length, n + PAGE_SIZE));
  }, [list.length]);

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionRow
        transaction={item}
        onPress={() =>
          router.push({
            pathname: '/(app)/transaction/form',
            params: { id: item.id },
          })
        }
      />
    ),
    [],
  );

  return (
    <Screen scroll={false}>
      <Text variant="title" accessibilityRole="header">
        Movimentações
      </Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Tudo que entrou e saiu neste mês.
      </Text>
      <Spacer size="lg" />
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        <Chip
          label="Todas"
          selected={filter === 'all'}
          onPress={() => {
            setFilter('all');
            setVisibleCount(PAGE_SIZE);
          }}
        />
        <Chip
          label="Receitas"
          selected={filter === 'income'}
          onPress={() => {
            setFilter('income');
            setVisibleCount(PAGE_SIZE);
          }}
        />
        <Chip
          label="Despesas"
          selected={filter === 'expense'}
          onPress={() => {
            setFilter('expense');
            setVisibleCount(PAGE_SIZE);
          }}
        />
      </View>
      <Spacer size="md" />
      {!hydrated ? (
        <>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          initialNumToRender={PAGE_SIZE}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={7}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma movimentação"
              body="Registre um gasto ou receita para começar a acompanhar o mês."
              actionLabel="Adicionar despesa"
              onAction={() =>
                router.push({
                  pathname: '/(app)/transaction/form',
                  params: { type: 'expense' },
                })
              }
            />
          }
          ListFooterComponent={
            visible.length < list.length ? (
              <Text
                variant="caption"
                color="secondary"
                style={{ textAlign: 'center', paddingVertical: 12 }}
              >
                Carregando mais…
              </Text>
            ) : (
              <View style={{ height: theme.spacing.xxxl }} />
            )
          }
          style={{ flex: 1 }}
        />
      )}
    </Screen>
  );
}
