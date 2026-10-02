import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { ClosedTestMoneyInput } from '@/features/closed-test/ClosedTestMoneyInput';
import { CLOSED_TEST_MODE } from '@/features/closed-test/config';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { routes } from '@/lib/routes';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

export default function IncomeScreen() {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const incomeCents = useOnboardingStore((s) => s.incomeCents);
  const setIncomeCents = useOnboardingStore((s) => s.setIncomeCents);
  const setMonthlyIncomeCents = useFinanceStore((s) => s.setMonthlyIncomeCents);
  const [closedCents, setClosedCents] = useState(incomeCents);
  const [raw, setRaw] = useState(
    incomeCents > 0 ? formatCentsToBRL(incomeCents).replace('R$\u00a0', '') : '',
  );
  const [error, setError] = useState<string | undefined>();

  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  const finishClosedIncome = (cents: number) => {
    setIncomeCents(cents);
    setMonthlyIncomeCents(cents);

    if (returnTo === 'home') {
      router.replace(routes.appTabs);
      return;
    }

    router.push('/(onboarding)/account-choice');
  };

  const onContinue = () => {
    if (CLOSED_TEST_MODE) {
      if (closedCents <= 0) return;
      finishClosedIncome(closedCents);
      return;
    }

    const cents = parseBRLToCents(raw);
    if (cents === null || cents <= 0) {
      setError('Informe uma renda mensal válida');
      return;
    }
    setIncomeCents(cents);
    setError(undefined);
    router.push({ pathname: '/(onboarding)/expenses', params: { step: '0' } });
  };

  if (CLOSED_TEST_MODE) {
    return (
      <Screen>
        <Text variant="title" accessibilityRole="header">
          Quanto você recebe por mês?
        </Text>
        <Spacer size="xl" />

        <ClosedTestMoneyInput
          cents={closedCents}
          onChangeCents={setClosedCents}
          autoFocus
          testID="income-input"
          accessibilityLabel="Renda mensal"
        />

        <View style={{ flex: 1, minHeight: 48 }} />

        <Button
          label="Continuar"
          onPress={onContinue}
          disabled={closedCents <= 0}
          testID="income-continue"
        />
        <Spacer size="sm" />
        <Button
          label="Prefiro informar depois"
          variant="ghost"
          onPress={() => {
            if (returnTo === 'home') {
              router.replace(routes.appTabs);
            } else {
              router.push('/(onboarding)/account-choice');
            }
          }}
          testID="income-skip"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <OnboardingHeader progress={stepProgress(STEPS.income)} />
      <Text variant="title">Quanto entra por mês?</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Pode ser o valor líquido aproximado. Dá para ajustar depois.
      </Text>
      <Spacer size="xl" />
      <Input
        label="Renda mensal"
        hint="Ex.: 4.500,00"
        keyboardType="decimal-pad"
        value={raw}
        onChangeText={(text) => {
          setRaw(text);
          if (error) setError(undefined);
        }}
        error={error}
        autoFocus
        testID="income-input"
      />
      <View style={{ flex: 1, minHeight: 48 }} />
      <Button label="Continuar" onPress={onContinue} testID="income-continue" />
      <Spacer size="sm" />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
