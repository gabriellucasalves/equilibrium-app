# Equilibrium

Controle financeiro pessoal inteligente.

> Entender seu dinheiro sem precisar entender de finanças.

**Fase 6:** Controlinho contextual (localização opcional + buscas externas com fonte) sobre as Fases 1–5.

## Stack

- TypeScript · React Native · Expo · Expo Router · React Native Web
- Zustand + AsyncStorage (cache / DEMO)
- Supabase (Auth, PostgreSQL, RLS, Storage, Edge Functions)

## Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com) (ou use o já provisionado).
2. Copie `.env.example` → `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. Aplique migrations:

```bash
npx supabase db push
# ou arquivos em supabase/migrations/
```

4. (Opcional) Secrets nas Edge Functions:

```bash
# Dashboard → Edge Functions → Secrets
OCR_SPACE_API_KEY=...          # parse-receipt
OPENAI_API_KEY=...             # controlinho-chat
```

Nunca coloque `service_role`, OCR ou OpenAI no app.

## Como rodar

```bash
npm install
npm run web        # navegador
npm start          # Expo (iOS/Android/Web)
```

### Qualidade

```bash
npm run lint
npm run typecheck
npm test
npx expo export --platform web
npm run test:rls:receipts   # requer .env + sessões válidas
```

## Fluxo

1. Criar conta / Entrar (ou Explorar DEMO)
2. Migração local→conta (se houver dados locais)
3. Onboarding (persistido via RPC)
4. Dashboard + movimentações + orçamentos
5. FAB → Escanear nota → review → confirmar despesa + itens
6. Controlinho → perguntas sobre o mês (tools + narração)

## Estrutura

```
app/(auth)         welcome, sign-in/up, forgot, migrate
app/(onboarding)   fluxo financeiro inicial
app/(app)          tabs + transação + receipt/*
features/assistant Controlinho (orchestrator, tools, UI)
services/receipts  processing, providers, category engine
repositories/      interfaces + Supabase
supabase/functions parse-receipt, controlinho-chat
supabase/migrations
```

## Documentação

- [Architecture](./docs/ARCHITECTURE.md)
- [Database](./docs/DATABASE.md)
- [Privacy & Security](./docs/PRIVACY_AND_SECURITY.md)
- [AI Assistant](./docs/AI_ASSISTANT.md)
- [Fase 6 — relatório](./docs/fase-6-relatorio.md)
- [External Tools](./docs/EXTERNAL_TOOLS.md)
- [Location Privacy](./docs/LOCATION_PRIVACY.md)
- [Design System](./docs/DESIGN_SYSTEM.md)
- [Roadmap](./docs/ROADMAP.md)

## Licença

Ver `LICENSE`.
