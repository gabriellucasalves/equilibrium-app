import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { useFinanceStore } from '@/store/finance-store';
import { useGoalsStore } from '@/store/goals-store';
import { useRecurringStore } from '@/store/recurring-store';
import {
  budgetsToCsv,
  buildExportPayload,
  exportToJson,
  goalsToCsv,
  recurringToCsv,
  transactionsToCsv,
} from '@/utils/export-data';

async function shareText(filename: string, content: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new Error('Armazenamento indisponível');
  const path = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: filename.endsWith('.json')
        ? 'application/json'
        : 'text/csv',
      dialogTitle: 'Exportar meus dados',
    });
  }
}

export default function ExportScreen() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useGoalsStore((s) => s.goals);
  const recurring = useRecurringStore((s) => s.items);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const run = async (kind: 'json' | 'csv') => {
    setBusy(true);
    setError(undefined);
    try {
      if (kind === 'json') {
        const payload = buildExportPayload({
          transactions,
          budgets,
          goals,
          recurring,
        });
        await shareText('equilibrium-export.json', exportToJson(payload));
      } else {
        const pack = [
          '# transactions',
          transactionsToCsv(transactions),
          '',
          '# budgets',
          budgetsToCsv(budgets),
          '',
          '# goals',
          goalsToCsv(goals),
          '',
          '# recurring',
          recurringToCsv(recurring),
        ].join('\n');
        await shareText('equilibrium-export.csv', pack);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível exportar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Exportar dados', headerShown: true }} />
      <Screen>
        <Text variant="body" color="secondary">
          Exporte transações, orçamentos, metas e recorrências. Formato básico
          para portabilidade — não substitui um relatório jurídico LGPD
          completo.
        </Text>
        <Spacer size="xl" />
        <Button
          label={busy ? 'Preparando…' : 'Exportar JSON'}
          onPress={() => void run('json')}
          disabled={busy}
        />
        <Spacer size="sm" />
        <Button
          label="Exportar CSV"
          variant="secondary"
          onPress={() => void run('csv')}
          disabled={busy}
        />
        {error ? (
          <>
            <Spacer size="md" />
            <Text variant="caption" color="danger">
              {error}
            </Text>
          </>
        ) : null}
      </Screen>
    </>
  );
}
