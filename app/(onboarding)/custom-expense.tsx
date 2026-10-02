import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useOnboardingStore } from '@/store/onboarding-store';
import { parseBRLToCents } from '@/utils/money';

export default function CustomExpenseScreen() {
  const upsertExpense = useOnboardingStore((s) => s.upsertExpense);
  const [label, setLabel] = useState('');
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | undefined>();

  const goSummary = () => router.push('/(onboarding)/focus');

  const onAdd = () => {
    const trimmed = label.trim();
    const cents = parseBRLToCents(raw);
    if (!trimmed) {
      setError('Dê um nome para esse gasto');
      return;
    }
    if (cents === null || cents <= 0) {
      setError('Informe um valor válido');
      return;
    }
    const key = `custom_${trimmed.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    upsertExpense({
      key,
      label: trimmed,
      amountCents: cents,
      kind: 'variable',
    });
    goSummary();
  };

  return (
    <Screen>
      <OnboardingHeader progress={stepProgress(STEPS.custom)} />
      <Text variant="title">Quer adicionar outro gasto?</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Opcional — algo que importa no seu mês e ainda não listamos.
      </Text>
      <Spacer size="xl" />
      <Input
        label="Nome"
        placeholder="Ex.: Pets"
        value={label}
        onChangeText={(text) => {
          setLabel(text);
          if (error) setError(undefined);
        }}
      />
      <Spacer size="md" />
      <Input
        label="Valor mensal"
        keyboardType="decimal-pad"
        value={raw}
        onChangeText={(text) => {
          setRaw(text);
          if (error) setError(undefined);
        }}
        error={error}
      />
      <View style={{ flex: 1, minHeight: 48 }} />
      <Button label="Adicionar e ver resumo" onPress={onAdd} />
      <Spacer size="sm" />
      <Button label="Não, ir ao resumo" variant="secondary" onPress={goSummary} />
      <Spacer size="sm" />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
