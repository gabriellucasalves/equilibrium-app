import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';

import { Button, Input, Spacer, Text } from '@/components/ui';
import { ControlinhoAvatar } from '@/features/assistant/components/ControlinhoAvatar';
import { ExternalResultCard } from '@/features/assistant/components/external/ExternalResultCard';
import { InsightCards } from '@/features/assistant/components/InsightCards';
import { SuggestedQuestions } from '@/features/assistant/components/SuggestedQuestions';
import { LocationPermissionSheet } from '@/features/location/components/LocationPermissionSheet';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { AssistantExternalCard } from '@/features/assistant/types';
import { useTheme } from '@/lib/theme';
import { useAssistantStore } from '@/store/assistant-store';
import { useAuthStore } from '@/store/auth-store';
import { useFinanceStore } from '@/store/finance-store';
import { useLocationPreferencesStore } from '@/store/location-preferences-store';

export function AssistantChat() {
  const theme = useTheme();
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState('');
  const { isOnline } = useNetworkStatus();
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);
  const authStatus = useAuthStore((s) => s.status);
  const isDemo = isDemoMode || authStatus === 'demo';
  const setMode = useLocationPreferencesStore((s) => s.setMode);

  const messages = useAssistantStore((s) => s.messages);
  const mood = useAssistantStore((s) => s.mood);
  const busy = useAssistantStore((s) => s.busy);
  const error = useAssistantStore((s) => s.error);
  const insights = useAssistantStore((s) => s.insights);
  const sendMessage = useAssistantStore((s) => s.sendMessage);
  const refreshInsights = useAssistantStore((s) => s.refreshInsights);
  const loadRemoteHistory = useAssistantStore((s) => s.loadRemoteHistory);
  const clearConversation = useAssistantStore((s) => s.clearConversation);
  const needsLocationPermission = useAssistantStore(
    (s) => s.needsLocationPermission,
  );
  const needsManualLocation = useAssistantStore((s) => s.needsManualLocation);
  const pendingQuestion = useAssistantStore((s) => s.pendingQuestion);
  const dismissLocationPrompt = useAssistantStore((s) => s.dismissLocationPrompt);

  useEffect(() => {
    refreshInsights();
    void loadRemoteHistory(isDemo);
  }, [isDemo, loadRemoteHistory, refreshInsights]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );
  }, [messages.length, busy]);

  const onSend = (text: string, allowGpsOnce = false) => {
    setDraft('');
    void sendMessage(text, {
      isDemo,
      offline: !isOnline && !isDemo,
      allowGpsOnce,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
        <ControlinhoAvatar mood={busy ? 'thinking' : mood} />
      </View>

      {needsLocationPermission ? (
        <LocationPermissionSheet
          onAllowOnce={() => {
            if (pendingQuestion) onSend(pendingQuestion, true);
            dismissLocationPrompt();
          }}
          onAllowAlways={() => {
            setMode('automatic');
            if (pendingQuestion) onSend(pendingQuestion, true);
            dismissLocationPrompt();
          }}
          onNotNow={() => {
            setMode('manual');
            dismissLocationPrompt();
          }}
        />
      ) : null}

      {needsManualLocation ? (
        <View
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surfaceMuted,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text variant="caption" color="secondary">
            Informe cidade e UF em Perfil → Localização (ex.: Valparaíso de
            Goiás, GO) para continuar sem GPS.
          </Text>
        </View>
      ) : null}

      {messages.length === 0 ? (
        <>
          <InsightCards insights={insights} />
          <Spacer size="lg" />
          <SuggestedQuestions disabled={busy} onPick={onSend} />
        </>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: theme.spacing.md, gap: 10 }}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                backgroundColor:
                  item.role === 'user'
                    ? theme.colors.accentSoft
                    : theme.colors.surfaceMuted,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radii.lg,
              }}
            >
              <Text variant="body">{item.content}</Text>
              {item.externalCards?.map((card: AssistantExternalCard) => (
                <ExternalResultCard key={card.id} card={card} />
              ))}
            </View>
          )}
          ListFooterComponent={
            busy ? (
              <Text variant="caption" color="secondary">
                Estou olhando seus números…
              </Text>
            ) : null
          }
        />
      )}

      {error ? (
        <>
          <Spacer size="sm" />
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </>
      ) : null}

      <Spacer size="md" />
      <Input
        label="Pergunte ao Controlinho"
        value={draft}
        onChangeText={setDraft}
        placeholder="Ex.: O que posso fazer no fim de semana?"
        editable={!busy}
      />
      <Spacer size="sm" />
      <Button
        label={busy ? 'Pensando…' : 'Enviar'}
        onPress={() => onSend(draft)}
        disabled={busy || !draft.trim()}
      />
      {messages.length > 0 ? (
        <>
          <Spacer size="sm" />
          <Button
            label="Limpar conversa"
            variant="ghost"
            onPress={() => void clearConversation(isDemo)}
            disabled={busy}
          />
        </>
      ) : null}
    </View>
  );
}
