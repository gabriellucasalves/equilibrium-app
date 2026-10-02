import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { getSupabaseConfig } from '@/lib/supabase/config';

let client: SupabaseClient | null = null;
let appStateBound = false;

/** Client único — UI não deve importar isto diretamente (exceto bootstrap/auth). */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });

    if (!appStateBound && Platform.OS !== 'web') {
      appStateBound = true;
      AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          client?.auth.startAutoRefresh();
        } else {
          client?.auth.stopAutoRefresh();
        }
      });
    }
  }

  return client;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      financial_profiles: {
        Row: {
          id: string;
          user_id: string;
          monthly_income_cents: number;
          income_type: 'fixed' | 'variable';
          created_at: string;
          updated_at: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          amount_cents: number;
          description: string;
          category_id: string | null;
          category_key: string;
          transaction_date: string;
          payment_method: string | null;
          merchant_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          category_key: string;
          month: number;
          year: number;
          limit_cents: number;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
