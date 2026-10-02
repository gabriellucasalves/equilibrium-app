import { mapErrorToUserMessage } from '@/services/errors/map-error';

describe('mapErrorToUserMessage', () => {
  test('mapeia rede e auth', () => {
    expect(mapErrorToUserMessage(new Error('Network request failed'))).toMatch(
      /conexão/i,
    );
    expect(
      mapErrorToUserMessage(new Error('Invalid login credentials')),
    ).toMatch(/incorretos/i);
    expect(mapErrorToUserMessage(new Error('PGRST116'))).toMatch(/carregar/i);
  });
});
