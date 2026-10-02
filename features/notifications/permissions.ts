import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function maybeAskNotificationPermission(
  contextualMessage: string,
): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (Platform.OS === 'web') {
    // Web: Notification API opcional
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    Alert.alert('Lembretes', contextualMessage, [
      { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
      {
        text: 'Permitir',
        onPress: () => {
          void Notifications.requestPermissionsAsync().then((res) =>
            resolve(Boolean(res.granted)),
          );
        },
      },
    ]);
  });
}
