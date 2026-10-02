import { Stack } from 'expo-router';

import { useTheme } from '@/lib/theme';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="transaction/form"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Movimentação',
        }}
      />
      <Stack.Screen
        name="goal/form"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Meta',
        }}
      />
      <Stack.Screen
        name="recurring/form"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Conta recorrente',
        }}
      />
      <Stack.Screen
        name="profile/notifications"
        options={{ headerShown: true, title: 'Notificações' }}
      />
      <Stack.Screen
        name="profile/export"
        options={{ headerShown: true, title: 'Exportar dados' }}
      />
      <Stack.Screen name="receipt/capture" options={{ presentation: 'modal' }} />
      <Stack.Screen name="receipt/processing" />
      <Stack.Screen name="receipt/review" />
      <Stack.Screen name="receipt/detail" />
      <Stack.Screen name="receipt/qr" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
