-- Equilibrium Fase 5: conversas do Controlinho

CREATE TABLE public.assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Conversa com o Controlinho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX assistant_conversations_user_updated_idx
  ON public.assistant_conversations (user_id, updated_at DESC);

CREATE TRIGGER assistant_conversations_set_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.assistant_conversations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  tool_names TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX assistant_messages_conversation_idx
  ON public.assistant_messages (conversation_id, created_at ASC);

CREATE INDEX assistant_messages_user_idx
  ON public.assistant_messages (user_id);

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY assistant_conversations_select_own ON public.assistant_conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY assistant_conversations_insert_own ON public.assistant_conversations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY assistant_conversations_update_own ON public.assistant_conversations
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY assistant_conversations_delete_own ON public.assistant_conversations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY assistant_messages_select_own ON public.assistant_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY assistant_messages_insert_own ON public.assistant_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY assistant_messages_update_own ON public.assistant_messages
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY assistant_messages_delete_own ON public.assistant_messages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Preenche user_id automaticamente a partir da sessão
CREATE OR REPLACE FUNCTION private.set_assistant_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden_user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assistant_conversations_set_user
BEFORE INSERT ON public.assistant_conversations
FOR EACH ROW EXECUTE FUNCTION private.set_assistant_user_id();

CREATE TRIGGER assistant_messages_set_user
BEFORE INSERT ON public.assistant_messages
FOR EACH ROW EXECUTE FUNCTION private.set_assistant_user_id();
