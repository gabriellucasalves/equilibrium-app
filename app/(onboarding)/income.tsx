import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useOnboardingStore } from '@/store/onboarding-store';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

export default function IncomeScreen() {
  const incomeCents = useOnboardingStore((s) => s.incomeCents);
  const setIncomeCents = useOnboardingStore((s) => s.setIncomeCents);
  const [raw, setRaw] = useState(
    incomeCents > 0 ? formatCentsToBRL(incomeCents).replace('R$\u00a0', '') : '',
  );
  const [error, setError] = useState<string | undefined>();

  const onContinue = () => {
    const cents = parseBRLToCents(raw);
    if (cents === null || cents <= 0) {
      setError('Informe uma renda mensal válida');
      return;
    }
    setIncomeCents(cents);
    setError(undefined);
    router.push({ pathname: '/(onboarding)/expenses', params: { step: '0' } });
  };

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
