import { budgetStatusTool } from '@/features/assistant/tools/budget-status';
import {
  categorySpendTool,
  topCategoriesTool,
} from '@/features/assistant/tools/category-spend';
import { compareMonthsTool } from '@/features/assistant/tools/compare-months';
import {
  calculateGoalProjectionTool,
  getGoalProgressTool,
  getGoalsTool,
} from '@/features/assistant/tools/goals';
import { keywordSpendTool } from '@/features/assistant/tools/keyword-spend';
import { merchantSpendTool } from '@/features/assistant/tools/merchant-spend';
import { getMonthProjectionTool } from '@/features/assistant/tools/month-projection';
import { monthSummaryTool } from '@/features/assistant/tools/month-summary';
import {
  comparePriceTool,
  productPurchaseHistoryTool,
} from '@/features/assistant/tools/product-history';
import { recurringTool } from '@/features/assistant/tools/recurring';
import { savingsTool } from '@/features/assistant/tools/savings';
import type { FinancialTool, ToolArgs } from '@/features/assistant/tools/types';
import type { FinancialSnapshot, ToolResult } from '@/features/assistant/types';

const TOOLS: FinancialTool[] = [
  monthSummaryTool,
  topCategoriesTool,
  categorySpendTool,
  budgetStatusTool,
  compareMonthsTool,
  merchantSpendTool,
  keywordSpendTool,
  recurringTool,
  savingsTool,
  productPurchaseHistoryTool,
  comparePriceTool,
  getGoalsTool,
  getGoalProgressTool,
  calculateGoalProjectionTool,
  getMonthProjectionTool,
];

export class FinancialToolRegistry {
  private readonly byName = new Map(TOOLS.map((t) => [t.name, t]));

  list(): FinancialTool[] {
    return [...TOOLS];
  }

  get(name: string): FinancialTool | undefined {
    return this.byName.get(name);
  }

  run(
    name: string,
    snapshot: FinancialSnapshot,
    args?: ToolArgs,
  ): ToolResult {
    const tool = this.byName.get(name);
    if (!tool) {
      return {
        toolName: name,
        ok: false,
        data: {},
        summary: `Ferramenta desconhecida: ${name}`,
      };
    }
    return tool.run(snapshot, args);
  }

  runMany(
    calls: { name: string; args?: ToolArgs }[],
    snapshot: FinancialSnapshot,
  ): ToolResult[] {
    return calls.map((c) => this.run(c.name, snapshot, c.args));
  }
}
