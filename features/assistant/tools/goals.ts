import type { FinancialTool } from '@/features/assistant/tools/types';
import {
  calculateGoalProjection,
  goalProgressPercent,
  goalRemainingCents,
} from '@/utils/goals';
import { formatCentsToBRL } from '@/utils/money';

export const getGoalsTool: FinancialTool = {
  name: 'get_goals',
  description: 'Lista metas financeiras ativas',
  run: (snapshot) => {
    const goals = (snapshot.goals ?? []).filter(
      (g) => g.status === 'active' || g.status === 'completed',
    );
    const rows = goals.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      currentCents: g.currentAmountCents,
      targetCents: g.targetAmountCents,
      progressPercent: goalProgressPercent(g),
      remainingCents: goalRemainingCents(g),
      currentFormatted: formatCentsToBRL(g.currentAmountCents),
      targetFormatted: formatCentsToBRL(g.targetAmountCents),
    }));

    return {
      toolName: 'get_goals',
      ok: true,
      data: { goals: rows },
      summary:
        rows.length === 0
          ? 'Você ainda não tem metas cadastradas.'
          : `Você tem ${rows.length} meta${rows.length === 1 ? '' : 's'}: ${rows
              .slice(0, 3)
              .map((g) => `${g.name} (${g.progressPercent}%)`)
              .join(', ')}.`,
    };
  },
};

export const getGoalProgressTool: FinancialTool = {
  name: 'get_goal_progress',
  description: 'Progresso de uma meta específica',
  run: (snapshot, args) => {
    const goals = snapshot.goals ?? [];
    const nameHint = String(args?.name ?? args?.goal ?? '')
      .trim()
      .toLowerCase();
    const goal =
      (nameHint
        ? goals.find((g) => g.name.toLowerCase().includes(nameHint))
        : undefined) ??
      goals.find((g) => g.status === 'active') ??
      goals[0];

    if (!goal) {
      return {
        toolName: 'get_goal_progress',
        ok: true,
        data: {},
        summary: 'Não encontrei uma meta para mostrar o progresso.',
      };
    }

    const pct = goalProgressPercent(goal);
    const remaining = goalRemainingCents(goal);
    return {
      toolName: 'get_goal_progress',
      ok: true,
      data: {
        id: goal.id,
        name: goal.name,
        progressPercent: pct,
        remainingCents: remaining,
        currentFormatted: formatCentsToBRL(goal.currentAmountCents),
        targetFormatted: formatCentsToBRL(goal.targetAmountCents),
        remainingFormatted: formatCentsToBRL(remaining),
      },
      summary: `${goal.name}: ${formatCentsToBRL(goal.currentAmountCents)} de ${formatCentsToBRL(goal.targetAmountCents)} (${pct}%). Faltam ${formatCentsToBRL(remaining)}.`,
    };
  },
};

export const calculateGoalProjectionTool: FinancialTool = {
  name: 'calculate_goal_projection',
  description: 'Estima prazo da meta com contribuição mensal',
  run: (snapshot, args) => {
    const goals = snapshot.goals ?? [];
    const nameHint = String(args?.name ?? args?.goal ?? '')
      .trim()
      .toLowerCase();
    const monthly = Number(args?.monthlyContributionCents ?? args?.monthly ?? 0);
    const goal =
      (nameHint
        ? goals.find((g) => g.name.toLowerCase().includes(nameHint))
        : undefined) ??
      goals.find((g) => g.status === 'active') ??
      goals[0];

    if (!goal) {
      return {
        toolName: 'calculate_goal_projection',
        ok: true,
        data: {},
        summary: 'Sem meta para projetar.',
      };
    }

    const projection = calculateGoalProjection({
      targetAmountCents: goal.targetAmountCents,
      currentAmountCents: goal.currentAmountCents,
      monthlyContributionCents: Number.isFinite(monthly) ? monthly : 0,
    });

    return {
      toolName: 'calculate_goal_projection',
      ok: true,
      data: {
        goalName: goal.name,
        monthlyContributionCents: monthly,
        ...projection,
      },
      summary: `${goal.name}: ${projection.summary}`,
    };
  },
};
