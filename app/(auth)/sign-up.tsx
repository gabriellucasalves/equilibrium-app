import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/auth-store';

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    clearError();
    setInfo(undefined);
    if (!name.trim()) {
      setLocalError('Informe seu nome');
      return;
    }
    if (!email.trim()) {
      setLocalError('Informe seu e-mail');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha precisa ter ao menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setLocalError('As senhas não coincidem');
      return;
    }
    setLocalError(undefined);
    setLoading(true);
    try {
      const result = await signUp({ name, email, password });
      if (result.needsEmailConfirmation) {
        setInfo('Enviamos um e-mail de confirmação. Depois disso, entre na conta.');
      } else {
        router.replace('/');
      }
    } catch {
      // errorMessage no store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Criar conta</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Seus dados financeiros ficam isolados por conta.
      </Text>
      <Spacer size="xl" />
      <Input label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
      <Spacer size="md" />
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
      />
      <Spacer size="md" />
      <Input
        label="Confirmar senha"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        error={localError || errorMessage || undefined}
      />
      {info ? (
        <>
          <Spacer size="sm" />
          <Text variant="caption" color="accent">
            {info}
          </Text>
        </>
      ) : null}
      <View style={{ flex: 1, minHeight: 32 }} />
      <Button
        label={loading ? 'Criando…' : 'Criar conta'}
        onPress={onSubmit}
        disabled={loading}
      />
      <Spacer size="sm" />
      <Button label="Já tenho conta" variant="ghost" onPress={() => router.push(routes.authSignIn)} />
      <Spacer size="sm" />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
