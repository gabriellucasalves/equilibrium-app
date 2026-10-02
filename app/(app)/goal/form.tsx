import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { Button, Input, Screen, Spacer, Text } from '@/components/ui';
import { softSuccessHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useGoalsStore } from '@/store/goals-store';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

export default function GoalFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const goals = useGoalsStore((s) => s.goals);
  const createGoal = useGoalsStore((s) => s.createGoal);
  const contribute = useGoalsStore((s) => s.contribute);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';

  const existing = useMemo(
    () => (params.id ? goals.find((g) => g.id === params.id) : undefined),
    [goals, params.id],
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [targetRaw, setTargetRaw] = useState(
    existing
      ? formatCentsToBRL(existing.targetAmountCents).replace('R$\u00a0', '')
      : '',
  );
  const [initialRaw, setInitialRaw] = useState(
    existing
      ? formatCentsToBRL(existing.currentAmountCents).replace('R$\u00a0', '')
      : '',
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? '');
  const [contribRaw, setContribRaw] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const target = parseBRLToCents(targetRaw);
    const initial = initialRaw ? parseBRLToCents(initialRaw) : 0;
    if (!name.trim()) {
      setError('Informe um nome');
      return;
    }
    if (target === null || target <= 0) {
      setError('Informe um valor desejado válido');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        // contribuição opcional
        const contrib = contribRaw ? parseBRLToCents(contribRaw) : null;
        if (contrib && contrib > 0) {
          await contribute(existing.id, contrib, isDemo);
          await softSuccessHaptic();
        }
      } else {
        await createGoal(
          {
            name: name.trim(),
            targetAmountCents: target,
            currentAmountCents: initial ?? 0,
            targetDate: targetDate || null,
          },
          isDemo,
        );
        await softSuccessHaptic();
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: existing ? 'Meta' : 'Nova meta',
          headerShown: true,
        }}
      />
      <Screen>
        <Text variant="title">{existing ? existing.name : 'Nova meta'}</Text>
        <Spacer size="xs" />
        <Text variant="body" color="secondary">
          Reserva conceitual — não move dinheiro de conta.
        </Text>
        <Spacer size="lg" />
        {!existing ? (
          <>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Spacer size="md" />
            <Input
              label="Valor desejado"
              value={targetRaw}
              onChangeText={setTargetRaw}
              keyboardType="decimal-pad"
            />
            <Spacer size="md" />
            <Input
              label="Valor inicial (opcional)"
              value={initialRaw}
              onChangeText={setInitialRaw}
              keyboardType="decimal-pad"
            />
            <Spacer size="md" />
            <Input
              label="Prazo (AAAA-MM-DD, opcional)"
              value={targetDate}
              onChangeText={setTargetDate}
            />
          </>
        ) : (
          <>
            <Text variant="body">
              {formatCentsToBRL(existing.currentAmountCents)} /{' '}
              {formatCentsToBRL(existing.targetAmountCents)}
            </Text>
            <Spacer size="md" />
            <Input
              label="Adicionar valor"
              value={contribRaw}
              onChangeText={setContribRaw}
              keyboardType="decimal-pad"
              hint="Ex.: 200,00"
            />
          </>
        )}
        {error ? (
          <>
            <Spacer size="sm" />
            <Text variant="caption" color="danger">
              {error}
            </Text>
          </>
        ) : null}
        <Spacer size="xl" />
        <Button
          label={saving ? 'Salvando…' : existing ? 'Adicionar valor' : 'Criar meta'}
          onPress={onSave}
          disabled={saving}
        />
        <Spacer size="sm" />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </>
  );
}
