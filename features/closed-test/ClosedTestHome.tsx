import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Spacer, Text } from '@/components/ui';
import { CLOSED_TEST_ACCOUNTS } from '@/features/closed-test/config';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import { currentMonthKey } from '@/utils/date';
import {
  buildMonthSummary,
  filterTransactionsByMonth,
} from '@/utils/finance-summary';
import { formatCentsToBRL, sumCents } from '@/utils/money';

export function ClosedTestHome() {
  const theme = useTheme();
  const monthlyIncomeCents = useFinanceStore((s) => s.monthlyIncomeCents);
  const transactions = useFinanceStore((s) => s.transactions);
  const monthKey = currentMonthKey();

  const monthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, monthKey),
    [transactions, monthKey],
  );

  const summary = useMemo(
    () => buildMonthSummary(transactions, monthKey, monthlyIncomeCents),
    [transactions, monthKey, monthlyIncomeCents],
  );

  const spentByCategory = useMemo(() => {
    return new Map(
      CLOSED_TEST_ACCOUNTS.map((account) => [
        account.categoryKey,
        sumCents(
          monthTransactions
            .filter(
              (tx) =>
                tx.type === 'expense' && tx.categoryKey === account.categoryKey,
            )
            .map((tx) => tx.amountCents),
        ),
      ]),
    );
  }, [monthTransactions]);

  const hasIncome = monthlyIncomeCents > 0;
  const energySpent = spentByCategory.get('energy') ?? 0;

  const openAccount = (key: string) => {
    router.push({
      pathname: '/(onboarding)/account-amount',
      params: { account: key },
    });
  };

  return (
    <>
      <Text variant="title" accessibilityRole="header">
        Olá.
      </Text>

      <Spacer size="xl" />

      {hasIncome ? (
        <View accessibilityLabel={`Recebi ${formatCentsToBRL(summary.incomeCents)}`}>
          <Text variant="caption" color="secondary">
            Recebi
          </Text>
          <Text variant="subtitle">{formatCentsToBRL(summary.incomeCents)}</Text>
        </View>
      ) : (
        <View>
          <Text variant="caption" color="secondary">
            Renda
          </Text>
          <Text variant="subtitle">Ainda não informada</Text>
          <Spacer size="sm" />
          <Button
            label="Informar renda"
            onPress={() =>
              router.push({
                pathname: '/(onboarding)/income',
                params: { returnTo: 'home' },
              })
            }
            style={{ alignSelf: 'flex-start' }}
            testID="home-add-income"
          />
        </View>
      )}

      <Spacer size="lg" />

      <View accessibilityLabel={`Gastei ${formatCentsToBRL(summary.expenseCents)}`}>
        <Text variant="caption" color="secondary">
          Gastei
        </Text>
        <Text variant="subtitle">{formatCentsToBRL(summary.expenseCents)}</Text>
      </View>

      {hasIncome ? (
        <>
          <Spacer size="lg" />
          <View
            accessibilityLabel={`Ainda tenho ${formatCentsToBRL(summary.availableCents)}`}
          >
            <Text variant="caption" color="secondary">
              Ainda tenho
            </Text>
            <Text
              variant="hero"
              style={{ fontFamily: theme.typography.fonts.display }}
            >
              {formatCentsToBRL(summary.availableCents)}
            </Text>
          </View>
        </>
      ) : null}

      <Spacer size="xl" />

      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.accent,
          paddingLeft: theme.spacing.md,
        }}
      >
        <Text variant="label" color="accent">
          Controlinho
        </Text>
        <Spacer size="xs" />
        <Text variant="body">
          {energySpent > 0
            ? 'A luz já está no seu mês.'
            : 'Seu mês começa por aqui.'}
        </Text>
      </View>

      <Spacer size="xl" />

      <Text variant="label">Seu mês</Text>
      <Spacer size="sm" />

      {CLOSED_TEST_ACCOUNTS.map((account) => {
        const spent = spentByCategory.get(account.categoryKey) ?? 0;
        return (
          <Pressable
            key={account.key}
            accessibilityRole="button"
            accessibilityLabel={
              spent > 0
                ? `${account.label}, ${formatCentsToBRL(spent)}`
                : `${account.label}, adicionar`
            }
            onPress={() => openAccount(account.key)}
            style={({ pressed }) => ({
              minHeight: 64,
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text variant="body">{account.label}</Text>
            <Text
              variant={spent > 0 ? 'body' : 'label'}
              color={spent > 0 ? 'default' : 'accent'}
            >
              {spent > 0 ? formatCentsToBRL(spent) : 'Adicionar'}
            </Text>
          </Pressable>
        );
      })}

      <View style={{ height: theme.spacing.xxl }} />
    </>
  );
}
