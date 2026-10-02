import { View } from 'react-native';

import { spacing } from '@/constants/tokens';

type Size = keyof typeof spacing;

export function Spacer({ size = 'md' }: { size?: Size }) {
  return <View style={{ height: spacing[size] }} />;
}
