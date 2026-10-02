# External Tools — Equilibrium

Camada `ExternalInformationService` → Providers → normalização com fonte → tools do Controlinho.

## Tools

| Tool | Entrada | Saída |
|------|---------|--------|
| `search_free_activities` | location, maxPrice=0 | atividades/lugares grátis + fonte |
| `search_local_activities` | location, maxPrice? | atividades/eventos |
| `search_local_places` | location, category | park, museum, library… |
| `search_local_events` | location | eventos |
| `search_promotions` | location, query | promoções **só com fonte real** |
| `search_product_prices` | location, query | preços externos |
| `search_public_services` | location | serviços públicos |
| `get_product_purchase_history` | keyword | média/último/min/max (interno) |
| `compare_external_price_to_history` | prices | classificação determinística |

## Providers

- **MockExternalProvider** — DEMO (sem rede)
- **EdgeExternalProvider** → Edge `external-search`
  - Lugares: Nominatim (OpenStreetMap) quando habilitado
  - Promoções/preços: exige `PRICE_SEARCH_API_KEY`; sem chave → resposta honesta vazia

## Cache TTL

| Tipo | TTL |
|------|-----|
| lugares | 24h |
| eventos/atividades | 6h |
| serviços públicos | 12h |
| preços | 1h |
| promoções | 30min |

## Limites

Máx. 5 tool calls/turno · timeout 8s · rate limit 8 buscas/min (cliente).

## Flags

`EXTERNAL_SEARCH_ENABLED` · `LOCATION_FEATURES_ENABLED` · `PROMOTIONS_ENABLED`
