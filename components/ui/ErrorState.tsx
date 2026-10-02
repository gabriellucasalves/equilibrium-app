import { View } from 'react-native';

import { Button, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surfaceMuted,
      }}
      accessibilityRole="alert"
    >
      <Text variant="label">Algo deu errado</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        {message ?? 'Não consegui carregar seus dados.'}
      </Text>
      {onRetry ? (
        <>
          <Spacer size="md" />
          <Button label="Tentar novamente" onPress={onRetry} />
        </>
      ) : null}
    </View>
  );
}
