import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Input, Screen, Spacer, Text } from '@/components/ui';
import { ONBOARDING_CATEGORIES } from '@/constants/categories';
import { softSuccessHaptic } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useRecurringStore } from '@/store/recurring-store';
import type { RecurringFrequency } from '@/types/recurring';
import { parseBRLToCents } from '@/utils/money';
import { computeNextDueDate } from '@/utils/recurring';
import { maybeAskNotificationPermission } from '@/features/notifications/permissions';

export default function RecurringFormScreen() {
  const theme = useTheme();
  const createItem = useRecurringStore((s) => s.createItem);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [categoryKey, setCategoryKey] = useState('leisure');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dueDay, setDueDay] = useState('10');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const amount = amountRaw ? parseBRLToCents(amountRaw) : null;
    const day = Number(dueDay);
    if (!name.trim()) {
      setError('Informe um nome');
      return;
    }
    if (amountRaw && (amount === null || amount < 0)) {
      setError('Valor inválido');
      return;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError('Dia de vencimento entre 1 e 31');
      return;
    }
    setSaving(true);
    try {
      const nextDueDate = computeNextDueDate({
        frequency,
        dueDay: day,
      });
      await createItem(
        {
          name: name.trim(),
          amountCents: amount,
          estimatedAmountCents: amount === null ? null : undefined,
          categoryKey,
          frequency,
          dueDay: day,
          nextDueDate,
        },
        isDemo,
      );
      await softSuccessHaptic();
      await maybeAskNotificationPermission(
        'Quer que eu te lembre antes do vencimento?',
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nova conta', headerShown: true }} />
      <Screen>
        <Text variant="title">Conta recorrente</Text>
        <Spacer size="xs" />
        <Text variant="body" color="secondary">
          Planejamento — não registra pagamento automaticamente.
        </Text>
        <Spacer size="lg" />
        <Input label="Nome" value={name} onChangeText={setName} placeholder="Internet" />
        <Spacer size="md" />
        <Input
          label="Valor (deixe vazio se variável)"
          value={amountRaw}
          onChangeText={setAmountRaw}
          keyboardType="decimal-pad"
        />
        <Spacer size="md" />
        <Input
          label="Dia do vencimento"
          value={dueDay}
          onChangeText={setDueDay}
          keyboardType="number-pad"
        />
        <Spacer size="md" />
        <Text variant="caption" color="secondary">
          Frequência
        </Text>
        <Spacer size="xs" />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['monthly', 'Mensal'],
              ['weekly', 'Semanal'],
              ['yearly', 'Anual'],
            ] as const
          ).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              selected={frequency === key}
              onPress={() => setFrequency(key)}
            />
          ))}
        </View>
        <Spacer size="md" />
        <Text variant="caption" color="secondary">
          Categoria
        </Text>
        <Spacer size="xs" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {ONBOARDING_CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={categoryKey === cat.key}
              onPress={() => setCategoryKey(cat.key)}
            />
          ))}
        </View>
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
          label={saving ? 'Salvando…' : 'Salvar conta'}
          onPress={onSave}
          disabled={saving}
        />
        <Spacer size="sm" />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </>
  );
}
