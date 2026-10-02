import type { FinancialSnapshot } from '@/features/assistant/types';
import { toISODate } from '@/utils/date';
import {
  buildBudgetProgress,
  buildMonthSummary,
  categoryLabel,
} from '@/utils/finance-summary';
import { goalProgressPercent } from '@/utils/goals';
import { getMonthProjection } from '@/utils/month-projection';
import { formatCentsToBRL } from '@/utils/money';
import { monthLabelBR, shiftMonthKey } from '@/utils/month';
import { dueUrgency, effectiveRecurringAmountCents } from '@/utils/recurring';

export type DeterministicInsight = {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'positive' | 'warning';
  /** Prioridade: menor = mais importante na Home (só 1 principal). */
  priority: number;
};

/** Insights por regras — executados sem LLM. */
export class InsightEngine {
  generate(snapshot: FinancialSnapshot): DeterministicInsight[] {
    const insights: DeterministicInsight[] = [];
    const today = toISODate();
    const summary = buildMonthSummary(
      snapshot.transactions,
      snapshot.monthKey,
      snapshot.monthlyIncomeCents,
    );

    insights.push({
      id: 'available',
      title: 'Disponível do mês',
      body: `Você ainda pode usar ${formatCentsToBRL(summary.availableCents)} em ${monthLabelBR(snapshot.monthKey)}.`,
      severity: summary.availableCents > 0 ? 'positive' : 'warning',
      priority: 40,
    });

    const progress = buildBudgetProgress(
      snapshot.budgets,
      snapshot.transactions,
      snapshot.monthKey,
    );
    const alert = progress.find((p) => p.usagePercent >= 85);
    if (alert) {
      insights.push({
        id: 'budget-alert',
        title: 'Perto do limite',
        body: `${alert.label} está em ${alert.usagePercent}% do orçamento.`,
        severity: 'warning',
        priority: 10,
      });
    }

    const recurring = snapshot.recurring ?? [];
    const dueSoon = recurring
      .filter((r) => r.isActive)
      .map((r) => ({ r, urgency: dueUrgency(r.nextDueDate, today) }))
      .find((x) => x.urgency === 'today' || x.urgency === 'tomorrow' || x.urgency === 'overdue');
    if (dueSoon) {
      const label =
        dueSoon.urgency === 'today'
          ? 'vence hoje'
          : dueSoon.urgency === 'tomorrow'
            ? 'vence amanhã'
            : 'está atrasada';
      insights.push({
        id: 'bill-due',
        title: 'Conta próxima',
        body: `${dueSoon.r.name} ${label}.`,
        severity: 'warning',
        priority: 5,
      });
    }

    const goals = snapshot.goals ?? [];
    const completed = goals.find((g) => g.status === 'completed');
    if (completed) {
      insights.push({
        id: 'goal-done',
        title: 'Meta alcançada',
        body: `Você registrou o valor desejado em “${completed.name}”.`,
        severity: 'positive',
        priority: 8,
      });
    } else {
      const advanced = goals
        .filter((g) => g.status === 'active')
        .map((g) => ({ g, pct: goalProgressPercent(g) }))
        .filter((x) => x.pct >= 10)
        .sort((a, b) => b.pct - a.pct)[0];
      if (advanced) {
        insights.push({
          id: 'goal-progress',
          title: 'Meta avançou',
          body: `${advanced.g.name} está em ${advanced.pct}%.`,
          severity: 'positive',
          priority: 25,
        });
      }
      const stalled = goals.find(
        (g) =>
          g.status === 'active' &&
          g.currentAmountCents === 0 &&
          g.targetAmountCents > 0,
      );
      if (stalled) {
        insights.push({
          id: 'goal-stalled',
          title: 'Meta parada',
          body: `“${stalled.name}” ainda não tem valor reservado. Um pouco por mês já ajuda.`,
          severity: 'info',
          priority: 35,
        });
      }
    }

    const activeRecurring = recurring.filter((r) => r.isActive);
    if (activeRecurring.length >= 6) {
      const total = activeRecurring.reduce(
        (acc, r) => acc + effectiveRecurringAmountCents(r),
        0,
      );
      insights.push({
        id: 'many-recurring',
        title: 'Muitas recorrências',
        body: `Há ${activeRecurring.length} contas ativas (cerca de ${formatCentsToBRL(total)}/ciclo). Vale revisar o que ainda faz sentido.`,
        severity: 'info',
        priority: 30,
      });
    }

    const projection = getMonthProjection({
      transactions: snapshot.transactions,
      recurring,
      monthKey: snapshot.monthKey,
      monthlyIncomeCents: snapshot.monthlyIncomeCents,
      todayISO: today,
    });
    if (
      projection.upcomingRecurringCents > 0 &&
      projection.projectedAvailableCents < summary.availableCents * 0.35
    ) {
      insights.push({
        id: 'tight-projection',
        title: 'Projeção apertada',
        body: `Com as contas previstas, o disponível projetado fica em ${formatCentsToBRL(projection.projectedAvailableCents)}.`,
        severity: 'warning',
        priority: 12,
      });
    }

    const prev = buildMonthSummary(
      snapshot.transactions,
      shiftMonthKey(snapshot.monthKey, -1),
      snapshot.monthlyIncomeCents,
    );
    if (prev.expenseCents > 0) {
      const delta = summary.expenseCents - prev.expenseCents;
      insights.push({
        id: 'mom',
        title: 'Versus mês passado',
        body:
          delta === 0
            ? 'Gastos iguais ao mês anterior.'
            : delta > 0
              ? `Você gastou ${formatCentsToBRL(delta)} a mais que no mês passado.`
              : `Você gastou ${formatCentsToBRL(Math.abs(delta))} a menos que no mês passado.`,
        severity: delta > 0 ? 'warning' : 'positive',
        priority: delta < 0 ? 20 : 22,
      });
    }

    // Tendência de 3 meses: aumento ou redução consistente
    const m0 = summary.expenseCents;
    const m1 = buildMonthSummary(
      snapshot.transactions,
      shiftMonthKey(snapshot.monthKey, -1),
      snapshot.monthlyIncomeCents,
    ).expenseCents;
    const m2 = buildMonthSummary(
      snapshot.transactions,
      shiftMonthKey(snapshot.monthKey, -2),
      snapshot.monthlyIncomeCents,
    ).expenseCents;
    if (m2 > 0 && m1 > m2 && m0 > m1) {
      insights.push({
        id: 'rising-spend',
        title: 'Aumento consistente',
        body: 'Seus gastos subiram nos últimos três meses. Vale olhar as categorias que mais mudaram.',
        severity: 'warning',
        priority: 18,
      });
    } else if (m2 > 0 && m1 < m2 && m0 < m1) {
      insights.push({
        id: 'falling-spend',
        title: 'Redução de gastos',
        body: 'Você vem gastando menos nos últimos meses — bom sinal de controle.',
        severity: 'positive',
        priority: 18,
      });
    }

    const byCat = new Map<string, number>();
    for (const tx of snapshot.transactions) {
      if (tx.type !== 'expense') continue;
      if (!tx.date.startsWith(snapshot.monthKey)) continue;
      byCat.set(tx.categoryKey, (byCat.get(tx.categoryKey) ?? 0) + tx.amountCents);
    }
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) {
      insights.push({
        id: 'top-cat',
        title: 'Maior categoria',
        body: `${categoryLabel(top[0])} lidera com ${formatCentsToBRL(top[1])}.`,
        severity: 'info',
        priority: 45,
      });
    }

    return insights.sort((a, b) => a.priority - b.priority).slice(0, 8);
  }
}
