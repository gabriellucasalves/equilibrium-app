import { router } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { View } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { AvailableCard } from '@/features/dashboard/AvailableCard';
import { BudgetCarousel } from '@/features/dashboard/BudgetCarousel';
import { SummaryRow } from '@/features/dashboard/SummaryRow';
import { ProjectionCard } from '@/features/planning/ProjectionCard';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useAssistantStore } from '@/store/assistant-store';
import { useFinanceStore } from '@/store/finance-store';
import { useGoalsStore } from '@/store/goals-store';
import { useRecurringStore } from '@/store/recurring-store';
import { currentMonthKey, formatISODateBR } from '@/utils/date';
import {
  buildBudgetProgress,
  buildMonthSummary,
  filterTransactionsByMonth,
} from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';
import { dueUrgency, dueUrgencyLabel, effectiveRecurringAmountCents } from '@/utils/recurring';
import { syncLocalNotifications } from '@/features/notifications/scheduler';

export type HomeSectionId =
  | 'greeting'
  | 'available'
  | 'insight'
  | 'budgets'
  | 'upcoming'
  | 'recent';

/** Ordem modular — reordenação futura sem drag-and-drop nesta fase. */
export const DEFAULT_HOME_SECTIONS: HomeSectionId[] = [
  'greeting',
  'available',
  'insight',
  'budgets',
  'upcoming',
  'recent',
];

export function HomeBody({
  greeting,
  syncBanner,
}: {
  greeting: ReactNode;
  syncBanner?: ReactNode;
}) {
  const theme = useTheme();
  const monthlyIncomeCents = useFinanceStore((s) => s.monthlyIncomeCents);
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';
  const insights = useAssistantStore((s) => s.insights);
  const refreshInsights = useAssistantStore((s) => s.refreshInsights);
  const recurring = useRecurringStore((s) => s.items);
  const hydrateRecurring = useRecurringStore((s) => s.hydrate);
  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const goals = useGoalsStore((s) => s.goals);

  useEffect(() => {
    void hydrateRecurring(isDemo);
    void hydrateGoals(isDemo);
    refreshInsights();
  }, [hydrateRecurring, hydrateGoals, isDemo, refreshInsights]);

  const monthKey = currentMonthKey();
  const summary = useMemo(
    () => buildMonthSummary(transactions, monthKey, monthlyIncomeCents),
    [transactions, monthKey, monthlyIncomeCents],
  );
  const budgetItems = useMemo(
    () => buildBudgetProgress(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );
  const recent = useMemo(
    () =>
      filterTransactionsByMonth(transactions, monthKey)
        .slice()
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.createdAt.localeCompare(a.createdAt),
        )
        .slice(0, 5),
    [transactions, monthKey],
  );
  const upcoming = useMemo(
    () =>
      recurring
        .filter((r) => r.isActive)
        .filter((r) => {
          const u = dueUrgency(r.nextDueDate);
          return u === 'overdue' || u === 'today' || u === 'tomorrow' || u === 'soon';
        })
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
        .slice(0, 4),
    [recurring],
  );

  useEffect(() => {
    void syncLocalNotifications({
      recurring,
      budgets: budgetItems,
      goals,
    });
  }, [recurring, budgetItems, goals]);

  const primaryInsight = insights[0];

  return (
    <>
      {greeting}
      {syncBanner}

      <Spacer size="xl" />
      <AvailableCard
        availableCents={summary.availableCents}
        incomeCents={summary.incomeCents}
      />

      <Spacer size="lg" />
      <SummaryRow
        incomeCents={summary.incomeCents}
        expenseCents={summary.expenseCents}
        availableCents={summary.availableCents}
      />

      {primaryInsight ? (
        <>
          <Spacer size="lg" />
          <View
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.accentSoft,
            }}
            accessibilityRole="text"
            accessibilityLabel={`${primaryInsight.title}. ${primaryInsight.body}`}
          >
            <Text variant="label" color="accent">
              Controlinho
            </Text>
            <Spacer size="xs" />
            <Text variant="body">{primaryInsight.title}</Text>
            <Text variant="caption" color="secondary">
              {primaryInsight.body}
            </Text>
          </View>
        </>
      ) : null}

      <Spacer size="lg" />
      <ProjectionCard />

      <Spacer size="md" />
      <BudgetCarousel
        items={budgetItems}
        onPressAll={() => router.push('/(app)/(tabs)/planning')}
      />

      {upcoming.length > 0 ? (
        <>
          <Spacer size="xl" />
          <Text variant="label" color="secondary">
            Próximas contas
          </Text>
          <Spacer size="sm" />
          {upcoming.map((item) => {
            const urgency = dueUrgency(item.nextDueDate);
            const label = dueUrgencyLabel(urgency);
            const amount = effectiveRecurringAmountCents(item);
            return (
              <View
                key={item.id}
                style={{
                  marginBottom: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
                accessibilityLabel={`${item.name}, ${label || formatISODateBR(item.nextDueDate)}`}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption">
                    {amount > 0 ? formatCentsToBRL(amount) : 'Variável'}
                  </Text>
                </View>
                <Text variant="caption" color="secondary">
                  {formatISODateBR(item.nextDueDate)}
                  {label ? ` · ${label}` : ''}
                </Text>
              </View>
            );
          })}
        </>
      ) : null}

      <Spacer size="xl" />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="label" color="secondary">
          Movimentações recentes
        </Text>
        <Text
          variant="caption"
          color="accent"
          onPress={() => router.push('/(app)/(tabs)/transactions')}
          accessibilityRole="button"
          accessibilityLabel="Ver todas as movimentações"
        >
          Ver todas
        </Text>
      </View>
      <Spacer size="sm" />
      {recent.length === 0 ? (
        <Text variant="body" color="secondary">
          Nenhuma movimentação neste mês ainda.
        </Text>
      ) : (
        recent.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            onPress={() =>
              router.push({
                pathname: '/(app)/transaction/form',
                params: { id: tx.id },
              })
            }
          />
        ))
      )}

      <View style={{ height: theme.spacing.xxxl }} />
    </>
  );
}
