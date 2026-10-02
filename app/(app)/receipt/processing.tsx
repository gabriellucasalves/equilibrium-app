import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { createSupabaseRepositories } from '@/repositories/factory';
import { findDuplicateReceipt } from '@/services/receipts/duplicate';
import { ReceiptProcessingService } from '@/services/receipts/processing-service';
import {
  assertReceiptFileSize,
  hashFileBase64,
  uploadReceiptFile,
} from '@/services/receipts/storage';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useReceiptDraftStore } from '@/store/receipt-draft-store';

export default function ReceiptProcessingScreen() {
  const started = useRef(false);
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const localUri = useReceiptDraftStore((s) => s.localUri);
  const source = useReceiptDraftStore((s) => s.source);
  const status = useReceiptDraftStore((s) => s.status);
  const errorMessage = useReceiptDraftStore((s) => s.errorMessage);
  const draft = useReceiptDraftStore((s) => s.draft);
  const setStatus = useReceiptDraftStore((s) => s.setStatus);
  const setProcessed = useReceiptDraftStore((s) => s.setProcessed);
  const setError = useReceiptDraftStore((s) => s.setError);
  const setDuplicateReceiptId = useReceiptDraftStore(
    (s) => s.setDuplicateReceiptId,
  );

  const run = async () => {
    try {
      setStatus('processing');
      const demo = isDemoMode || authStatus === 'demo';
      let base64: string | undefined;
      let mimeType = 'image/jpeg';
      let filePath: string | null = null;
      let fileHash: string | null = null;

      if (localUri && source !== 'qr') {
        if (source === 'pdf') {
          base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          mimeType = 'application/pdf';
        } else {
          const manipulated = await ImageManipulator.manipulateAsync(
            localUri,
            [{ resize: { width: 1600 } }],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            },
          );
          base64 = manipulated.base64 ?? undefined;
          mimeType = 'image/jpeg';
        }

        if (base64) {
          assertReceiptFileSize(base64);
          fileHash = await hashFileBase64(base64);
        }

        if (!demo && user?.id && base64) {
          setStatus('uploading');
          const id =
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-0000-4000-8000-000000000001`;
          const uploaded = await uploadReceiptFile({
            userId: user.id,
            receiptId: id,
            base64,
            mimeType,
          });
          filePath = uploaded.path;
          fileHash = uploaded.hash;
          setStatus('processing');
        }
      }

      const service = ReceiptProcessingService.createDefault();
      const processed = await service.process({
        source: demo ? 'demo' : source ?? 'camera',
        uri: localUri ?? undefined,
        base64,
        mimeType,
        isDemo: demo,
        filePath,
        fileHash,
      });

      if (!demo) {
        const repos = createSupabaseRepositories();
        const existing = (await repos?.receipts.list()) ?? [];
        const dup = findDuplicateReceipt(processed, existing);
        if (dup) setDuplicateReceiptId(dup.receipt.id);
      }

      setProcessed(processed);
      router.replace(routes.receiptReview);
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Lendo nota', headerShown: true }} />
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="title" align="center">
            {status === 'failed'
              ? 'Não consegui ler essa nota'
              : status === 'uploading'
                ? 'Enviando sua nota…'
                : 'Estou lendo sua nota…'}
          </Text>
          <Spacer size="sm" />
          <Text variant="body" color="secondary" align="center">
            {errorMessage ??
              (draft
                ? `Encontrei ${draft.items.length} itens.`
                : 'Isso pode levar alguns segundos.')}
          </Text>
          {status === 'failed' ? (
            <>
              <Spacer size="xl" />
              <Button label="Tentar novamente" onPress={() => void run()} />
              <Spacer size="sm" />
              <Button
                label="Preencher manualmente"
                variant="secondary"
                onPress={() =>
                  router.replace({
                    pathname: '/(app)/transaction/form',
                    params: { type: 'expense' },
                  })
                }
              />
              <Spacer size="sm" />
              <Button
                label="Voltar"
                variant="ghost"
                onPress={() => router.replace(routes.receiptCapture)}
              />
            </>
          ) : null}
        </View>
      </Screen>
    </>
  );
}
