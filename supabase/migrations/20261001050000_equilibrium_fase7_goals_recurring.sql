-- Equilibrium Fase 7: goals + recurring expenses

CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount_cents BIGINT NOT NULL CHECK (target_amount_cents > 0),
  current_amount_cents BIGINT NOT NULL DEFAULT 0 CHECK (current_amount_cents >= 0),
  target_date DATE,
  icon_key TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX financial_goals_user_status_idx
  ON public.financial_goals (user_id, status);

CREATE TRIGGER financial_goals_set_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_cents BIGINT CHECK (amount_cents IS NULL OR amount_cents >= 0),
  estimated_amount_cents BIGINT CHECK (estimated_amount_cents IS NULL OR estimated_amount_cents >= 0),
  category_key TEXT NOT NULL DEFAULT 'others',
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  due_day INT CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
  next_due_date DATE NOT NULL,
  payment_method TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX recurring_expenses_user_due_idx
  ON public.recurring_expenses (user_id, next_due_date)
  WHERE is_active = TRUE;

CREATE TRIGGER recurring_expenses_set_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_goals_select_own ON public.financial_goals
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY financial_goals_insert_own ON public.financial_goals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_goals_update_own ON public.financial_goals
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_goals_delete_own ON public.financial_goals
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY recurring_expenses_select_own ON public.recurring_expenses
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY recurring_expenses_insert_own ON public.recurring_expenses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY recurring_expenses_update_own ON public.recurring_expenses
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY recurring_expenses_delete_own ON public.recurring_expenses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Preferência de objetivo do onboarding (não altera finanças)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_focus TEXT;
