import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { ONBOARDING_CATEGORIES, type OnboardingCategory } from '@/constants/categories';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useOnboardingStore } from '@/store/onboarding-store';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

function ExpenseStepForm({
  category,
  stepIndex,
}: {
  category: OnboardingCategory;
  stepIndex: number;
}) {
  const expenses = useOnboardingStore((s) => s.expenses);
  const upsertExpense = useOnboardingStore((s) => s.upsertExpense);
  const setExpenseStepIndex = useOnboardingStore((s) => s.setExpenseStepIndex);

  const existing = useMemo(
    () => expenses.find((e) => e.key === category.key),
    [expenses, category.key],
  );

  const [raw, setRaw] = useState(
    existing && existing.amountCents > 0
      ? formatCentsToBRL(existing.amountCents).replace('R$\u00a0', '')
      : '',
  );
  const [error, setError] = useState<string | undefined>();

  const goNext = (amountCents: number) => {
    upsertExpense({
      key: category.key,
      label: category.label,
      amountCents,
      kind: category.kind,
    });
    setExpenseStepIndex(stepIndex + 1);

    if (stepIndex >= ONBOARDING_CATEGORIES.length - 1) {
      router.push('/(onboarding)/custom-expense');
      return;
    }

    router.push({
      pathname: '/(onboarding)/expenses',
      params: { step: String(stepIndex + 1) },
    });
  };

  const onContinue = () => {
    if (!raw.trim()) {
      goNext(0);
      return;
    }
    const cents = parseBRLToCents(raw);
    if (cents === null || cents < 0) {
      setError('Informe um valor válido ou pule');
      return;
    }
    goNext(cents);
  };

  return (
    <Screen>
      <OnboardingHeader progress={stepProgress(STEPS.expensesStart + stepIndex)} />
      <Text variant="caption" color="accent">
        Gasto {stepIndex + 1} de {ONBOARDING_CATEGORIES.length}
      </Text>
      <Spacer size="xs" />
      <Text variant="title">E com {category.label.toLowerCase()}?</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        {category.helper}. Se não tiver, pode pular.
      </Text>
      <Spacer size="xl" />
      <Input
        label={`Valor mensal — ${category.label}`}
        hint="Ex.: 800,00"
        keyboardType="decimal-pad"
        value={raw}
        onChangeText={(text) => {
          setRaw(text);
          if (error) setError(undefined);
        }}
        error={error}
        autoFocus
        testID="expense-input"
      />
      <View style={{ flex: 1, minHeight: 48 }} />
      <Button label="Continuar" onPress={onContinue} testID="expense-continue" />
      <Spacer size="sm" />
      <Button
        label="Pular"
        variant="secondary"
        onPress={() => goNext(0)}
        testID="expense-skip"
      />
      <Spacer size="sm" />
      <Button
        label="Voltar"
        variant="ghost"
        onPress={() => {
          if (stepIndex === 0) {
            router.back();
            return;
          }
          router.push({
            pathname: '/(onboarding)/expenses',
            params: { step: String(stepIndex - 1) },
          });
        }}
      />
    </Screen>
  );
}

export default function ExpensesScreen() {
  const params = useLocalSearchParams<{ step?: string }>();
  const stepIndex = Math.min(
    ONBOARDING_CATEGORIES.length - 1,
    Math.max(0, Number.parseInt(params.step ?? '0', 10) || 0),
  );
  const category = ONBOARDING_CATEGORIES[stepIndex];

  return (
    <ExpenseStepForm
      key={category.key}
      category={category}
      stepIndex={stepIndex}
    />
  );
}
