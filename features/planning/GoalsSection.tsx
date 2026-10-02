import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, EmptyState, ProgressBar, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useGoalsStore } from '@/store/goals-store';
import { goalProgressPercent, goalRemainingCents } from '@/utils/goals';
import { formatCentsToBRL } from '@/utils/money';

export function GoalsSection() {
  const theme = useTheme();
  const goals = useGoalsStore((s) => s.goals).filter(
    (g) => g.status === 'active' || g.status === 'completed',
  );

  if (goals.length === 0) {
    return (
      <EmptyState
        title="Tem algo que você quer conquistar?"
        body="Crie uma meta para acompanhar seu progresso com calma."
        actionLabel="Criar meta"
        onAction={() => router.push('/(app)/goal/form')}
      />
    );
  }

  return (
    <View>
      {goals.map((goal) => {
        const pct = goalProgressPercent(goal);
        return (
          <View
            key={goal.id}
            style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.lg,
            }}
            accessibilityLabel={`Meta ${goal.name}, ${pct} por cento`}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text variant="label">{goal.name}</Text>
              <Text variant="caption">{pct}%</Text>
            </View>
            <Text variant="caption" color="secondary">
              {formatCentsToBRL(goal.currentAmountCents)} /{' '}
              {formatCentsToBRL(goal.targetAmountCents)}
            </Text>
            <Spacer size="xs" />
            <ProgressBar
              progress={pct / 100}
              tone={goal.status === 'completed' ? 'default' : 'default'}
              height={8}
            />
            <Spacer size="xs" />
            <Text variant="caption" color="secondary">
              {goal.status === 'completed'
                ? 'Meta concluída'
                : `Faltam ${formatCentsToBRL(goalRemainingCents(goal))}`}
            </Text>
            <Spacer size="sm" />
            <Button
              label="Adicionar valor"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(app)/goal/form',
                  params: { id: goal.id },
                })
              }
            />
          </View>
        );
      })}
      <Button
        label="Nova meta"
        onPress={() => router.push('/(app)/goal/form')}
      />
    </View>
  );
}
