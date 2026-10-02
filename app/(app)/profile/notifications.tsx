import { Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { maybeAskNotificationPermission } from '@/features/notifications/permissions';
import { useTheme } from '@/lib/theme';
import { useNotificationPreferencesStore } from '@/store/notification-preferences-store';

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        minHeight: 48,
      }}
    >
      <Text variant="body" style={{ flex: 1, paddingRight: 12 }}>
        {label}
      </Text>
      <Text variant="label" color={value ? 'accent' : 'secondary'}>
        {value ? 'Ativo' : 'Off'}
      </Text>
    </Pressable>
  );
}

export default function NotificationPreferencesScreen() {
  const theme = useTheme();
  const dueDates = useNotificationPreferencesStore((s) => s.dueDates);
  const budgets = useNotificationPreferencesStore((s) => s.budgets);
  const goals = useNotificationPreferencesStore((s) => s.goals);
  const weeklySummary = useNotificationPreferencesStore((s) => s.weeklySummary);
  const controlinhoTips = useNotificationPreferencesStore(
    (s) => s.controlinhoTips,
  );
  const preferredHour = useNotificationPreferencesStore((s) => s.preferredHour);
  const setToggle = useNotificationPreferencesStore((s) => s.setToggle);
  const setPreferredHour = useNotificationPreferencesStore(
    (s) => s.setPreferredHour,
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Notificações', headerShown: true }} />
      <Screen>
        <Text variant="body" color="secondary">
          Lembretes locais neste dispositivo. Sem push remoto nesta fase.
        </Text>
        <Spacer size="lg" />
        <ToggleRow
          label="Vencimentos"
          value={dueDates}
          onChange={(v) => setToggle('dueDates', v)}
        />
        <ToggleRow
          label="Limites de orçamento"
          value={budgets}
          onChange={(v) => setToggle('budgets', v)}
        />
        <ToggleRow
          label="Metas"
          value={goals}
          onChange={(v) => setToggle('goals', v)}
        />
        <ToggleRow
          label="Resumo semanal"
          value={weeklySummary}
          onChange={(v) => setToggle('weeklySummary', v)}
        />
        <ToggleRow
          label="Sugestões do Controlinho"
          value={controlinhoTips}
          onChange={(v) => setToggle('controlinhoTips', v)}
        />

        <Spacer size="xl" />
        <Text variant="label" color="secondary">
          Horário preferido
        </Text>
        <Spacer size="sm" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[8, 9, 10, 12, 18].map((hour) => (
            <Pressable
              key={hour}
              accessibilityRole="button"
              accessibilityState={{ selected: preferredHour === hour }}
              onPress={() => setPreferredHour(hour)}
              style={{
                minWidth: 56,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: theme.radii.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  preferredHour === hour
                    ? theme.colors.accentSoft
                    : theme.colors.surfaceMuted,
              }}
            >
              <Text variant="body">
                {String(hour).padStart(2, '0')}:00
              </Text>
            </Pressable>
          ))}
        </View>
        <Spacer size="sm" />
        <Text variant="caption" color="secondary">
          Evitamos notificações noturnas por padrão.
        </Text>

        <Spacer size="xl" />
        <Button
          label="Permitir lembretes neste aparelho"
          variant="secondary"
          onPress={() =>
            void maybeAskNotificationPermission(
              'Quer receber lembretes de vencimentos e orçamentos?',
            )
          }
        />
      </Screen>
    </>
  );
}
