# Release readiness — Equilibrium

Checklist pré-produção (Fase 7).

## Ambiente

- [ ] `EXPO_PUBLIC_SUPABASE_URL` / anon key de **produção**
- [ ] Supabase project production (Auth, RLS, Storage)
- [ ] Edge secrets: OCR, OpenAI (opcional), external-search
- [ ] Rate limits / CORS das Edge Functions revisados

## App

- [x] App icon path (`assets/images/icon.png`)
- [x] Splash (`expo-splash-screen`, fundo `#FAFBF9`)
- [x] Textos de permissão Camera / Photos / Location / Notifications
- [ ] Builds EAS Android / iOS
- [ ] Web production (Vercel) smoke test

## Segurança / privacidade

- [x] RLS em goals / recurring (migration Fase 7)
- [ ] Storage policies revalidadas em produção
- [ ] Exportação básica (JSON/CSV) — **não** é dump jurídico LGPD completo
- [ ] Exclusão de conta: **não implementada** nesta fase (exige Edge + service role + reauth). Documentado de propósito — evitar exclusão parcial.

## Observabilidade

- Preferir crash reporting técnico (Sentry etc.) sem tracking comportamental invasivo — ainda não embutido.

## Qualidade local

```bash
npm test
npm run typecheck
npm run lint
npx expo export --platform web
```
