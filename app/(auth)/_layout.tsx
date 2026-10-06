import { Redirect, Stack } from 'expo-router';

import { CLOSED_TEST_MODE } from '@/features/closed-test/config';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function AuthLayout() {
  const theme = useTheme();
  const closedTestCompleted = useOnboardingStore((s) => s.completed);

  if (CLOSED_TEST_MODE) {
    return (
      <Redirect
        href={closedTestCompleted ? routes.appTabs : routes.onboardingWelcome}
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}
    />
  );
}
