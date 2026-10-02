import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    clearError();
    if (!email.trim() || !password) {
      setLocalError('Informe e-mail e senha');
      return;
    }
    setLocalError(undefined);
    setLoading(true);
    try {
      await signIn({ email, password });
      router.replace('/');
    } catch {
      // store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Entrar</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Acesse sua conta Equilibrium.
      </Text>
      <Spacer size="xl" />
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Spacer size="md" />
      <Input
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={localError || errorMessage || undefined}
      />
      <Spacer size="sm" />
      <Text
        variant="caption"
        color="accent"
        onPress={() => router.push(routes.authForgotPassword)}
      >
        Esqueci minha senha
      </Text>
      <View style={{ flex: 1, minHeight: 32 }} />
      <Button
        label={loading ? 'Entrando…' : 'Entrar'}
        onPress={onSubmit}
        disabled={loading}
      />
      <Spacer size="sm" />
      <Button
        label="Criar conta"
        variant="ghost"
        onPress={() => router.push(routes.authSignUp)}
      />
      <Spacer size="sm" />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
