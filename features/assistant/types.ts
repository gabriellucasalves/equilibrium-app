import type { LocationContext } from '@/features/location/types';
import type { Budget, Transaction } from '@/types/finance';
import type { FinancialGoal } from '@/types/goals';
import type { RecurringExpense } from '@/types/recurring';

export type ControlinhoMood =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'celebrating'
  | 'warning'
  | 'sleeping'
  | 'happy'
  | 'alert'
  | 'speaking';

export type AssistantRole = 'user' | 'assistant' | 'system';

export type AssistantExternalCard = {
  id: string;
  kind: string;
  title: string;
  description: string;
  location?: string | null;
  priceFormatted: string;
  distanceLabel?: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  stale?: boolean;
  withinLeisureBudget?: boolean;
};

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  toolNames?: string[];
  externalCards?: AssistantExternalCard[];
};

export type AssistantConversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
};

/** Snapshot mínimo para tools — nunca o banco inteiro no prompt. */
export type FinancialSnapshot = {
  displayName: string;
  monthlyIncomeCents: number;
  budgets: Budget[];
  transactions: Transaction[];
  goals?: FinancialGoal[];
  recurring?: RecurringExpense[];
  /** Itens de nota (opcional; só quando a pergunta exigir). */
  receiptItems: ReceiptItemSlice[];
  monthKey: string;
  locationContext?: LocationContext | null;
};

export type ReceiptItemSlice = {
  normalizedDescription: string;
  rawDescription: string;
  totalPriceInCents: number;
  categoryKey: string;
  merchantName?: string | null;
  purchaseDate?: string | null;
};

export type ToolResult = {
  toolName: string;
  ok: boolean;
  data: Record<string, unknown>;
  summary: string;
};

export type AssistantTurnResult = {
  answer: string;
  toolResults: ToolResult[];
  mood: ControlinhoMood;
  usedProvider: string;
  externalCards?: AssistantExternalCard[];
  needsLocationPermission?: boolean;
  needsManualLocation?: boolean;
};
