import type {
  FinancialSnapshot,
  ReceiptItemSlice,
} from '@/features/assistant/types';
import type { LocationContext } from '@/features/location/types';
import { createSupabaseRepositories } from '@/repositories/factory';
import { useFinanceStore } from '@/store/finance-store';
import { useGoalsStore } from '@/store/goals-store';
import { useRecurringStore } from '@/store/recurring-store';
import { currentMonthKey } from '@/utils/date';
import { buildBudgetProgress } from '@/utils/finance-summary';

export class AssistantContextService {
  /** Monta snapshot local. Não serializa dump bruto para o LLM. */
  buildSnapshot(options?: {
    monthKey?: string;
    includeReceiptItems?: boolean;
    receiptItems?: ReceiptItemSlice[];
    locationContext?: LocationContext | null;
  }): FinancialSnapshot {
    const state = useFinanceStore.getState();
    return {
      displayName: state.displayName || 'Você',
      monthlyIncomeCents: state.monthlyIncomeCents,
      budgets: state.budgets,
      transactions: state.transactions,
      goals: useGoalsStore.getState().goals,
      recurring: useRecurringStore.getState().items,
      receiptItems: options?.receiptItems ?? [],
      monthKey: options?.monthKey ?? currentMonthKey(),
      locationContext: options?.locationContext ?? null,
    };
  }

  leisureRemainingCents(snapshot: FinancialSnapshot): number | null {
    const progress = buildBudgetProgress(
      snapshot.budgets,
      snapshot.transactions,
      snapshot.monthKey,
    );
    const leisure = progress.find((p) => p.categoryKey === 'leisure');
    if (!leisure) return null;
    return Math.max(0, leisure.remainingCents);
  }

  async loadReceiptItemsIfNeeded(
    needed: boolean,
  ): Promise<ReceiptItemSlice[]> {
    if (!needed) return [];
    const repos = createSupabaseRepositories();
    if (!repos) {
      // DEMO / local: usa receipt items vazios; histórico pode vir vazio
      return [];
    }
    try {
      const receipts = await repos.receipts.list();
      const items: ReceiptItemSlice[] = [];
      for (const r of receipts) {
        for (const item of r.items) {
          items.push({
            normalizedDescription: item.normalizedDescription,
            rawDescription: item.rawDescription,
            totalPriceInCents: item.totalPriceInCents,
            categoryKey: item.categoryKey,
            merchantName: r.merchantName,
            purchaseDate: r.purchaseDate,
          });
        }
      }
      return items;
    } catch {
      return [];
    }
  }
}
