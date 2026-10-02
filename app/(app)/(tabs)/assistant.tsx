import { Screen, Spacer, Text } from '@/components/ui';
import { AssistantChat } from '@/features/assistant/components/AssistantChat';

export default function AssistantScreen() {
  return (
    <Screen scroll={false}>
      <Text variant="title">Controlinho</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        Pergunte sobre seu mês. Eu consulto seus números e explico com calma.
      </Text>
      <Spacer size="md" />
      <AssistantChat />
    </Screen>
  );
}
