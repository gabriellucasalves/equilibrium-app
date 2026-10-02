import { View } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatCentsToBRL } from '@/utils/money';

type Props = {
  availableCents: number;
  incomeCents: number;
};

export function AvailableCard({ availableCents, incomeCents }: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radii.xl,
        padding: theme.spacing.lg,
      }}
    >
      <Text variant="label" color="inverse" style={{ opacity: 0.85 }}>
        Disponível neste mês
      </Text>
      <Spacer size="xs" />
      <Text variant="hero" color="inverse">
        {formatCentsToBRL(availableCents)}
      </Text>
      <Spacer size="sm" />
      <Text variant="body" color="inverse" style={{ opacity: 0.9 }}>
        De uma renda de {formatCentsToBRL(incomeCents)}
      </Text>
    </View>
  );
}
