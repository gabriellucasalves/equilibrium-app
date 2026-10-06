import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { CLOSED_TEST_MODE } from '@/features/closed-test/config';
import { prepareClosedTestState } from '@/features/closed-test/reset';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function Index() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  const needsLocalMigration = useAuthStore((s) => s.needsLocalMigration);
  const hydrateFromRemote = useFinanceStore((s) => s.hydrateFromRemote);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const closedTestCompleted = useOnboardingStore((s) => s.completed);
  const [closedTestReady, setClosedTestReady] = useState(!CLOSED_TEST_MODE);

  useEffect(() => {
    if (!CLOSED_TEST_MODE) return;
    let active = true;
    void prepareClosedTestState().finally(() => {
      if (active) setClosedTestReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !CLOSED_TEST_MODE &&
      status === 'authenticated' &&
      !needsLocalMigration &&
      profile?.onboardingCompleted
    ) {
      void hydrateFromRemote();
    }
  }, [
    status,
    needsLocalMigration,
    profile?.onboardingCompleted,
    hydrateFromRemote,
  ]);

  if (CLOSED_TEST_MODE) {
    if (!closedTestReady) {
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
            Preparando seu mês…
          </Text>
        </View>
      );
    }

    return (
      <Redirect
        href={closedTestCompleted ? routes.appTabs : routes.onboardingWelcome}
      />
    );
  }

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
