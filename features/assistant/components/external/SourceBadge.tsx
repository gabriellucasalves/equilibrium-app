import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatISODateBR } from '@/utils/date';

export function SourceBadge({
  sourceName,
  retrievedAt,
  stale,
}: {
  sourceName: string;
  retrievedAt: string;
  stale?: boolean;
}) {
  const theme = useTheme();
  const day = retrievedAt.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const when =
    day === today ? 'Consultado hoje' : `Consultado em ${formatISODateBR(day)}`;

  return (
    <Text
      variant="caption"
      color="secondary"
      style={{ marginTop: theme.spacing.xs }}
    >
      Fonte: {sourceName} · {when}
      {stale ? ' · Vale confirmar — pode estar desatualizado.' : ''}
    </Text>
  );
}
