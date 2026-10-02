import type { FinancialSnapshot, ToolResult } from '@/features/assistant/types';

export type ToolArgs = Record<string, string | number | undefined>;

export type FinancialTool = {
  name: string;
  description: string;
  run: (snapshot: FinancialSnapshot, args?: ToolArgs) => ToolResult;
};
