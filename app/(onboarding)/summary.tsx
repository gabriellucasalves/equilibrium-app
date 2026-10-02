import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { buildMoneySummary, formatCentsToBRL } from '@/utils/money';

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text variant="body">{label}</Text>
        <Text variant="body" style={{ fontFamily: theme.typography.fonts.bodySemi }}>
          {value}
        </Text>
      </View>
      {hint ? (
        <>
          <Spacer size="xxs" />
          <Text variant="caption">{hint}</Text>
        </>
      ) : null}
    </View>
  );
}

export default function SummaryScreen() {
  const theme = useTheme();
  const incomeCents = useOnboardingStore((s) => s.incomeCents);
  const expenses = useOnboardingStore((s) => s.expenses);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const adjustFromSummary = useOnboardingStore((s) => s.adjustFromSummary);
  const completeOnboardingRemote = useFinanceStore((s) => s.completeOnboardingRemote);
  const seedFromOnboarding = useFinanceStore((s) => s.seedFromOnboarding);
  const displayName = useFinanceStore((s) => s.displayName);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const profileName = useAuthStore((s) => s.profile?.name);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const summary = useMemo(
    () => buildMoneySummary(incomeCents, expenses),
    [incomeCents, expenses],
  );

  const onStart = async () => {
    const name = profileName || displayName || 'Você';
    try {
      if (authStatus === 'authenticated' && !isDemoMode) {
        await completeOnboardingRemote({ name, incomeCents, expenses });
        await refreshProfile();
      } else {
        seedFromOnboarding({ incomeCents, expenses, displayName: name });
      }
      completeOnboarding();
      router.replace('/(app)/(tabs)');
    } catch {
      // erro amigável já está em lastSyncError
    }
  };

  const onAdjust = () => {
    adjustFromSummary();
    router.replace('/(onboarding)/income');
  };

  return (
    <Screen>
      <OnboardingHeader progress={stepProgress(STEPS.summary)} />
      <Text variant="title">Parece certo?</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Um retrato simples do seu mês — dá para refinar quando quiser.
      </Text>
      <Spacer size="xl" />

      <View
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
        }}
      >
        <Row label="Renda" value={formatCentsToBRL(summary.incomeCents)} />
        <Row
          label="Gastos fixos"
          value={formatCentsToBRL(summary.fixedCents)}
          hint={`${summary.fixedPercent}% da renda`}
        />
        <Row
          label="Gastos variáveis"
          value={formatCentsToBRL(summary.variableCents)}
          hint={`${summary.variablePercent}% da renda`}
        />
        <Row
          label="Livre no mês"
          value={formatCentsToBRL(summary.freeCents)}
          hint={
            summary.freeCents < 0
              ? 'Por enquanto os gastos passam da renda — vamos organizar com calma.'
              : `${summary.freePercent}% disponível`
          }
        />
      </View>

      {expenses.length > 0 ? (
        <>
          <Spacer size="lg" />
          <Text variant="label" color="secondary">
            Distribuição
          </Text>
          <Spacer size="sm" />
          {expenses
            .slice()
            .sort((a, b) => b.amountCents - a.amountCents)
            .map((expense) => (
              <Row
                key={expense.key}
                label={expense.label}
                value={formatCentsToBRL(expense.amountCents)}
              />
            ))}
        </>
      ) : null}

      <View style={{ flex: 1, minHeight: 48 }} />
      <Button label="Começar" onPress={onStart} testID="summary-start" />
      <Spacer size="sm" />
      <Button label="Ajustar" variant="secondary" onPress={onAdjust} testID="summary-adjust" />
    </Screen>
  );
}
