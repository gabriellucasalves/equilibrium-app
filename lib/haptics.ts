import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
  reduceMotion = Boolean(v);
});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
  reduceMotion = Boolean(v);
});

/** Feedback suave — respeita Reduce Motion e ignora web. */
export async function softSuccessHaptic(): Promise<void> {
  if (Platform.OS === 'web' || reduceMotion) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function softTapHaptic(): Promise<void> {
  if (Platform.OS === 'web' || reduceMotion) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}
