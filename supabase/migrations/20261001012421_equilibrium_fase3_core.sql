-- Equilibrium Fase 3: schema + RLS + RPC onboarding
-- Dinheiro sempre em centavos (BIGINT). Datas civis em DATE.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS private;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Financial profiles
CREATE TABLE public.financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  monthly_income_cents BIGINT NOT NULL DEFAULT 0 CHECK (monthly_income_cents >= 0),
  income_type TEXT NOT NULL DEFAULT 'fixed' CHECK (income_type IN ('fixed', 'variable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER financial_profiles_set_updated_at
BEFORE UPDATE ON public.financial_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Categories (system + future custom)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_key TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT categories_key_owner_unique UNIQUE NULLS NOT DISTINCT (user_id, key)
);

CREATE INDEX categories_user_id_idx ON public.categories (user_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  category_key TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  payment_method TEXT,
  merchant_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX transactions_user_date_idx
  ON public.transactions (user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX transactions_user_category_idx
  ON public.transactions (user_id, category_key)
  WHERE deleted_at IS NULL;

CREATE TRIGGER transactions_set_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  category_key TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  limit_cents BIGINT NOT NULL CHECK (limit_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT budgets_user_cat_period_unique UNIQUE (user_id, category_key, month, year)
);

CREATE INDEX budgets_user_period_idx ON public.budgets (user_id, year, month);

CREATE TRIGGER budgets_set_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.financial_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Atomic onboarding completion
CREATE OR REPLACE FUNCTION private.complete_onboarding(
  p_name TEXT,
  p_monthly_income_cents BIGINT,
  p_income_type TEXT,
  p_budgets JSONB,
  p_transactions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_budget JSONB;
  v_tx JSONB;
  v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_monthly_income_cents IS NULL OR p_monthly_income_cents < 0 THEN
    RAISE EXCEPTION 'invalid_income';
  END IF;

  UPDATE public.profiles
  SET
    name = COALESCE(NULLIF(trim(p_name), ''), name),
    onboarding_completed = TRUE,
    updated_at = v_now
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, name, onboarding_completed)
    VALUES (v_uid, COALESCE(NULLIF(trim(p_name), ''), ''), TRUE);
  END IF;

  INSERT INTO public.financial_profiles (user_id, monthly_income_cents, income_type)
  VALUES (
    v_uid,
    p_monthly_income_cents,
    COALESCE(NULLIF(p_income_type, ''), 'fixed')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    monthly_income_cents = EXCLUDED.monthly_income_cents,
    income_type = EXCLUDED.income_type,
    updated_at = v_now;

  DELETE FROM public.budgets WHERE user_id = v_uid;
  DELETE FROM public.transactions WHERE user_id = v_uid;

  IF p_budgets IS NOT NULL THEN
    FOR v_budget IN SELECT * FROM jsonb_array_elements(p_budgets)
    LOOP
      INSERT INTO public.budgets (
        user_id, category_key, month, year, limit_cents
      ) VALUES (
        v_uid,
        v_budget ->> 'category_key',
        COALESCE((v_budget ->> 'month')::INTEGER, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER),
        COALESCE((v_budget ->> 'year')::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
        GREATEST(0, COALESCE((v_budget ->> 'limit_cents')::BIGINT, 0))
      );
    END LOOP;
  END IF;

  IF p_transactions IS NOT NULL THEN
    FOR v_tx IN SELECT * FROM jsonb_array_elements(p_transactions)
    LOOP
      INSERT INTO public.transactions (
        id,
        user_id,
        type,
        amount_cents,
        description,
        category_key,
        transaction_date
      ) VALUES (
        CASE
          WHEN (v_tx ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN (v_tx ->> 'id')::UUID
          ELSE gen_random_uuid()
        END,
        v_uid,
        v_tx ->> 'type',
        (v_tx ->> 'amount_cents')::BIGINT,
        COALESCE(v_tx ->> 'description', ''),
        v_tx ->> 'category_key',
        (v_tx ->> 'transaction_date')::DATE
      );
    END LOOP;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_name TEXT,
  p_monthly_income_cents BIGINT,
  p_income_type TEXT DEFAULT 'fixed',
  p_budgets JSONB DEFAULT '[]'::JSONB,
  p_transactions JSONB DEFAULT '[]'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM private.complete_onboarding(
    p_name,
    p_monthly_income_cents,
    p_income_type,
    p_budgets,
    p_transactions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, BIGINT, TEXT, JSONB, JSONB) TO authenticated;

-- Local → remote migration marker (per user)
CREATE TABLE public.user_migrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  local_migration_completed BOOLEAN NOT NULL DEFAULT FALSE,
  migration_version TEXT NOT NULL DEFAULT 'v1',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY financial_profiles_select_own ON public.financial_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY financial_profiles_insert_own ON public.financial_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_profiles_update_own ON public.financial_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_profiles_delete_own ON public.financial_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY categories_select_visible ON public.categories
  FOR SELECT TO authenticated
  USING (is_system = TRUE OR user_id = auth.uid());
CREATE POLICY categories_insert_own ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_system = FALSE);
CREATE POLICY categories_update_own ON public.categories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_system = FALSE)
  WITH CHECK (user_id = auth.uid() AND is_system = FALSE);
CREATE POLICY categories_delete_own ON public.categories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND is_system = FALSE);

CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY transactions_insert_own ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY transactions_update_own ON public.transactions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY transactions_delete_own ON public.transactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY budgets_select_own ON public.budgets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY budgets_insert_own ON public.budgets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY budgets_update_own ON public.budgets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY budgets_delete_own ON public.budgets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY user_migrations_select_own ON public.user_migrations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_migrations_insert_own ON public.user_migrations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY user_migrations_update_own ON public.user_migrations
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
