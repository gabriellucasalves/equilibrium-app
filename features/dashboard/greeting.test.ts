import { buildGreeting } from './greeting';

describe('greeting', () => {
  test('manhã / tarde / noite', () => {
    expect(buildGreeting('Gabriel', 8)).toBe('Bom dia, Gabriel.');
    expect(buildGreeting('Gabriel', 15)).toBe('Boa tarde, Gabriel.');
    expect(buildGreeting('Gabriel', 21)).toBe('Boa noite, Gabriel.');
  });
});
