-- Seed de desenvolvimento: apenas categorias do sistema.
-- NÃO inserir usuários nem dados financeiros.

INSERT INTO public.categories (key, label, icon_key, type, is_system, user_id) VALUES
  ('housing', 'Moradia', 'home', 'expense', TRUE, NULL),
  ('energy', 'Energia', 'flash', 'expense', TRUE, NULL),
  ('water', 'Água', 'water', 'expense', TRUE, NULL),
  ('internet', 'Internet', 'wifi', 'expense', TRUE, NULL),
  ('phone', 'Telefone', 'call', 'expense', TRUE, NULL),
  ('groceries', 'Mercado', 'cart', 'expense', TRUE, NULL),
  ('transport', 'Transporte', 'car', 'expense', TRUE, NULL),
  ('health', 'Saúde', 'medkit', 'expense', TRUE, NULL),
  ('education', 'Educação', 'school', 'expense', TRUE, NULL),
  ('leisure', 'Lazer', 'happy', 'expense', TRUE, NULL),
  ('salary', 'Salário', 'cash', 'income', TRUE, NULL),
  ('other_income', 'Outra receita', 'wallet', 'income', TRUE, NULL)
ON CONFLICT DO NOTHING;
