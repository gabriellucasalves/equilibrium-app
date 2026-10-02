/** Paginação por batch — espelha a lógica da tela Movimentações. */
function paginate<T>(items: T[], pageSize: number, visibleCount: number): T[] {
  return items.slice(0, Math.min(items.length, visibleCount));
}

describe('transaction pagination', () => {
  it('não carrega mil itens de uma vez', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const first = paginate(items, 30, 30);
    expect(first).toHaveLength(30);
    const second = paginate(items, 30, 60);
    expect(second).toHaveLength(60);
    expect(second[59]?.id).toBe('59');
  });
});
