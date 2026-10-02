import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { Button, Chip, Input, Screen, Spacer, Text } from '@/components/ui';
import { RECEIPT_CATEGORY_OPTIONS } from '@/constants/receipt-categories';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { createSupabaseRepositories } from '@/repositories/factory';
import {
  preferenceKey,
  sumItemsCents,
  totalDifferenceCents,
} from '@/services/receipts/normalization';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useReceiptDraftStore } from '@/store/receipt-draft-store';
import { formatCentsToBRL, parseBRLToCents } from '@/utils/money';

export default function ReceiptReviewScreen() {
  const theme = useTheme();
  const draft = useReceiptDraftStore((s) => s.draft);
  const items = useReceiptDraftStore((s) => s.items);
  const duplicateReceiptId = useReceiptDraftStore((s) => s.duplicateReceiptId);
  const updateMerchant = useReceiptDraftStore((s) => s.updateMerchant);
  const updateDate = useReceiptDraftStore((s) => s.updateDate);
  const updateTotal = useReceiptDraftStore((s) => s.updateTotal);
  const updateItem = useReceiptDraftStore((s) => s.updateItem);
  const reset = useReceiptDraftStore((s) => s.reset);

  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const hydrateFromRemote = useFinanceStore((s) => s.hydrateFromRemote);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [totalRaw, setTotalRaw] = useState(
    draft ? formatCentsToBRL(draft.totalInCents).replace('R$\u00a0', '') : '',
  );

  const itemsSum = useMemo(() => sumItemsCents(items), [items]);
  const diff = draft
    ? totalDifferenceCents(itemsSum, draft.totalInCents)
    : 0;

  if (!draft) {
    return (
      <Screen>
        <Text variant="body">Nenhuma nota para revisar.</Text>
        <Spacer size="md" />
        <Button label="Voltar" onPress={() => router.replace(routes.receiptCapture)} />
      </Screen>
    );
  }

  const onConfirm = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const demo = isDemoMode || authStatus === 'demo';
      const dominantCategory =
        modeCategory(items.map((i) => i.categoryKey)) ?? 'groceries';

      if (demo) {
        await addTransaction({
          type: 'expense',
          amountCents: draft.totalInCents,
          categoryKey: dominantCategory,
          note: draft.merchantName || 'Nota fiscal',
          date: draft.purchaseDate || new Date().toISOString().slice(0, 10),
        });
      } else {
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const prefs = items.map((item) => ({
          normalizedKey: preferenceKey(item.normalizedDescription),
          categoryKey: item.categoryKey,
        }));
        await repos.receipts.confirm({
          receipt: { ...draft, items },
          items,
          categoryKey: dominantCategory,
          preferences: prefs,
        });
        await hydrateFromRemote();
      }

      reset();
      router.replace(routes.appTabs);
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Revisar nota', headerShown: true }} />
      <Screen>
        <Text variant="title">Revisar nota</Text>
        <Spacer size="xs" />
        <Text variant="body" color="secondary">
          Confira os dados antes de gerar a despesa.
        </Text>

        {duplicateReceiptId ? (
          <>
            <Spacer size="md" />
            <Text variant="caption" color="danger">
              Esta nota parece já ter sido adicionada.
            </Text>
            <Spacer size="xs" />
            <Button
              label="Ver nota existente"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(app)/receipt/detail',
                  params: { id: duplicateReceiptId },
                })
              }
            />
          </>
        ) : null}

        {draft.warning ? (
          <>
            <Spacer size="md" />
            <Text variant="caption" color="danger">
              {draft.warning}
            </Text>
          </>
        ) : null}

        {draft.openExternalUrl ? (
          <>
            <Spacer size="sm" />
            <Button
              label="Abrir consulta NFC-e"
              variant="ghost"
              onPress={() => void Linking.openURL(draft.openExternalUrl!)}
            />
          </>
        ) : null}

        <Spacer size="lg" />
        <Input
          label="Estabelecimento"
          value={draft.merchantName}
          onChangeText={updateMerchant}
        />
        <Spacer size="md" />
        <Input
          label="Data (AAAA-MM-DD)"
          value={draft.purchaseDate ?? ''}
          onChangeText={updateDate}
        />
        <Spacer size="md" />
        <Input
          label="Total da nota"
          value={totalRaw}
          keyboardType="decimal-pad"
          onChangeText={(text) => {
            setTotalRaw(text);
            const cents = parseBRLToCents(text);
            if (cents !== null) updateTotal(cents);
          }}
        />

        <Spacer size="lg" />
        <Text variant="label" color="secondary">
          {items.length} itens encontrados
        </Text>
        <Spacer size="xs" />
        <Text variant="caption">
          Soma dos itens: {formatCentsToBRL(itemsSum)}
        </Text>
        {diff !== 0 ? (
          <Text variant="caption" color="danger">
            Os itens somam {formatCentsToBRL(itemsSum)}, mas a nota informa{' '}
            {formatCentsToBRL(draft.totalInCents)}. Diferença:{' '}
            {formatCentsToBRL(Math.abs(diff))}
          </Text>
        ) : null}

        <Spacer size="md" />
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            {item.uncertain ? (
              <Text variant="caption" color="danger">
                Não tenho certeza deste item.
              </Text>
            ) : null}
            <Input
              label="Descrição"
              value={item.normalizedDescription}
              onChangeText={(text) =>
                updateItem(item.id, { normalizedDescription: text })
              }
            />
            <Spacer size="xs" />
            <Input
              label="Quantidade"
              value={String(item.quantity)}
              keyboardType="decimal-pad"
              onChangeText={(text) => {
                const qty = Number(text.replace(',', '.'));
                if (!Number.isFinite(qty) || qty <= 0) return;
                const unit =
                  item.unitPriceInCents ??
                  Math.round(item.totalPriceInCents / Math.max(qty, 0.001));
                updateItem(item.id, {
                  quantity: qty,
                  unitPriceInCents: unit,
                  totalPriceInCents: Math.round(unit * qty),
                });
              }}
            />
            <Spacer size="xs" />
            <Input
              label="Preço total do item"
              value={formatCentsToBRL(item.totalPriceInCents).replace(
                'R$\u00a0',
                '',
              )}
              keyboardType="decimal-pad"
              onChangeText={(text) => {
                const cents = parseBRLToCents(text);
                if (cents === null) return;
                updateItem(item.id, {
                  totalPriceInCents: cents,
                  unitPriceInCents: Math.round(
                    cents / Math.max(item.quantity, 0.001),
                  ),
                });
              }}
            />
            <Spacer size="xs" />
            <Text variant="caption" color="secondary">
              Original: {item.rawDescription}
            </Text>
            <Spacer size="sm" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RECEIPT_CATEGORY_OPTIONS.map((cat) => (
                <Chip
                  key={cat.key}
                  label={cat.label}
                  selected={item.categoryKey === cat.key}
                  onPress={() =>
                    updateItem(item.id, {
                      categoryKey: cat.key,
                      uncertain: false,
                      confidence: 0.99,
                    })
                  }
                />
              ))}
            </View>
          </View>
        ))}

        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}

        <Spacer size="lg" />
        <Button
          label={saving ? 'Confirmando…' : 'Confirmar compra'}
          onPress={onConfirm}
          disabled={saving}
        />
        <Spacer size="sm" />
        <Button
          label="Adicionar mesmo assim"
          variant="secondary"
          onPress={onConfirm}
          disabled={saving || !duplicateReceiptId}
        />
        <Spacer size="sm" />
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={() => {
            reset();
            router.replace(routes.appTabs);
          }}
        />
      </Screen>
    </>
  );
}

function modeCategory(keys: string[]): string | null {
  if (keys.length === 0) return null;
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
