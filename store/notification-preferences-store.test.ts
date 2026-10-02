import { useNotificationPreferencesStore } from '@/store/notification-preferences-store';

describe('notification preferences / dedupe', () => {
  beforeEach(() => {
    useNotificationPreferencesStore.setState({
      dueDates: true,
      budgets: true,
      goals: true,
      weeklySummary: false,
      controlinhoTips: false,
      preferredHour: 9,
      sentKeys: [],
    });
  });

  it('deduplica chaves enviadas', () => {
    const store = useNotificationPreferencesStore.getState();
    expect(store.wasSent('due:r1:2026-10-10:tomorrow')).toBe(false);
    store.markSent('due:r1:2026-10-10:tomorrow');
    expect(
      useNotificationPreferencesStore
        .getState()
        .wasSent('due:r1:2026-10-10:tomorrow'),
    ).toBe(true);
  });

  it('limita horário preferido a faixa diurna', () => {
    useNotificationPreferencesStore.getState().setPreferredHour(3);
    expect(useNotificationPreferencesStore.getState().preferredHour).toBe(8);
    useNotificationPreferencesStore.getState().setPreferredHour(23);
    expect(useNotificationPreferencesStore.getState().preferredHour).toBe(21);
  });
});
