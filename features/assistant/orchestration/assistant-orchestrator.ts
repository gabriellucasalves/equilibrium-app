import { FEATURE_FLAGS } from '@/constants/feature-flags';
import { routeIntent } from '@/features/assistant/orchestration/intent-router';
import { createAIProvider } from '@/features/assistant/providers/edge-ai-provider';
import type { AIProvider } from '@/features/assistant/providers/types';
import { AssistantContextService } from '@/features/assistant/services/assistant-context-service';
import {
  isExternalTool,
  runExternalTool,
} from '@/features/assistant/tools/external/search-tools';
import { compareExternalPriceToHistory } from '@/features/assistant/tools/product-history';
import { FinancialToolRegistry } from '@/features/assistant/tools/registry';
import type {
  AssistantExternalCard,
  AssistantTurnResult,
  ControlinhoMood,
  ToolResult,
} from '@/features/assistant/types';
import { ExternalInformationService } from '@/features/external/service';
import { resolveLocationContext } from '@/features/location/resolve-location';
import { useLocationPreferencesStore } from '@/store/location-preferences-store';

export class AssistantOrchestrator {
  constructor(
    private readonly context = new AssistantContextService(),
    private readonly tools = new FinancialToolRegistry(),
    private readonly ai?: AIProvider,
    private readonly external?: ExternalInformationService,
  ) {}

  static createDefault(isDemo: boolean): AssistantOrchestrator {
    return new AssistantOrchestrator(
      new AssistantContextService(),
      new FinancialToolRegistry(),
      createAIProvider({ isDemo }),
      ExternalInformationService.createDefault(isDemo),
    );
  }

