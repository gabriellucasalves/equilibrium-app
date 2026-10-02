import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Button,
  Chip,
  Input,
  ProgressBar,
  Screen,
  SkeletonBlock,
  Spacer,
  Text,
} from '@/components/ui';
import { ONBOARDING_CATEGORIES } from '@/constants/categories';
import { CalendarSection } from '@/features/planning/CalendarSection';
import { EvolutionSection } from '@/features/planning/EvolutionSection';
import { GoalsSection } from '@/features/planning/GoalsSection';
import { ProjectionCard } from '@/features/planning/ProjectionCard';
import { RecurringSection } from '@/features/planning/RecurringSection';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useGoalsStore } from '@/store/goals-store';
import { useRecurringStore } from '@/store/recurring-store';
import { currentMonthKey } from '@/utils/date';
import { buildBudgetProgress } from '@/utils/finance-summary';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

type Section = 'budgets' | 'goals' | 'bills' | 'calendar' | 'evolution';

function toneFor(usagePercent: number): 'default' | 'warning' | 'danger' {
  if (usagePercent >= 100) return 'danger';
  if (usagePercent >= 80) return 'warning';
  return 'default';
}

export default function PlanningScreen() {
  const theme = useTheme();
  const [section, setSection] = useState<Section>('budgets');
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';
  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const hydrateRecurring = useRecurringStore((s) => s.hydrate);
  const loadingGoals = useGoalsStore((s) => s.loading);
  const loadingRecurring = useRecurringStore((s) => s.loading);

  const [selectedKey, setSelectedKey] = useState(
    ONBOARDING_CATEGORIES[0]?.key ?? 'groceries',
  );
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void hydrateGoals(isDemo);
    void hydrateRecurring(isDemo);
  }, [hydrateGoals, hydrateRecurring, isDemo]);

  const monthKey = currentMonthKey();
  const progress = useMemo(
    () => buildBudgetProgress(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );
  const selectedBudget = budgets.find((b) => b.categoryKey === selectedKey);

  const onSave = async () => {
    const cents = parseBRLToCents(raw);
    if (cents === null || cents < 0) {
      setError('Informe um limite válido');
      return;
    }
    try {
      await upsertBudget({ categoryKey: selectedKey, limitCents: cents });
      setRaw('');
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar agora.');
    }
  };

  return (
    <Screen>
      <Text variant="title">Planejamento</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Orçamentos, metas, contas e o mês à frente.
      </Text>

      <Spacer size="lg" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(
          [
            ['budgets', 'Orçamentos'],
            ['goals', 'Metas'],
            ['bills', 'Contas'],
            ['calendar', 'Calendário'],
            ['evolution', 'Evolução'],
          ] as const
        ).map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            selected={section === key}
            onPress={() => setSection(key)}
          />
        ))}
      </View>

      <Spacer size="lg" />
      {section !== 'budgets' && section !== 'evolution' ? (
        <ProjectionCard />
      ) : null}

      {section === 'goals' ? (
        loadingGoals && !isDemo ? (
          <SkeletonBlock lines={4} />
        ) : (
          <GoalsSection />
        )
      ) : null}

      {section === 'bills' ? (
        loadingRecurring && !isDemo ? (
          <SkeletonBlock lines={4} />
        ) : (
          <RecurringSection />
        )
      ) : null}

      {section === 'calendar' ? <CalendarSection /> : null}
      {section === 'evolution' ? <EvolutionSection /> : null}

      {section === 'budgets' ? (
        <>
          {progress.length === 0 ? (
            <Text variant="body" color="secondary">
              Ainda não há orçamentos. Defina um limite abaixo.
            </Text>
          ) : (
            progress.map((item) => (
              <View
                key={item.categoryKey}
                style={{
                  marginBottom: theme.spacing.md,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radii.lg,
                }}
                accessibilityLabel={`${item.label}, ${item.usagePercent} por cento do limite`}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <Text variant="label">{item.label}</Text>
                  <Text variant="caption">
                    {formatCentsToBRL(item.spentCents)} /{' '}
                    {formatCentsToBRL(item.limitCents)}
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(1, item.usagePercent / 100)}
                  tone={toneFor(item.usagePercent)}
                  height={8}
                />
                <Spacer size="xs" />
                <Text
                  variant="caption"
                  color={item.remainingCents < 0 ? 'danger' : 'secondary'}
                >
                  {item.remainingCents < 0
                    ? `${formatCentsToBRL(Math.abs(item.remainingCents))} acima do limite`
                    : `${formatCentsToBRL(item.remainingCents)} restantes`}
                </Text>
              </View>
            ))
          )}

          <Spacer size="lg" />
          <Text variant="label" color="secondary">
            Definir ou ajustar limite
          </Text>
          <Spacer size="sm" />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.xs,
            }}
          >
            {ONBOARDING_CATEGORIES.map((cat) => {
              const active = cat.key === selectedKey;
              return (
                <Chip
                  key={cat.key}
                  label={cat.label}
                  selected={active}
                  onPress={() => {
                    setSelectedKey(cat.key);
                    const current = budgets.find((b) => b.categoryKey === cat.key);
                    setRaw(
                      current
                        ? formatCentsToBRL(current.limitCents).replace(
                            'R$\u00a0',
                            '',
                          )
                        : '',
                    );
                    setError(undefined);
                  }}
                />
              );
            })}
          </View>
          <Spacer size="md" />
          <Input
            label={`Limite — ${ONBOARDING_CATEGORIES.find((c) => c.key === selectedKey)?.label ?? ''}`}
            hint={
              selectedBudget
                ? `Atual: ${formatCentsToBRL(selectedBudget.limitCents)}`
                : 'Ex.: 800,00'
            }
            keyboardType="decimal-pad"
            value={raw}
            onChangeText={(text) => {
              setRaw(text);
              if (error) setError(undefined);
            }}
            error={error}
          />
          <Spacer size="md" />
          <Button label="Salvar limite" onPress={onSave} />
        </>
      ) : null}

      <View style={{ height: theme.spacing.xxxl }} />
    </Screen>
  );
}
