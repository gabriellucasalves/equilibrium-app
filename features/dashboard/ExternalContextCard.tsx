import { Pressable } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { FEATURE_FLAGS } from '@/constants/feature-flags';
import { useTheme } from '@/lib/theme';
import { useFinanceStore } from '@/store/finance-store';
import { useLocationPreferencesStore } from '@/store/location-preferences-store';
import { currentMonthKey } from '@/utils/date';
import { buildBudgetProgress } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';

/** No máximo 1 card externo contextual na Home — sem propaganda. */
export function ExternalContextCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const mode = useLocationPreferencesStore((s) => s.mode);

  if (!FEATURE_FLAGS.EXTERNAL_SEARCH_ENABLED) return null;
  if (mode === 'disabled') return null;

  const leisure = buildBudgetProgress(
    budgets,
    transactions,
    currentMonthKey(),
  ).find((b) => b.categoryKey === 'leisure');

  if (!leisure || leisure.remainingCents < 5000) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        backgroundColor: theme.colors.accentSoft,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.md,
      })}
    >
      <Text variant="label" color="accent">
        Controlinho
      </Text>
      <Spacer size="xs" />
      <Text variant="body">
        Você ainda tem {formatCentsToBRL(leisure.remainingCents)} no orçamento de
        lazer. Posso buscar opções gratuitas neste fim de semana.
      </Text>
    </Pressable>
  );
}