  async ask(
    question: string,
    options: {
      isDemo: boolean;
      offline?: boolean;
      /** Após o usuário permitir GPS nesta sessão. */
      allowGpsOnce?: boolean;
    },
  ): Promise<AssistantTurnResult> {
    const trimmed = question.trim();
    if (!trimmed) {
      return {
        answer:
          'Pode me perguntar algo sobre o seu mês — ou ideias de lazer na sua região.',
        toolResults: [],
        mood: 'idle',
        usedProvider: 'none',
      };
    }

    const intent = routeIntent(trimmed);
    const needsItems = intent.toolCalls.some(
      (c) =>
        c.name === 'get_keyword_spend' ||
        c.name === 'get_product_purchase_history',
    );

    let locationStatus = null as Awaited<
      ReturnType<typeof resolveLocationContext>
    > | null;

    if (intent.needsLocation && FEATURE_FLAGS.LOCATION_FEATURES_ENABLED) {
      locationStatus = await resolveLocationContext({
        requestPermission: Boolean(options.allowGpsOnce),
      });
      if (locationStatus.status === 'needs_permission' && !options.allowGpsOnce) {
        return {
          answer:
            'Para encontrar opções perto de você, o Equilibrium pode usar sua localização.',
          toolResults: [],
          mood: 'idle',
          usedProvider: 'none',
          needsLocationPermission: true,
        };
      }
      if (
        locationStatus.status === 'needs_manual' ||
        locationStatus.status === 'disabled'
      ) {
        const prefs = useLocationPreferencesStore.getState();
        if (!prefs.manualCity) {
          return {
            answer:
              'Sem GPS, você pode informar cidade e estado (ex.: Valparaíso de Goiás, GO) em Perfil → Localização. Assim eu continuo a busca.',
            toolResults: [],
            mood: 'idle',
            usedProvider: 'none',
            needsManualLocation: true,
          };
        }
        locationStatus = await resolveLocationContext();
      }
    }

    const receiptItems = await this.context.loadReceiptItemsIfNeeded(needsItems);
    const locationContext =
      locationStatus?.status === 'ready' ? locationStatus.context : null;

    const snapshot = this.context.buildSnapshot({
      receiptItems,
      locationContext,
    });
    const leisureRemaining = this.context.leisureRemainingCents(snapshot);

    const toolResults: ToolResult[] = [];
    const externalService =
      this.external ?? ExternalInformationService.createDefault(options.isDemo);
    const interests = useLocationPreferencesStore.getState().interests;

    for (const call of intent.toolCalls) {
      if (isExternalTool(call.name)) {
        if (!locationContext) {
          toolResults.push({
            toolName: call.name,
            ok: false,
            data: {},
            summary: 'Localização ainda não disponível para esta busca.',
          });
          continue;
        }
        const ext = await runExternalTool({
          toolName: call.name,
          service: externalService,
          location: locationContext,
          args: call.args,
          interests,
          offline: options.offline,
          isDemo: options.isDemo,
          leisureRemainingCents: leisureRemaining,
        });
        toolResults.push(ext);

        // Comparação determinística com histórico, se ambos existirem
        const history = toolResults.find(
          (t) => t.toolName === 'get_product_purchase_history' && t.ok,
        );
        const firstPrice = (
          ext.data.results as { priceInCents?: number | null }[] | undefined
        )?.[0]?.priceInCents;
        if (
          history &&
          firstPrice != null &&
          Number(history.data.averagePrice) > 0
        ) {
          const cmp = compareExternalPriceToHistory({
            externalPriceInCents: firstPrice,
            averagePriceInCents: Number(history.data.averagePrice),
            lowestPriceInCents: Number(history.data.lowestPrice),
          });
          toolResults.push({
            toolName: 'compare_external_price_to_history',
            ok: true,
            data: { ...cmp, externalPriceInCents: firstPrice },
            summary: cmp.summary,
          });
        }
        continue;
      }

      toolResults.push(this.tools.run(call.name, snapshot, call.args));
    }

    const externalCards = collectExternalCards(toolResults);
    const provider = this.ai ?? createAIProvider({ isDemo: options.isDemo });

    const answer = await provider.complete({
      question: trimmed,
      displayName: snapshot.displayName,
      monthKey: snapshot.monthKey,
      toolResults: toolResults.map((t) => ({
        ...t,
        // Garante isolamento: bloco EXTERNAL_DATA já sanitizado nas tools
        data: {
          ...t.data,
          // não enviar coords ao LLM
          coordinates: undefined,
        },
      })),
    });

    const financeOk = toolResults.some(
      (t) => t.toolName.startsWith('get_') && t.ok,
    );
    const externalFailed = toolResults.some(
      (t) => isExternalTool(t.toolName) && !t.ok,
    );

    let finalAnswer = answer;
    if (financeOk && externalFailed) {
      finalAnswer = `${answer}\n\nConsegui analisar seu orçamento, mas não consegui consultar todas as opções locais agora.`;
    }
    if (leisureRemaining != null && externalCards.length > 0) {
      // tom prudente — sem “pode gastar sem problema”
      if (!finalAnswer.includes('reservad')) {
        finalAnswer = `${finalAnswer}`;
      }
    }

    return {
      answer: finalAnswer,
      toolResults,
      mood: moodFromTools(toolResults),
      usedProvider: provider.name,
      externalCards,
    };
  }
}

function collectExternalCards(results: ToolResult[]): AssistantExternalCard[] {
  const cards: AssistantExternalCard[] = [];
  for (const r of results) {
    if (!isExternalTool(r.toolName)) continue;
    const list = r.data.results as AssistantExternalCard[] | undefined;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      cards.push(item);
    }
  }
  return cards.slice(0, 6);
}

function moodFromTools(results: ToolResult[]): ControlinhoMood {
  const budget = results.find((r) => r.toolName === 'get_budget_status');
  if (budget && Number(budget.data.alertCount ?? 0) > 0) return 'alert';
  const compare = results.find((r) => r.toolName === 'compare_months');
  if (compare && compare.data.direction === 'down') return 'happy';
  if (results.some((r) => isExternalTool(r.toolName) && r.ok)) return 'speaking';
  return 'speaking';
}
