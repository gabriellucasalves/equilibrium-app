import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFinanceStore } from '@/store/finance-store';
import { useOnboardingStore } from '@/store/onboarding-store';

const CLOSED_TEST_RESET_KEY = 'equilibrium-closed-test-v2-initialized';

export async function prepareClosedTestState(): Promise<void> {
  const initialized = await AsyncStorage.getItem(CLOSED_TEST_RESET_KEY);
  if (initialized === 'true') return;

  useFinanceStore.getState().clearPrivateData();
  useOnboardingStore.getState().resetOnboarding();

  await AsyncStorage.setItem(CLOSED_TEST_RESET_KEY, 'true');
}
