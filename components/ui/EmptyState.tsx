import { View } from 'react-native';

import { Button, Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.surfaceMuted,
      }}
      accessibilityRole="summary"
    >
      <Text variant="label">{title}</Text>
      <Spacer size="xs" />
      <Text variant="body" color="secondary">
        {body}
      </Text>
      {actionLabel && onAction ? (
        <>
          <Spacer size="md" />
          <Button label={actionLabel} onPress={onAction} />
        </>
      ) : null}
    </View>
  );
}
