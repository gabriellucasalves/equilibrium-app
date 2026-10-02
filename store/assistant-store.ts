import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AssistantOrchestrator } from '@/features/assistant/orchestration/assistant-orchestrator';
import { SupabaseAssistantConversationRepository } from '@/features/assistant/repositories/conversation-repository';
import type { DeterministicInsight } from '@/features/assistant/services/insight-engine';
import { InsightEngine } from '@/features/assistant/services/insight-engine';
import { AssistantContextService } from '@/features/assistant/services/assistant-context-service';
import type {
  AssistantMessage,
  ControlinhoMood,
} from '@/features/assistant/types';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import { createId } from '@/utils/id';

type AssistantState = {
  conversationId: string | null;
  messages: AssistantMessage[];
  mood: ControlinhoMood;
  busy: boolean;
  error: string | null;
  insights: DeterministicInsight[];
  pendingQuestion: string | null;
  needsLocationPermission: boolean;
  needsManualLocation: boolean;
  refreshInsights: () => void;
  loadRemoteHistory: (isDemo: boolean) => Promise<void>;
  sendMessage: (
    text: string,
    options: { isDemo: boolean; offline?: boolean; allowGpsOnce?: boolean },
  ) => Promise<void>;
  clearConversation: (isDemo: boolean) => Promise<void>;
  dismissLocationPrompt: () => void;
};

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      conversationId: null,
      messages: [],
      mood: 'idle',
      busy: false,
      error: null,
      insights: [],
      pendingQuestion: null,
      needsLocationPermission: false,
      needsManualLocation: false,

      refreshInsights: () => {
        const snapshot = new AssistantContextService().buildSnapshot();
        set({ insights: new InsightEngine().generate(snapshot) });
      },

      loadRemoteHistory: async (isDemo) => {
        if (isDemo) return;
        try {
          const repo = new SupabaseAssistantConversationRepository();
          const active = await repo.getActive();
          if (active) {
            set({
              conversationId: active.id,
              messages: active.messages,
            });
          }
        } catch {
          // histórico opcional
        }
      },

      dismissLocationPrompt: () =>
        set({
          needsLocationPermission: false,
          needsManualLocation: false,
          pendingQuestion: null,
        }),

      sendMessage: async (text, { isDemo, offline, allowGpsOnce }) => {
        const content = text.trim();
        if (!content || get().busy) return;

        const userMsg: AssistantMessage = {
          id: createId('am'),
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          messages: [...s.messages, userMsg],
          busy: true,
          mood: 'thinking',
          error: null,
          needsLocationPermission: false,
          needsManualLocation: false,
        }));

        try {
          if (!isDemo) {
            const repo = new SupabaseAssistantConversationRepository();
            const saved = await repo.appendMessage({
              conversationId: get().conversationId,
              message: userMsg,
            });
            set({ conversationId: saved.conversationId });
          }

          const orchestrator = AssistantOrchestrator.createDefault(isDemo);
          const result = await orchestrator.ask(content, {
            isDemo,
            offline,
            allowGpsOnce,
          });

          if (result.needsLocationPermission || result.needsManualLocation) {
            set((s) => ({
              messages: [
                ...s.messages,
                {
                  id: createId('am'),
                  role: 'assistant',
                  content: result.answer,
                  createdAt: new Date().toISOString(),
                },
              ],
              busy: false,
              mood: 'idle',
              pendingQuestion: content,
              needsLocationPermission: Boolean(result.needsLocationPermission),
              needsManualLocation: Boolean(result.needsManualLocation),
            }));
            return;
          }

          const assistantMsg: AssistantMessage = {
            id: createId('am'),
            role: 'assistant',
            content: result.answer,
            createdAt: new Date().toISOString(),
            toolNames: result.toolResults.map((t) => t.toolName),
            externalCards: result.externalCards,
          };

          set((s) => ({
            messages: [...s.messages, assistantMsg],
            mood: result.mood,
            busy: false,
            pendingQuestion: null,
          }));

          if (!isDemo) {
            const repo = new SupabaseAssistantConversationRepository();
            await repo.appendMessage({
              conversationId: get().conversationId,
              message: {
                role: assistantMsg.role,
                content: assistantMsg.content,
                toolNames: assistantMsg.toolNames,
              },
            });
          }

          get().refreshInsights();
        } catch (e) {
          set({
            busy: false,
            mood: 'alert',
            error: mapErrorToUserMessage(e),
          });
        }
      },

      clearConversation: async (isDemo) => {
        set({
          conversationId: null,
          messages: [],
          mood: 'idle',
          error: null,
          pendingQuestion: null,
          needsLocationPermission: false,
          needsManualLocation: false,
        });
        if (!isDemo) {
          try {
            await new SupabaseAssistantConversationRepository().clearAll();
          } catch {
            // ignore
          }
        }
      },
    }),
    {
      name: 'equilibrium-assistant-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        conversationId: s.conversationId,
        messages: s.messages.slice(-40),
      }),
    },
  ),
);
