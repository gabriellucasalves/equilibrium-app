import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { LocationSettings } from '@/features/location/components/LocationSettings';
import { routes } from '@/lib/routes';
import { createSupabaseRepositories } from '@/repositories/factory';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useSavedRecommendationsStore } from '@/store/saved-recommendations-store';
import type { ThemePreference } from '@/types/finance';

const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

export default function ProfileScreen() {
  const theme = useTheme();
  const displayName = useFinanceStore((s) => s.displayName);
  const setDisplayName = useFinanceStore((s) => s.setDisplayName);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const clearPrivateData = useFinanceStore((s) => s.clearPrivateData);
  const themePreference = useOnboardingStore((s) => s.themePreference);
  const setThemePreference = useOnboardingStore((s) => s.setThemePreference);

  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const exitDemo = useAuthStore((s) => s.exitDemo);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [name, setName] = useState(displayName || profile?.name || '');
  const savedRecs = useSavedRecommendationsStore((s) => s.items);

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(themePreference);
    setThemePreference(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
  };

  const confirmSignOut = () => {
    const run = async () => {
      if (status === 'demo' || isDemoMode) {
        clearPrivateData();
        exitDemo();
        router.replace(routes.authWelcome);
        return;
      }
      await signOut();
      router.replace(routes.authWelcome);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Sair da conta?')) {
        void run();
      }
      return;
    }

    Alert.alert('Sair da conta', 'Deseja encerrar a sessão neste dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void run() },
    ]);
  };

  const onSaveName = async () => {
    setDisplayName(name);
    if (status === 'authenticated') {
      try {
        await createSupabaseRepositories()?.profile.updateName(name);
        await refreshProfile();
      } catch {
        // mensagem já mapeável via hydrate; mantém local
      }
    }
  };

  return (
    <Screen>
      <Text variant="title">Perfil</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        {status === 'demo' || isDemoMode
          ? 'Modo DEMO — dados só neste dispositivo, sem sincronizar.'
          : 'Dados da conta e preferências.'}
      </Text>

      <Spacer size="xl" />
      <Input
        label="Nome"
        value={name}
        onChangeText={setName}
      />
      <Spacer size="md" />
      <Button label="Salvar nome" onPress={onSaveName} />

      {user?.email ? (
        <>
          <Spacer size="lg" />
          <View
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.lg,
              padding: theme.spacing.md,
            }}
          >
            <Text variant="caption">E-mail</Text>
            <Spacer size="xs" />
            <Text variant="body">{user.email}</Text>
          </View>
        </>
      ) : null}

      <Spacer size="xl" />
      <Button
        label="Notificações"
        variant="secondary"
        onPress={() => router.push(routes.profileNotifications)}
      />
      <Spacer size="sm" />
      <Button
        label="Exportar meus dados"
        variant="secondary"
        onPress={() => router.push(routes.profileExport)}
      />

      <Spacer size="xl" />
      <LocationSettings />

      {savedRecs.length > 0 ? (
        <>
          <Spacer size="xl" />
          <Text variant="label" color="secondary">
            Salvos ({savedRecs.length})
          </Text>
          <Spacer size="sm" />
          {savedRecs.slice(0, 5).map((item) => (
            <Text key={item.id} variant="caption" color="secondary">
              · {item.title}
            </Text>
          ))}
        </>
      ) : null}

      <Spacer size="xl" />
      <View
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
        }}
      >
        <Text variant="caption">Tema</Text>
        <Spacer size="xs" />
        <Text variant="body">
          {themePreference} ({theme.scheme})
        </Text>
      </View>
      <Spacer size="md" />
      <Button label="Alternar tema" variant="secondary" onPress={cycleTheme} />

      {(status === 'demo' || isDemoMode || status === 'unauthenticated') && (
        <>
          <Spacer size="xl" />
          <Button
            label="Recarregar dados DEMO (Gabriel)"
            variant="secondary"
            onPress={() => {
              loadDemoData();
            }}
          />
        </>
      )}

      <Spacer size="xl" />
      <Button label="Sair da conta" variant="ghost" onPress={confirmSignOut} />
      <Spacer size="sm" />
      <Text variant="caption" color="secondary">
        Exclusão de conta: fora desta fase — exige Edge Function com service
        role e confirmação forte. Ver RELEASE_READINESS.
      </Text>
    </Screen>
  );
}
