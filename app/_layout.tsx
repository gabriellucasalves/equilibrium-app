import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CLOSED_TEST_MODE } from '@/features/closed-test/config';
import { AppThemeProvider, useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
  });
  const onboardingHydrated = useOnboardingStore((s) => s.hydrated);
  const setOnboardingHydrated = useOnboardingStore((s) => s.setHydrated);
  const financeHydrated = useFinanceStore((s) => s.hydrated);
  const setFinanceHydrated = useFinanceStore((s) => s.setHydrated);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authInitialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const unsubOnboarding = useOnboardingStore.persist.onFinishHydration(() => {
      setOnboardingHydrated(true);
    });
    const unsubFinance = useFinanceStore.persist.onFinishHydration(() => {
      setFinanceHydrated(true);
    });
    if (useOnboardingStore.persist.hasHydrated()) setOnboardingHydrated(true);
    if (useFinanceStore.persist.hasHydrated()) setFinanceHydrated(true);
    return () => {
      unsubOnboarding();
      unsubFinance();
    };
  }, [setOnboardingHydrated, setFinanceHydrated]);

  useEffect(() => {
    if (!CLOSED_TEST_MODE && financeHydrated && onboardingHydrated) {
      void initializeAuth();
    }
  }, [financeHydrated, onboardingHydrated, initializeAuth]);

  const ready =
    loaded &&
    onboardingHydrated &&
    financeHydrated &&
    (CLOSED_TEST_MODE || authInitialized);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
