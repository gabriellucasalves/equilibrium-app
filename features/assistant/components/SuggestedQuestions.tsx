import { View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export const SUGGESTED_QUESTIONS = [
  'Quanto ainda posso gastar?',
  'Tenho R$ 100 para lazer. O que posso fazer no fim de semana?',
  'Tem alguma coisa gratuita perto de mim?',
  'Quanto normalmente pago por café?',
  'Onde eu poderia economizar?',
];

export function SuggestedQuestions({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View>
      <Text variant="caption" color="secondary" style={{ marginBottom: 8 }}>
        Perguntas rápidas
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <Chip
            key={q}
            label={q}
            selected={false}
            onPress={() => {
              if (!disabled) onPick(q);
            }}
          />
        ))}
      </View>
    </View>
  );
}
