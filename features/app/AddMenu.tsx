import { Modal, Pressable } from 'react-native';

import { Spacer, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onExpense: () => void;
  onIncome: () => void;
  onScan: () => void;
};

export function AddMenu({
  visible,
  onClose,
  onExpense,
  onIncome,
  onScan,
}: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
            gap: theme.spacing.sm,
          }}
        >
          <Text variant="title">Adicionar</Text>
          <Spacer size="xs" />
          <MenuItem label="Despesa" onPress={onExpense} />
          <MenuItem label="Receita" onPress={onIncome} />
          <MenuItem label="Escanear nota" onPress={onScan} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuItem({
  label,
  onPress,
  muted = false,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: theme.radii.lg,
        backgroundColor: muted
          ? theme.colors.surfaceMuted
          : theme.colors.accentSoft,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text variant="label" color={muted ? 'secondary' : 'accent'}>
        {label}
      </Text>
    </Pressable>
  );
}
