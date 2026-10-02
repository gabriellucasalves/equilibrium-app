import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useNotificationPreferencesStore } from '@/store/notification-preferences-store';
import type { RecurringExpense } from '@/types/recurring';
import type { BudgetProgress } from '@/types/finance';
import type { FinancialGoal } from '@/types/goals';
import { dueUrgency } from '@/utils/recurring';
import { toISODate } from '@/utils/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Agenda/dispara lembretes locais com dedupe — sem push remoto. */
export async function syncLocalNotifications(input: {
  recurring: RecurringExpense[];
  budgets: BudgetProgress[];
  goals: FinancialGoal[];
}): Promise<void> {
  if (Platform.OS === 'web') return;

  const prefs = useNotificationPreferencesStore.getState();
  const today = toISODate();

  if (prefs.dueDates) {
    for (const item of input.recurring.filter((r) => r.isActive)) {
      const urgency = dueUrgency(item.nextDueDate, today);
      if (urgency !== 'tomorrow' && urgency !== 'today') continue;
      const key = `due:${item.id}:${item.nextDueDate}:${urgency}`;
      if (prefs.wasSent(key)) continue;
      await presentLocal(
        urgency === 'today'
          ? `${item.name} vence hoje`
          : `${item.name} vence amanhã`,
        'Abra o Equilibrium para registrar o pagamento quando quiser.',
      );
      prefs.markSent(key);
    }
  }

  if (prefs.budgets) {
    for (const b of input.budgets) {
      if (b.usagePercent < 80) continue;
      const tier = b.usagePercent >= 100 ? '100' : '80';
      const key = `budget:${b.categoryKey}:${today.slice(0, 7)}:${tier}`;
      if (prefs.wasSent(key)) continue;
      await presentLocal(
        tier === '100'
          ? `Orçamento de ${b.label} chegou a 100%`
          : `Orçamento de ${b.label} chegou a 80%`,
        'Isso é só um alerta — você decide o próximo passo.',
      );
      prefs.markSent(key);
    }
  }

  if (prefs.goals) {
    for (const g of input.goals) {
      if (g.status !== 'completed') continue;
      const key = `goal-done:${g.id}`;
      if (prefs.wasSent(key)) continue;
      await presentLocal(
        `Meta concluída: ${g.name}`,
        'Parabéns — você registrou o valor desejado.',
      );
      prefs.markSent(key);
    }
  }
}

async function presentLocal(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // ignore
  }
}
