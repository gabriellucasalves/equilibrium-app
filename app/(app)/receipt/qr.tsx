import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { ReceiptProcessingService } from '@/services/receipts/processing-service';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { useFinanceStore } from '@/store/finance-store';
import { useAuthStore } from '@/store/auth-store';
import { useReceiptDraftStore } from '@/store/receipt-draft-store';

export default function ReceiptQrScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const beginCapture = useReceiptDraftStore((s) => s.beginCapture);
  const setProcessed = useReceiptDraftStore((s) => s.setProcessed);
  const setStatus = useReceiptDraftStore((s) => s.setStatus);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);

  const onBarcode = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    beginCapture('qr');
    setStatus('processing');
    try {
      const demo = isDemoMode || authStatus === 'demo';
      const service = ReceiptProcessingService.createDefault();
      const processed = await service.process({
        source: demo ? 'demo' : 'qr',
        qrPayload: data,
        isDemo: demo,
      });
      setProcessed(processed);
      router.replace(routes.receiptReview);
    } catch (e) {
      setError(mapErrorToUserMessage(e));
      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <Screen>
        <Text variant="body">Verificando permissão da câmera…</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ title: 'QR Code', headerShown: true }} />
        <Screen>
          <Text variant="title">Câmera necessária</Text>
          <Spacer size="sm" />
          <Text variant="body" color="secondary">
            Sem permissão de câmera você ainda pode fotografar a nota ou escolher
            uma imagem.
          </Text>
          <Spacer size="xl" />
          <Button label="Permitir câmera" onPress={() => void requestPermission()} />
          <Spacer size="sm" />
          <Button
            label="Usar foto da nota"
            variant="secondary"
            onPress={() => router.replace(routes.receiptCapture)}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'QR Code', headerShown: true }} />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : onBarcode}
        />
        <View style={{ padding: theme.spacing.lg }}>
          <Text variant="body" color="secondary" align="center">
            Aponte para o QR Code da NFC-e
          </Text>
          {error ? (
            <>
              <Spacer size="sm" />
              <Text variant="caption" color="danger" align="center">
                {error}
              </Text>
            </>
          ) : null}
          <Spacer size="md" />
          <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </>
  );
}
