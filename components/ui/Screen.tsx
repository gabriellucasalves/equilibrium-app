import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CLOSED_TEST_BACKGROUND,
  CLOSED_TEST_MODE,
} from '@/features/closed-test/config';
import { useTheme } from '@/lib/theme';

export type ScreenProps = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  ...rest
}: ScreenProps) {
  const theme = useTheme();
  const backgroundColor = CLOSED_TEST_MODE
    ? CLOSED_TEST_BACKGROUND[theme.scheme]
    : theme.colors.background;
  const contentStyle = [
    styles.content,
    padded && {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    CLOSED_TEST_MODE && styles.closedColumn,
    style,
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[contentStyle, styles.grow]}
            keyboardShouldPersistTaps="handled"
            {...rest}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]} {...rest}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  grow: { flexGrow: 1 },
  closedColumn: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
