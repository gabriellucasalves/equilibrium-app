import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text, Spacer } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado', headerShown: true }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="title">Essa tela não existe</Text>
        <Spacer size="md" />
        <Link href="/">
          <Text variant="body" color="accent">
            Voltar ao início
          </Text>
        </Link>
      </View>
    </>
  );
}
