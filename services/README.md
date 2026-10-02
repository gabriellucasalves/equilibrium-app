# Services

Camada de serviços do Equilibrium.

| Serviço | Fase | Papel |
|---------|------|--------|
| `receipts/*` | 4 | OCR / NFC-e / mock / storage |
| `features/assistant/*` | 5 | Controlinho (orchestrator, tools, AI) |
| `InsightEngine` | 5 | Insights determinísticos |
| `AssistantOrchestrator` | 5 | Orquestra tools + AIProvider |
| `AIProvider` | 5 | Mock (DEMO) / Edge LLM |

Nenhuma API key de IA ou OCR deve residir no app cliente.
