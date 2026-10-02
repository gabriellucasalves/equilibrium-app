import type { ExpenseKind } from '@/types/finance';

export type OnboardingCategory = {
  key: string;
  label: string;
  kind: ExpenseKind;
  helper: string;
};

/** Categorias do onboarding — ordem conversacional. */
export const ONBOARDING_CATEGORIES: OnboardingCategory[] = [
  {
    key: 'housing',
    label: 'Moradia',
    kind: 'fixed',
    helper: 'Aluguel, condomínio ou financiamento',
  },
  {
    key: 'energy',
    label: 'Energia',
    kind: 'fixed',
    helper: 'Conta de luz média do mês',
  },
  {
    key: 'water',
    label: 'Água',
    kind: 'fixed',
    helper: 'Conta de água média do mês',
  },
  {
    key: 'internet',
    label: 'Internet',
    kind: 'fixed',
    helper: 'Plano de internet residencial',
  },
  {
    key: 'phone',
    label: 'Telefone',
    kind: 'fixed',
    helper: 'Celular ou telefone fixo',
  },
  {
    key: 'groceries',
    label: 'Mercado',
    kind: 'variable',
    helper: 'Orçamento mensal para compras',
  },
  {
    key: 'transport',
    label: 'Transporte',
    kind: 'variable',
    helper: 'Apps, combustível ou passagem',
  },
  {
    key: 'health',
    label: 'Saúde',
    kind: 'variable',
    helper: 'Plano, farmácia ou consultas',
  },
  {
    key: 'education',
    label: 'Educação',
    kind: 'variable',
    helper: 'Cursos, mensalidades, materiais',
  },
  {
    key: 'leisure',
    label: 'Lazer',
    kind: 'variable',
    helper: 'Sair, streaming, hobbies',
  },
];
