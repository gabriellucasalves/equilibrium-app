import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { routes } from '@/lib/routes';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { useReceiptDraftStore } from '@/store/receipt-draft-store';

export default function ReceiptCaptureScreen() {
  const beginCapture = useReceiptDraftStore((s) => s.beginCapture);
  const setError = useReceiptDraftStore((s) => s.setError);
  const errorMessage = useReceiptDraftStore((s) => s.errorMessage);

  const goProcess = (source: 'camera' | 'gallery' | 'pdf', uri: string) => {
    beginCapture(source, uri);
    router.push(routes.receiptProcessing);
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Permissão de câmera negada. Você pode escolher uma imagem da galeria.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: false,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        goProcess('camera', result.assets[0].uri);
      }
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permissão da galeria negada.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        goProcess('gallery', result.assets[0].uri);
      }
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        goProcess('pdf', result.assets[0].uri);
      }
    } catch (e) {
      setError(mapErrorToUserMessage(e));
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Escanear nota', headerShown: true }} />
      <Screen>
        <Text variant="title">Como você quer adicionar?</Text>
        <Spacer size="sm" />
        <Text variant="body" color="secondary">
          Nada é salvo como despesa até você confirmar a revisão.
        </Text>
        <Spacer size="xl" />
        {errorMessage ? (
          <>
            <Text variant="caption" color="danger">
              {errorMessage}
            </Text>
            <Spacer size="md" />
          </>
        ) : null}
        <Button label="Tirar foto" onPress={takePhoto} />
        <Spacer size="sm" />
        <Button label="Escolher imagem" variant="secondary" onPress={pickImage} />
        <Spacer size="sm" />
        <Button label="Escolher PDF" variant="secondary" onPress={pickPdf} />
        <Spacer size="sm" />
        <Button
          label="Ler QR Code"
          variant="secondary"
          onPress={() => router.push(routes.receiptQr)}
        />
        <View style={{ flex: 1, minHeight: 24 }} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </>
  );
}
