import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';

export default function ForgotPasswordScreen() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const clearError = useAuthStore((s) => s.clearError);
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    clearError();
    setInfo(undefined);
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo('Se o e-mail existir, enviamos um link de recuperação.');
    } catch {
      // store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Recuperar senha</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Enviaremos um link para o seu e-mail.
      </Text>
      <Spacer size="xl" />
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errorMessage || undefined}
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
        label={loading ? 'Enviando…' : 'Enviar recuperação'}
        onPress={onSubmit}
        disabled={loading}
      />
      <Spacer size="sm" />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
