import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import type { Transaction } from '@/types/finance';
import { formatISODateBR } from '@/utils/date';
import { categoryLabel } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';

type Props = {
  transaction: Transaction;
  onPress: () => void;
};

export function TransactionRow({ transaction, onPress }: Props) {
  const theme = useTheme();
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        opacity: pressed ? 0.75 : 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">
          {transaction.note || categoryLabel(transaction.categoryKey)}
        </Text>
        <Text variant="caption">
          {categoryLabel(transaction.categoryKey)} ·{' '}
          {formatISODateBR(transaction.date)}
          {transaction.receiptId ? ' · Nota fiscal' : ''}
        </Text>
      </View>
      <Text
        variant="label"
        color={isIncome ? 'accent' : 'default'}
        style={{ fontFamily: theme.typography.fonts.bodySemi }}
      >
        {isIncome ? '+' : '−'}
        {formatCentsToBRL(transaction.amountCents)}
      </Text>
    </Pressable>
  );
}
