import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { Button, Spacer, Text } from '@/components/ui';
import { SourceBadge } from '@/features/assistant/components/external/SourceBadge';
import type { AssistantExternalCard } from '@/features/assistant/types';
import { isSafeHttpsUrl } from '@/features/external/security';
import { useTheme } from '@/lib/theme';
import { useSavedRecommendationsStore } from '@/store/saved-recommendations-store';

export function ExternalResultCard({ card }: { card: AssistantExternalCard }) {
  const theme = useTheme();
  const save = useSavedRecommendationsStore((s) => s.save);
  const saved = useSavedRecommendationsStore((s) =>
    s.items.some((i) => i.id === card.id),
  );

  const openSource = async () => {
    if (!isSafeHttpsUrl(card.sourceUrl)) return;
    await WebBrowser.openBrowserAsync(card.sourceUrl);
  };

  return (
    <View
      style={{
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text variant="label">{card.title}</Text>
      <Spacer size="xs" />
      <Text variant="caption" color="secondary">
        {[card.location, card.priceFormatted, card.distanceLabel]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {card.description ? (
        <>
          <Spacer size="xs" />
          <Text variant="caption">{card.description}</Text>
        </>
      ) : null}
      <SourceBadge
        sourceName={card.sourceName}
        retrievedAt={card.retrievedAt}
        stale={card.stale}
      />
      <Spacer size="sm" />
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Ver fonte" variant="secondary" onPress={openSource} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={saved ? 'Salvo' : 'Salvar'}
            variant="ghost"
            onPress={() => save(card)}
            disabled={saved}
          />
        </View>
      </View>
    </View>
  );
}
