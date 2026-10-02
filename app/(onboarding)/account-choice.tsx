import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import {
  CLOSED_TEST_ACCOUNTS,
  type ClosedTestAccount,
} from '@/features/closed-test/config';
import { routes } from '@/lib/routes';
import { useOnboardingStore } from '@/store/onboarding-store';

function goToAccount(account: ClosedTestAccount) {
  router.push({
    pathname: '/(onboarding)/account-amount',
    params: { account: account.key },
  });
}

export default function AccountChoiceScreen() {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [primary, ...secondary] = CLOSED_TEST_ACCOUNTS;

  const finishWithoutExpense = () => {
    completeOnboarding();
    router.replace(routes.appTabs);
  };

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        Qual conta você quer registrar?
      </Text>
      <Spacer size="xl" />

      <Button
        label={primary.label}
        onPress={() => goToAccount(primary)}
        testID="account-energy"
      />

      <Spacer size="md" />

      <View style={{ gap: 12 }}>
        {secondary.map((account) => (
          <Button
            key={account.key}
            label={account.label}
            variant="secondary"
            onPress={() => goToAccount(account)}
            testID={`account-${account.key}`}
          />
        ))}
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <Button
        label="Agora não"
        variant="ghost"
        onPress={finishWithoutExpense}
        testID="account-skip"
      />
    </Screen>
  );
}
