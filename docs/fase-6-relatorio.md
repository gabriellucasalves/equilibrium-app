# Equilibrium — Relatório Fase 6

Controlinho contextual: orçamento + localização opcional + buscas externas com fonte.

## Providers

| Provider | Uso | Custo |
|----------|-----|--------|
| MockExternalProvider | DEMO | zero |
| Edge `external-search` + Nominatim | lugares (auth/online) | OSM fair-use |
| PRICE_SEARCH_API_KEY | promoções/preços (opcional) | pago se configurado |

Sem fonte → não inventa.

## Arquitetura

```
Intent (LOCAL_* / HYBRID / FINANCE)
  → resolveLocation (GPS once | manual | skip)
  → FinancialToolRegistry + ExternalInformationService
  → normalize + SourceBadge cards
  → AIProvider (EXTERNAL_DATA isolado)
```

## Localização

Perfil: automática / manual / não usar.  
Permissão só sob demanda. Fallback cidade+UF.

## Tools novas

Externas listadas em `EXTERNAL_TOOLS.md` + histórico/comparação de preço.

## Cache / rate limit / timeout

Documentados em `EXTERNAL_TOOLS.md`. Cache expirado não é apresentado como atual.

## Segurança

URL validation, sanitização, EXTERNAL_DATA, WebBrowser. Ver `EXTERNAL_DATA_SECURITY.md`.

## Testes

Intent híbrido, sanitização/injection, distância, TTL, histórico/preço, mock externo, offline.

## Limitações

- Nominatim: cobertura e rate limit variáveis
- Promoções reais dependem de API futura
- Sem mapa embutido (abre fonte/OSM externo)
- Sem afiliados/publicidade

## Riscos

Dados OSM desatualizados · promoção sem provider · abuso de rate Nominatim — mitigado por timeout, flags e respostas honestas.
