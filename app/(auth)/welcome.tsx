import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';

export default function AuthWelcomeScreen() {
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);

  return (
    <Screen scroll={false}>
      <Text
        variant="label"
        color="accent"
        style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}
      >
        Equilibrium
      </Text>
      <Spacer size="xl" />
      <Text variant="hero">Seu dinheiro, com calma.</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Crie uma conta para sincronizar seus dados com segurança — ou explore o
        modo DEMO neste dispositivo.
      </Text>
      <View style={{ flex: 1 }} />
      <Button
        label="Criar conta"
        onPress={() => router.push(routes.authSignUp)}
      />
      <Spacer size="sm" />
      <Button
        label="Entrar"
        variant="secondary"
        onPress={() => router.push(routes.authSignIn)}
      />
      <Spacer size="sm" />
      <Button
        label="Explorar DEMO"
        variant="ghost"
        onPress={() => {
          loadDemoData();
          enterDemo();
          router.replace(routes.appTabs);
        }}
      />
    </Screen>
  );
}
