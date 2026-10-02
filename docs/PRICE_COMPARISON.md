# Comparação de preços

## Histórico interno

`get_product_purchase_history` usa `receipt_items` (e descrições normalizadas).

Campos: `averagePrice`, `lastPrice`, `lowestPrice`, `highestPrice`, `purchaseCount`.

## Externo × histórico

`compare_external_price_to_history` (determinístico):

| Classificação | Critério |
|---------------|----------|
| `below_history` | ≥ 5% abaixo da média |
| `near_average` | entre −5% e +5% |
| `above_history` | ≥ 5% acima da média |

Tom: “Está cerca de 8% abaixo da sua média recente.” — sem “IMPERDÍVEL”.

## Promoções

Só com fonte real (`sourceName`, `sourceUrl`, `retrievedAt`).  
Sem dados: “Não encontrei promoções confiáveis para esse item agora.”
