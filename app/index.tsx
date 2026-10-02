import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';

export default function Index() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  const needsLocalMigration = useAuthStore((s) => s.needsLocalMigration);
  const hydrateFromRemote = useFinanceStore((s) => s.hydrateFromRemote);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);

  useEffect(() => {
    if (status === 'authenticated' && !needsLocalMigration && profile?.onboardingCompleted) {
      void hydrateFromRemote();
    }
  }, [status, needsLocalMigration, profile?.onboardingCompleted, hydrateFromRemote]);

  if (!initialized || status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="caption" color="secondary">
          Organizando seu espaço…
        </Text>
      </View>
    );
  }

  if (status === 'demo' || isDemoMode) {
    return <Redirect href={routes.appTabs} />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href={routes.authWelcome} />;
  }

  if (needsLocalMigration) {
    return <Redirect href={routes.authMigrate} />;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href={routes.onboardingWelcome} />;
  }

  return <Redirect href={routes.appTabs} />;
}
