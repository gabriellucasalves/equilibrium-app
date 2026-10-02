import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatCentsToBRL } from '@/utils/money';

type Props = {
  incomeCents: number;
  expenseCents: number;
  availableCents: number;
};

function MiniCard({
  label,
  cents,
}: {
  label: string;
  cents: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.md,
        padding: theme.spacing.sm,
        minHeight: 84,
        justifyContent: 'space-between',
      }}
    >
      <Text variant="caption">{label}</Text>
      <Text
        variant="label"
        style={{
          fontFamily: theme.typography.fonts.bodySemi,
          fontSize: theme.typography.sizes.md,
        }}
      >
        {formatCentsToBRL(cents)}
      </Text>
    </View>
  );
}

export function SummaryRow({
  incomeCents,
  expenseCents,
  availableCents,
}: Props) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <MiniCard label="Receitas" cents={incomeCents} />
      <MiniCard label="Gastos" cents={expenseCents} />
      <MiniCard label="Disponível" cents={availableCents} />
    </View>
  );
}
