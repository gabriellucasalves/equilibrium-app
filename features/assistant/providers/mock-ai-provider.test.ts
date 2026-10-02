import { MockAIProvider } from '@/features/assistant/providers/mock-ai-provider';

describe('MockAIProvider', () => {
  it('narra a partir dos summaries das tools', async () => {
    const answer = await new MockAIProvider().complete({
      question: 'Quanto gastei?',
      displayName: 'Gabriel',
      monthKey: '2026-10',
      toolResults: [
        {
          toolName: 'get_month_summary',
          ok: true,
          data: { expenseCents: 1000 },
          summary: 'Você gastou R$ 10,00.',
        },
      ],
    });
    expect(answer).toContain('R$ 10,00');
    expect(answer).not.toMatch(/R\$\s*999/);
  });
});
