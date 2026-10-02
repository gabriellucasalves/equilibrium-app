import type {
  AssistantConversation,
  AssistantMessage,
} from '@/features/assistant/types';
import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import { createId } from '@/utils/id';

export interface AssistantConversationRepository {
  listRecent(limit?: number): Promise<AssistantConversation[]>;
  getActive(): Promise<AssistantConversation | null>;
  appendMessage(input: {
    conversationId?: string | null;
    message: Omit<AssistantMessage, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    };
  }): Promise<{ conversationId: string; message: AssistantMessage }>;
  clearAll(): Promise<void>;
}

/** Persistência remota (auth). */
export class SupabaseAssistantConversationRepository
  implements AssistantConversationRepository
{
  async listRecent(limit = 10): Promise<AssistantConversation[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('assistant_conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) throw new AppError(error);

    const result: AssistantConversation[] = [];
    for (const row of data ?? []) {
      const messages = await this.loadMessages(row.id);
      result.push({
        id: row.id,
        title: row.title,
        messages,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
    return result;
  }

  async getActive(): Promise<AssistantConversation | null> {
    const list = await this.listRecent(1);
    return list[0] ?? null;
  }

  async appendMessage(input: {
    conversationId?: string | null;
    message: Omit<AssistantMessage, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    };
  }): Promise<{ conversationId: string; message: AssistantMessage }> {
    const client = requireClient();
    let conversationId = input.conversationId ?? null;
    const now = new Date().toISOString();

    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new AppError('Faça login para salvar a conversa.');

    if (!conversationId) {
      const title =
        input.message.role === 'user'
          ? input.message.content.slice(0, 60)
          : 'Conversa com o Controlinho';
      const { data, error } = await client
        .from('assistant_conversations')
        .insert({ title, user_id: user.id })
        .select('id')
        .single();
      if (error) throw new AppError(error);
      conversationId = data.id as string;
    }

    if (!conversationId) {
      throw new AppError('Não foi possível abrir a conversa.');
    }

    const message: AssistantMessage = {
      id: input.message.id ?? createId('am'),
      role: input.message.role,
      content: input.message.content,
      createdAt: input.message.createdAt ?? now,
      toolNames: input.message.toolNames,
    };

    // IDs locais (am_...) não são UUID — deixar o banco gerar
    const { data: inserted, error: msgError } = await client
      .from('assistant_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: message.role,
        content: message.content,
        tool_names: message.toolNames ?? [],
      })
      .select('id, created_at')
      .single();
    if (msgError) throw new AppError(msgError);

    await client
      .from('assistant_conversations')
      .update({ updated_at: now })
      .eq('id', conversationId);

    return {
      conversationId,
      message: {
        ...message,
        id: inserted.id,
        createdAt: inserted.created_at,
      },
    };
  }

  async clearAll(): Promise<void> {
    const client = requireClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;
    const { error } = await client
      .from('assistant_conversations')
      .delete()
      .eq('user_id', user.id);
    if (error) throw new AppError(error);
  }

  private async loadMessages(conversationId: string): Promise<AssistantMessage[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('assistant_messages')
      .select('id, role, content, tool_names, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new AppError(error);
    return (data ?? []).map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      toolNames: row.tool_names ?? [],
      createdAt: row.created_at,
    }));
  }
}

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}
