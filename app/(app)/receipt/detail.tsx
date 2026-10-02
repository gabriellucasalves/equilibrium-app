import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { RECEIPT_CATEGORY_OPTIONS } from '@/constants/receipt-categories';
import { useTheme } from '@/lib/theme';
import { createSupabaseRepositories } from '@/repositories/factory';
import type { ConfirmedReceipt } from '@/services/receipts/types';
import { createReceiptSignedUrl } from '@/services/receipts/storage';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { formatISODateBR } from '@/utils/date';
import { formatCentsToBRL } from '@/utils/money';

export default function ReceiptDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ConfirmedReceipt | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const repos = createSupabaseRepositories();
        const data = await repos?.receipts.getById(id);
        setReceipt(data ?? null);
      } catch (e) {
        setError(mapErrorToUserMessage(e));
      }
    })();
  }, [id]);

  const openOriginal = async () => {
    if (!receipt?.filePath) return;
    setLoadingDoc(true);
    try {
      const url = await createReceiptSignedUrl(receipt.filePath, 120);
      await Linking.openURL(url);
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    } finally {
      setLoadingDoc(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nota fiscal', headerShown: true }} />
      <Screen>
        {!receipt ? (
          <Text variant="body" color="secondary">
            {error ?? 'Carregando nota…'}
          </Text>
        ) : (
          <>
            <Text variant="title">{receipt.merchantName || 'Nota fiscal'}</Text>
            <Spacer size="xs" />
            <Text variant="body" color="secondary">
              {receipt.purchaseDate
                ? formatISODateBR(receipt.purchaseDate)
                : 'Data não informada'}
            </Text>
            <Spacer size="md" />
            <Text variant="label">Total</Text>
            <Text variant="title">{formatCentsToBRL(receipt.totalAmountCents)}</Text>

            <Spacer size="xl" />
            <Text variant="label" color="secondary">
              {receipt.items.length} itens
            </Text>
            <Spacer size="sm" />
            {receipt.items.map((item) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: theme.spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Text variant="body">{item.normalizedDescription}</Text>
                <Text variant="caption">
                  {item.quantity}x · {formatCentsToBRL(item.totalPriceInCents)} ·{' '}
                  {RECEIPT_CATEGORY_OPTIONS.find((c) => c.key === item.categoryKey)
                    ?.label ?? item.categoryKey}
                </Text>
              </View>
            ))}

            {error ? (
              <>
                <Spacer size="md" />
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              </>
            ) : null}

            <Spacer size="xl" />
            {receipt.filePath ? (
              <Button
                label={loadingDoc ? 'Abrindo…' : 'Ver documento original'}
                onPress={openOriginal}
                disabled={loadingDoc}
              />
            ) : null}
            <Spacer size="sm" />
            <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
          </>
        )}
      </Screen>
    </>
  );
}
