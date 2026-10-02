import { ReceiptCategoryEngine } from '@/services/receipts/category-engine';
import { preferenceKey } from '@/services/receipts/normalization';

describe('ReceiptCategoryEngine', () => {
  it('classifica alimentos, higiene, limpeza e pets', () => {
    const engine = new ReceiptCategoryEngine();
    expect(engine.suggest('Arroz 5kg').categoryKey).toBe('groceries');
    expect(engine.suggest('Sabonete Neutro').categoryKey).toBe('hygiene');
    expect(engine.suggest('Detergente Liq').categoryKey).toBe('cleaning');
    expect(engine.suggest('Racao Caes').categoryKey).toBe('pets');
    expect(engine.suggest('Coca Cola L').categoryKey).toBe('beverages');
  });

  it('prioriza preferências do usuário', () => {
    const prefs = new Map([[preferenceKey('Coca Cola L'), 'leisure']]);
    const engine = new ReceiptCategoryEngine(prefs);
    const suggestion = engine.suggest('Coca Cola L');
    expect(suggestion.categoryKey).toBe('leisure');
    expect(suggestion.confidence).toBeGreaterThan(0.9);
  });

  it('retorna baixa confiança para desconhecido', () => {
    const engine = new ReceiptCategoryEngine();
    const suggestion = engine.suggest('XYZ123 ITEM');
    expect(suggestion.categoryKey).toBe('groceries');
    expect(suggestion.confidence).toBeLessThan(0.5);
  });
});
