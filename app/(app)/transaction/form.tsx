import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { Button, Chip, Input, Screen, Spacer, Text } from '@/components/ui';
import { categoriesForType } from '@/features/transactions/categories';
import { softSuccessHaptic } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { createSupabaseRepositories } from '@/repositories/factory';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useRecurringStore } from '@/store/recurring-store';
import type { TransactionType } from '@/types/finance';
import { toISODate } from '@/utils/date';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';
import { advanceAfterPayment } from '@/utils/recurring';

export default function TransactionFormScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    prefillNote?: string;
    prefillCategory?: string;
    prefillAmount?: string;
    recurringId?: string;
  }>();
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const recurringItems = useRecurringStore((s) => s.items);
  const updateRecurring = useRecurringStore((s) => s.updateItem);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';

  const existing = useMemo(
    () => (params.id ? transactions.find((t) => t.id === params.id) : undefined),
    [params.id, transactions],
  );

  const initialType: TransactionType =
    existing?.type ??
    (params.type === 'income' ? 'income' : 'expense');

  const [type, setType] = useState<TransactionType>(initialType);
  const categories = categoriesForType(type);
  const [categoryKey, setCategoryKey] = useState(
    existing?.categoryKey ??
      params.prefillCategory ??
      categories[0]?.key ??
      'groceries',
  );
  const [raw, setRaw] = useState(
    existing
      ? formatCentsToBRL(existing.amountCents).replace('R$\u00a0', '')
      : (params.prefillAmount ?? ''),
  );
  const [note, setNote] = useState(existing?.note ?? params.prefillNote ?? '');
  const [date, setDate] = useState(existing?.date ?? toISODate());
  const [error, setError] = useState<string | undefined>();

  const title = existing
    ? 'Editar movimentação'
    : params.recurringId
      ? 'Registrar pagamento'
      : type === 'income'
        ? 'Nova receita'
        : 'Nova despesa';

  const onSave = async () => {
    const cents = parseBRLToCents(raw);
    if (cents === null || cents <= 0) {
      setError('Informe um valor válido');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Data no formato AAAA-MM-DD');
      return;
    }

    const payload = {
      type,
      amountCents: cents,
      categoryKey,
      note: note.trim() || categories.find((c) => c.key === categoryKey)?.label || '',
      date,
    };

    try {
      if (existing) {
        await updateTransaction(existing.id, payload);
      } else {
        await addTransaction(payload);
        if (params.recurringId) {
          const item = recurringItems.find((r) => r.id === params.recurringId);
          if (item) {
            const next = advanceAfterPayment(item);
            await updateRecurring(
              item.id,
              { nextDueDate: next },
              isDemo,
            );
          }
        }
      }
      await softSuccessHaptic();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar agora.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title, headerShown: true }} />
      <Screen>
        {params.recurringId ? (
          <>
            <Text variant="caption" color="secondary">
              Conta recorrente — a movimentação só é criada depois que você
              confirmar.
            </Text>
            <Spacer size="md" />
          </>
        ) : null}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Chip
            label="Despesa"
            selected={type === 'expense'}
            onPress={() => {
              setType('expense');
              const next = categoriesForType('expense');
              if (!next.some((c) => c.key === categoryKey)) {
                setCategoryKey(next[0]?.key ?? 'groceries');
              }
            }}
          />
          <Chip
            label="Receita"
            selected={type === 'income'}
            onPress={() => {
              setType('income');
              const next = categoriesForType('income');
              if (!next.some((c) => c.key === categoryKey)) {
                setCategoryKey(next[0]?.key ?? 'salary');
              }
            }}
          />
        </View>

        <Spacer size="lg" />
        <Input
          label="Valor"
          keyboardType="decimal-pad"
          value={raw}
          onChangeText={(text) => {
            setRaw(text);
            if (error) setError(undefined);
          }}
          error={error}
          autoFocus={!existing}
        />
        <Spacer size="md" />
        <Input
          label="Descrição"
          value={note}
          onChangeText={setNote}
          placeholder="Ex.: Mercado da semana"
        />
        <Spacer size="md" />
        <Input
          label="Data (AAAA-MM-DD)"
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
        />

        <Spacer size="lg" />
        <Text variant="label" color="secondary">
          Categoria
        </Text>
        <Spacer size="sm" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {categories.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={categoryKey === cat.key}
              onPress={() => setCategoryKey(cat.key)}
            />
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 32 }} />
        {existing?.receiptId ? (
          <>
            <Button
              label="Ver nota fiscal"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(app)/receipt/detail',
                  params: { id: existing.receiptId! },
                })
              }
            />
            <Spacer size="sm" />
          </>
        ) : null}
        <Button label="Salvar" onPress={onSave} testID="tx-save" />
        <Spacer size="sm" />
        {existing ? (
          <Button
            label="Excluir"
            variant="ghost"
            onPress={() => {
              const runDelete = async (alsoReceipt: boolean) => {
                try {
                  if (alsoReceipt && existing.receiptId) {
                    await createSupabaseRepositories()?.receipts.delete(
                      existing.receiptId,
                      { deleteFile: true },
                    );
                  }
                  await deleteTransaction(existing.id);
                  router.back();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : 'Não foi possível excluir agora.',
                  );
                }
              };

              if (!existing.receiptId) {
                if (Platform.OS === 'web') {
                  if (!window.confirm('Excluir esta movimentação?')) return;
                }
                void runDelete(false);
                return;
              }

              const message =
                'Também deseja excluir a nota fiscal associada?';
              if (Platform.OS === 'web') {
                if (!window.confirm('Excluir esta movimentação?')) return;
                const also = window.confirm(
                  `${message}\nOK = Excluir nota · Cancelar = Manter nota`,
                );
                void runDelete(also);
                return;
              }

              Alert.alert('Excluir movimentação', message, [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Manter nota',
                  onPress: () => void runDelete(false),
                },
                {
                  text: 'Excluir nota',
                  style: 'destructive',
                  onPress: () => void runDelete(true),
                },
              ]);
            }}
            testID="tx-delete"
          />
        ) : (
          <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
        )}
      </Screen>
    </>
  );
}
