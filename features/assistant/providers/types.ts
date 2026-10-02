import type { ToolResult } from '@/features/assistant/types';

export type AICompleteInput = {
  question: string;
  displayName: string;
  monthKey: string;
  toolResults: ToolResult[];
};

export interface AIProvider {
  readonly name: string;
  complete(input: AICompleteInput): Promise<string>;
}
