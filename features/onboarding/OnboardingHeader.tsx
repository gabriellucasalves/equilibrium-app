import { View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

type Props = {
  progress: number;
  showBrand?: boolean;
};

export function OnboardingHeader({ progress, showBrand = true }: Props) {
  const theme = useTheme();

  return (
    <View style={{ marginBottom: theme.spacing.xl }}>
      {showBrand ? (
        <Text
          variant="label"
          color="accent"
          style={{
            marginBottom: theme.spacing.md,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Equilibrium
        </Text>
      ) : null}
      <ProgressBar progress={progress} />
    </View>
  );
}
