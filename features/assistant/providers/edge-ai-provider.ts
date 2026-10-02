import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import {
  buildNarrationUserPayload,
  CONTROLINHO_SYSTEM_PROMPT,
} from '@/features/assistant/prompts/system';
import type { AICompleteInput, AIProvider } from '@/features/assistant/providers/types';
import { MockAIProvider } from '@/features/assistant/providers/mock-ai-provider';

/**
 * LLM via Edge Function — chave só no servidor.
 * Se indisponível, cai no MockAIProvider (narrativa deterministicamente segura).
 */
export class EdgeAIProvider implements AIProvider {
  readonly name = 'edge_llm';

  async complete(input: AICompleteInput): Promise<string> {
    const client = getSupabase();
    if (!client) {
      return new MockAIProvider().complete(input);
    }

    try {
      const { data, error } = await client.functions.invoke('controlinho-chat', {
        body: {
          system: CONTROLINHO_SYSTEM_PROMPT,
          payload: buildNarrationUserPayload({
            question: input.question,
            displayName: input.displayName,
            monthKey: input.monthKey,
            toolResults: input.toolResults,
          }),
        },
      });

      if (error) throw error;
      if (data?.unavailable) {
        return new MockAIProvider().complete(input);
      }
      const answer = String(data?.answer ?? '').trim();
      if (!answer) {
        return new MockAIProvider().complete(input);
      }
      return answer;
    } catch (e) {
      // Fallback silencioso para não prender o usuário
      if (__DEV__) {
        console.warn('[Controlinho] Edge AI fallback', e);
      }
      return new MockAIProvider().complete(input);
    }
  }
}

export function createAIProvider(options: {
  isDemo: boolean;
  forceMock?: boolean;
}): AIProvider {
  if (options.isDemo || options.forceMock) {
    return new MockAIProvider();
  }
  return new EdgeAIProvider();
}

/** Evita AppError não usado em builds estritos se tree-shake falhar. */
export function assertAIConfigured(): void {
  if (!getSupabase()) {
    throw new AppError('Assistente requer conexão quando fora do DEMO.');
  }
}
