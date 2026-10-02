import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Input, Spacer, Text } from '@/components/ui';
import {
  INTEREST_OPTIONS,
  useLocationPreferencesStore,
} from '@/store/location-preferences-store';
import { useTheme } from '@/lib/theme';

export function LocationSettings() {
  const theme = useTheme();
  const mode = useLocationPreferencesStore((s) => s.mode);
  const manualCity = useLocationPreferencesStore((s) => s.manualCity);
  const manualState = useLocationPreferencesStore((s) => s.manualState);
  const interests = useLocationPreferencesStore((s) => s.interests);
  const setMode = useLocationPreferencesStore((s) => s.setMode);
  const setManualPlace = useLocationPreferencesStore((s) => s.setManualPlace);
  const setInterests = useLocationPreferencesStore((s) => s.setInterests);

  const [city, setCity] = useState(manualCity);
  const [state, setState] = useState(manualState);

  const modeLabel =
    mode === 'automatic'
      ? 'Automática'
      : mode === 'manual'
        ? 'Cidade definida manualmente'
        : 'Não usar localização';

  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.md,
      }}
    >
      <Text variant="label">Localização</Text>
      <Spacer size="xs" />
      <Text variant="caption" color="secondary">
        Ativa: {modeLabel}
      </Text>
      <Spacer size="md" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip
          label="Automática"
          selected={mode === 'automatic'}
          onPress={() => setMode('automatic')}
        />
        <Chip
          label="Manual"
          selected={mode === 'manual'}
          onPress={() => setMode('manual')}
        />
        <Chip
          label="Não usar"
          selected={mode === 'disabled'}
          onPress={() => setMode('disabled')}
        />
      </View>

      {mode === 'manual' ? (
        <>
          <Spacer size="md" />
          <Input label="Cidade" value={city} onChangeText={setCity} />
          <Spacer size="sm" />
          <Input
            label="Estado (UF)"
            value={state}
            onChangeText={setState}
            autoCapitalize="characters"
          />
          <Spacer size="sm" />
          <Button
            label="Salvar cidade"
            onPress={() => setManualPlace(city, state)}
          />
        </>
      ) : null}

      <Spacer size="lg" />
      <Text variant="caption" color="secondary">
        Interesses (opcional)
      </Text>
      <Spacer size="sm" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {INTEREST_OPTIONS.map((item) => {
          const selected = interests.includes(item);
          return (
            <Chip
              key={item}
              label={item}
              selected={selected}
              onPress={() =>
                setInterests(
                  selected
                    ? interests.filter((i) => i !== item)
                    : [...interests, item],
                )
              }
            />
          );
        })}
      </View>
    </View>
  );
}
