import type { FinancialGoal } from '@/types/goals';

export function goalProgressPercent(goal: FinancialGoal): number {
  if (goal.targetAmountCents <= 0) return 0;
  return Math.min(
    100,
    Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100),
  );
}

export function goalRemainingCents(goal: FinancialGoal): number {
  return Math.max(0, goal.targetAmountCents - goal.currentAmountCents);
}

/** Projeção determinística — estimativa, não certeza. */
export function calculateGoalProjection(input: {
  targetAmountCents: number;
  currentAmountCents: number;
  monthlyContributionCents: number;
  fromDate?: Date;
}): {
  monthsRemaining: number | null;
  estimatedMonthKey: string | null;
  summary: string;
} {
  const remaining = Math.max(
    0,
    input.targetAmountCents - input.currentAmountCents,
  );
  if (remaining === 0) {
    return {
      monthsRemaining: 0,
      estimatedMonthKey: null,
      summary: 'Essa meta já está concluída.',
    };
  }
  if (input.monthlyContributionCents <= 0) {
    return {
      monthsRemaining: null,
      estimatedMonthKey: null,
      summary:
        'Sem uma contribuição mensal planejada, ainda não dá para estimar o prazo.',
    };
  }

  const months = Math.ceil(remaining / input.monthlyContributionCents);
  const from = input.fromDate ?? new Date();
  const eta = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const monthKey = `${eta.getFullYear()}-${String(eta.getMonth() + 1).padStart(2, '0')}`;
  const label = eta.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    monthsRemaining: months,
    estimatedMonthKey: monthKey,
    summary: `Mantendo esse ritmo, a meta seria alcançada por volta de ${label} (cerca de ${months} mês${months === 1 ? '' : 'es'}).`,
  };
}
