export const Platform = { OS: 'web', select: (obj: Record<string, unknown>) => obj.web };
export const AppState = { addEventListener: () => ({ remove: () => undefined }) };
export const View = 'View';
export const Text = 'Text';
export const StyleSheet = { create: (s: unknown) => s, absoluteFill: {} };
