import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { createSupabaseRepositories } from '@/repositories/factory';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';

export default function MigrateLocalScreen() {
  const setNeedsLocalMigration = useAuthStore((s) => s.setNeedsLocalMigration);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const displayName = useFinanceStore((s) => s.displayName);
  const monthlyIncomeCents = useFinanceStore((s) => s.monthlyIncomeCents);
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const hydrateFromRemote = useFinanceStore((s) => s.hydrateFromRemote);
  const clearFinanceData = useFinanceStore((s) => s.clearFinanceData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const finish = async () => {
    setNeedsLocalMigration(false);
    await refreshProfile();
    await hydrateFromRemote();
    router.replace('/');
  };

  const onSave = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const repos = createSupabaseRepositories();
      if (!repos) throw new Error('Supabase não configurado');
      await repos.migration.uploadLocalSnapshot({
        name: displayName,
        monthlyIncomeCents,
        budgets,
        transactions,
      });
      await finish();
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onFresh = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const repos = createSupabaseRepositories();
      await repos?.migration.markCompleted('v1-skip');
      clearFinanceData();
      await finish();
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Encontramos dados neste dispositivo</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Você pode salvar na sua conta ou começar do zero. Isso só acontece uma
        vez.
      </Text>
      {error ? (
        <>
          <Spacer size="md" />
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </>
      ) : null}
      <View style={{ flex: 1, minHeight: 48 }} />
      <Button
        label={loading ? 'Salvando…' : 'Salvar na minha conta'}
        onPress={onSave}
        disabled={loading}
      />
      <Spacer size="sm" />
      <Button
        label="Começar do zero"
        variant="secondary"
        onPress={onFresh}
        disabled={loading}
      />
    </Screen>
  );
}
