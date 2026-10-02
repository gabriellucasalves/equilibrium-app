import { View } from 'react-native';

import { Button, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useLocationPreferencesStore } from '@/store/location-preferences-store';

export function LocationPermissionSheet({
  onAllowOnce,
  onAllowAlways,
  onNotNow,
}: {
  onAllowOnce: () => void;
  onAllowAlways: () => void;
  onNotNow: () => void;
}) {
  const theme = useTheme();
  const setMode = useLocationPreferencesStore((s) => s.setMode);

  return (
    <View
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surfaceMuted,
        marginBottom: theme.spacing.md,
      }}
    >
      <Text variant="label">Localização</Text>
      <Spacer size="xs" />
      <Text variant="caption" color="secondary">
        Para encontrar opções perto de você, o Equilibrium pode usar sua
        localização. Coordenadas precisas não são enviadas ao assistente.
      </Text>
      <Spacer size="md" />
      <Button label="Permitir desta vez" onPress={onAllowOnce} />
      <Spacer size="sm" />
      <Button
        label="Permitir"
        variant="secondary"
        onPress={() => {
          setMode('automatic');
          onAllowAlways();
        }}
      />
      <Spacer size="sm" />
      <Button
        label="Agora não"
        variant="ghost"
        onPress={() => {
          setMode('disabled');
          onNotNow();
        }}
      />
    </View>
  );
}
