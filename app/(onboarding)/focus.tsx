import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/store/onboarding-store';
import type { PrimaryFocus } from '@/types/finance';

const OPTIONS: { key: PrimaryFocus; label: string }[] = [
  { key: 'control_spending', label: 'Controlar gastos' },
  { key: 'save_money', label: 'Economizar' },
  { key: 'organize_bills', label: 'Organizar contas' },
  { key: 'build_reserve', label: 'Criar reserva' },
  { key: 'understand_money', label: 'Só quero entender meu dinheiro' },
];

export default function FocusScreen() {
  const theme = useTheme();
  const primaryFocus = useOnboardingStore((s) => s.primaryFocus);
  const setPrimaryFocus = useOnboardingStore((s) => s.setPrimaryFocus);

  const goNext = () => router.push('/(onboarding)/summary');

  return (
    <Screen>
      <OnboardingHeader progress={stepProgress(STEPS.focus)} />
      <Spacer size="lg" />
      <Text variant="title">O que você gostaria de melhorar primeiro?</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Opcional — só uma preferência para personalizar dicas. Não altera seus
        números.
      </Text>
      <Spacer size="xl" />
      <View style={{ gap: theme.spacing.sm }}>
        {OPTIONS.map((opt) => {
          const selected = primaryFocus === opt.key;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPrimaryFocus(opt.key)}
              style={{
                minHeight: 48,
                padding: theme.spacing.md,
                borderRadius: theme.radii.lg,
                backgroundColor: selected
                  ? theme.colors.accentSoft
                  : theme.colors.surfaceMuted,
                borderWidth: selected ? 1.5 : 0,
                borderColor: theme.colors.accent,
              }}
            >
              <Text variant="body">{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1, minHeight: 24 }} />
      <Button label="Continuar" onPress={goNext} testID="focus-continue" />
      <Spacer size="sm" />
      <Button
        label="Pular"
        variant="ghost"
        onPress={() => {
          setPrimaryFocus(null);
          goNext();
        }}
      />
    </Screen>
  );
}
