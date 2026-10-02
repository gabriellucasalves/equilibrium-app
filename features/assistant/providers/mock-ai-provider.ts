import type { AICompleteInput, AIProvider } from '@/features/assistant/providers/types';

/**
 * Narrativa local sem LLM externo.
 * Usa os summaries das tools — nunca inventa números novos.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async complete(input: AICompleteInput): Promise<string> {
    const name = input.displayName?.split(' ')[0] || 'Você';
    const bits = input.toolResults.filter((t) => t.ok).map((t) => t.summary);
    if (bits.length === 0) {
      return `${name}, ainda não tenho dados suficientes para responder com segurança. Quando houver lançamentos, eu te explico o mês com calma.`;
    }

    const lead = bits[0];
    const extra = bits.slice(1, 3).join(' ');
    return [lead, extra, 'Se quiser, posso detalhar outra categoria ou comparar com o mês passado.']
      .filter(Boolean)
      .join(' ');
  }
}
