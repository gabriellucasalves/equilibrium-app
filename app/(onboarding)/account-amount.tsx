import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { ClosedTestMoneyInput } from '@/features/closed-test/ClosedTestMoneyInput';
import { getClosedTestAccount } from '@/features/closed-test/config';
import { routes } from '@/lib/routes';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { toISODate } from '@/utils/date';

export default function AccountAmountScreen() {
  const params = useLocalSearchParams<{ account?: string | string[] }>();
  const account = getClosedTestAccount(params.account);
  const [cents, setCents] = useState(0);
  const [saving, setSaving] = useState(false);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  if (!account) {
    return (
      <Screen>
        <Text variant="title">Conta não encontrada</Text>
        <Spacer size="lg" />
        <Button
          label="Voltar"
          onPress={() => router.replace('/(onboarding)/account-choice')}
        />
      </Screen>
    );
  }

  const finish = () => {
    completeOnboarding();
    router.replace(routes.appTabs);
  };

  const save = async () => {
    if (cents <= 0 || saving) return;
    setSaving(true);
    try {
      await addTransaction({
        type: 'expense',
        amountCents: cents,
        categoryKey: account.categoryKey,
        note: account.note,
        date: toISODate(),
      });
      finish();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {account.question}
      </Text>
      <Spacer size="xl" />

      <ClosedTestMoneyInput
        cents={cents}
        onChangeCents={setCents}
        autoFocus
        testID="account-amount-input"
        accessibilityLabel={account.question}
      />

      <Spacer size="lg" />

      <Button
        label={saving ? 'Salvando…' : 'Salvar'}
        onPress={() => void save()}
        disabled={cents <= 0 || saving}
        testID="account-amount-save"
      />

      <Spacer size="sm" />

      <Button
        label="Agora não"
        variant="ghost"
        onPress={finish}
        disabled={saving}
        testID="account-amount-skip"
      />
    </Screen>
  );
}
