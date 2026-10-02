-- Equilibrium Fase 4: receipts, items, preferences, storage, confirm RPC

-- Extra system categories for receipt categorization
INSERT INTO public.categories (key, label, icon_key, type, is_system, user_id) VALUES
  ('hygiene', 'Higiene', 'water', 'expense', TRUE, NULL),
  ('cleaning', 'Limpeza', 'sparkles', 'expense', TRUE, NULL),
  ('pets', 'Pets', 'paw', 'expense', TRUE, NULL),
  ('beverages', 'Bebidas', 'cafe', 'expense', TRUE, NULL),
  ('others', 'Outros', 'ellipsis-horizontal', 'expense', TRUE, NULL)
ON CONFLICT DO NOTHING;

-- Receipts
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL DEFAULT '',
  merchant_document TEXT,
  purchase_date DATE,
  total_amount_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_amount_cents >= 0),
  discount_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  additional_charges_cents BIGINT NOT NULL DEFAULT 0 CHECK (additional_charges_cents >= 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('camera', 'gallery', 'pdf', 'qr', 'manual', 'demo')),
  file_path TEXT,
  file_hash TEXT,
  processing_status TEXT NOT NULL DEFAULT 'review'
    CHECK (processing_status IN ('uploading', 'processing', 'review', 'confirmed', 'failed')),
  parser_provider TEXT,
  parser_confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX receipts_user_date_idx ON public.receipts (user_id, purchase_date DESC);
CREATE INDEX receipts_user_hash_idx ON public.receipts (user_id, file_hash)
  WHERE file_hash IS NOT NULL;

CREATE TRIGGER receipts_set_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Receipt items
CREATE TABLE public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.receipts (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  raw_description TEXT NOT NULL DEFAULT '',
  normalized_description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents BIGINT CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
  total_price_cents BIGINT NOT NULL CHECK (total_price_cents >= 0),
  category_key TEXT NOT NULL DEFAULT 'groceries',
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX receipt_items_receipt_idx ON public.receipt_items (receipt_id);
CREATE INDEX receipt_items_user_idx ON public.receipt_items (user_id);

CREATE TRIGGER receipt_items_set_updated_at
BEFORE UPDATE ON public.receipt_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link transactions ↔ receipts
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES public.receipts (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_receipt_id_idx
  ON public.transactions (receipt_id)
  WHERE receipt_id IS NOT NULL;

-- User category learning
CREATE TABLE public.item_category_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  normalized_key TEXT NOT NULL,
  category_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT item_prefs_user_key_unique UNIQUE (user_id, normalized_key)
);

CREATE TRIGGER item_category_preferences_set_updated_at
BEFORE UPDATE ON public.item_category_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_category_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY receipts_select_own ON public.receipts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY receipts_insert_own ON public.receipts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY receipts_update_own ON public.receipts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY receipts_delete_own ON public.receipts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY receipt_items_select_own ON public.receipt_items
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY receipt_items_insert_own ON public.receipt_items
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_items_update_own ON public.receipt_items
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_items_delete_own ON public.receipt_items
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY item_prefs_select_own ON public.item_category_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY item_prefs_insert_own ON public.item_category_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY item_prefs_update_own ON public.item_category_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY item_prefs_delete_own ON public.item_category_preferences
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-files',
  'receipt-files',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies: first folder = auth.uid()
CREATE POLICY receipt_files_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipt-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipt_files_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipt-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipt_files_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipt-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'receipt-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY receipt_files_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipt-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atomic confirm
CREATE OR REPLACE FUNCTION private.confirm_receipt(
  p_receipt JSONB,
  p_items JSONB,
  p_transaction JSONB,
  p_preferences JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_receipt_id UUID;
  v_tx_id UUID;
  v_item JSONB;
  v_pref JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.receipts (
    id, user_id, merchant_name, merchant_document, purchase_date,
    total_amount_cents, discount_cents, additional_charges_cents,
    source_type, file_path, file_hash, processing_status,
    parser_provider, parser_confidence
  ) VALUES (
    COALESCE((p_receipt ->> 'id')::UUID, gen_random_uuid()),
    v_uid,
    COALESCE(p_receipt ->> 'merchant_name', ''),
    p_receipt ->> 'merchant_document',
    NULLIF(p_receipt ->> 'purchase_date', '')::DATE,
    COALESCE((p_receipt ->> 'total_amount_cents')::BIGINT, 0),
    COALESCE((p_receipt ->> 'discount_cents')::BIGINT, 0),
    COALESCE((p_receipt ->> 'additional_charges_cents')::BIGINT, 0),
    COALESCE(p_receipt ->> 'source_type', 'camera'),
    p_receipt ->> 'file_path',
    p_receipt ->> 'file_hash',
    'confirmed',
    p_receipt ->> 'parser_provider',
    NULLIF(p_receipt ->> 'parser_confidence', '')::NUMERIC
  )
  RETURNING id INTO v_receipt_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::JSONB))
  LOOP
    INSERT INTO public.receipt_items (
      id, receipt_id, user_id, raw_description, normalized_description,
      quantity, unit_price_cents, total_price_cents, category_key, confidence
    ) VALUES (
      COALESCE((v_item ->> 'id')::UUID, gen_random_uuid()),
      v_receipt_id,
      v_uid,
      COALESCE(v_item ->> 'raw_description', ''),
      COALESCE(v_item ->> 'normalized_description', ''),
      GREATEST(0.001, COALESCE((v_item ->> 'quantity')::NUMERIC, 1)),
      NULLIF(v_item ->> 'unit_price_cents', '')::BIGINT,
      COALESCE((v_item ->> 'total_price_cents')::BIGINT, 0),
      COALESCE(v_item ->> 'category_key', 'groceries'),
      NULLIF(v_item ->> 'confidence', '')::NUMERIC
    );
  END LOOP;

  INSERT INTO public.transactions (
    id, user_id, type, amount_cents, description, category_key,
    transaction_date, receipt_id
  ) VALUES (
    COALESCE((p_transaction ->> 'id')::UUID, gen_random_uuid()),
    v_uid,
    'expense',
    COALESCE((p_transaction ->> 'amount_cents')::BIGINT, (p_receipt ->> 'total_amount_cents')::BIGINT),
    COALESCE(p_transaction ->> 'description', p_receipt ->> 'merchant_name', 'Nota fiscal'),
    COALESCE(p_transaction ->> 'category_key', 'groceries'),
    COALESCE(NULLIF(p_transaction ->> 'transaction_date', '')::DATE, NULLIF(p_receipt ->> 'purchase_date', '')::DATE, CURRENT_DATE),
    v_receipt_id
  )
  RETURNING id INTO v_tx_id;

  FOR v_pref IN SELECT * FROM jsonb_array_elements(COALESCE(p_preferences, '[]'::JSONB))
  LOOP
    INSERT INTO public.item_category_preferences (user_id, normalized_key, category_key)
    VALUES (
      v_uid,
      lower(trim(v_pref ->> 'normalized_key')),
      v_pref ->> 'category_key'
    )
    ON CONFLICT (user_id, normalized_key) DO UPDATE
    SET category_key = EXCLUDED.category_key, updated_at = timezone('utc', now());
  END LOOP;

  RETURN v_receipt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_receipt(
  p_receipt JSONB,
  p_items JSONB,
  p_transaction JSONB,
  p_preferences JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN private.confirm_receipt(p_receipt, p_items, p_transaction, p_preferences);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_receipt(JSONB, JSONB, JSONB, JSONB) TO authenticated;
