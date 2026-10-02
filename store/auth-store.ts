import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { getSupabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseRepositories } from '@/repositories/factory';
import type { UserProfile } from '@/repositories/interfaces/financial-profile-repository';
import { AppError, mapErrorToUserMessage } from '@/services/errors/map-error';

type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated'
  | 'demo';

type AuthState = {
  status: AuthStatus;
  initialized: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  errorMessage: string | null;
  needsLocalMigration: boolean;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
  exitDemo: () => void;
  setNeedsLocalMigration: (value: boolean) => void;
  clearError: () => void;
};

async function evaluateMigrationFlag(): Promise<boolean> {
  const repos = createSupabaseRepositories();
  if (!repos) return false;
  const status = await repos.migration.getStatus();
  if (status?.localMigrationCompleted) return false;

  const { useFinanceStore } = await import('@/store/finance-store');
  const local = useFinanceStore.getState();
  const hasLocal =
    local.transactions.length > 0 ||
    local.budgets.length > 0 ||
    local.monthlyIncomeCents > 0;

  if (!hasLocal) {
    await repos.migration.markCompleted('v1-empty');
    return false;
  }

  const remoteTx = await repos.transactions.list();
  const remoteBudgets = await repos.budgets.list(
    new Date().getMonth() + 1,
    new Date().getFullYear(),
  );
  const hasRemote = remoteTx.length > 0 || remoteBudgets.length > 0;
  return hasLocal && !hasRemote;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  initialized: false,
  session: null,
  user: null,
  profile: null,
  errorMessage: null,
  needsLocalMigration: false,

  clearError: () => set({ errorMessage: null }),

  setNeedsLocalMigration: (value) => set({ needsLocalMigration: value }),

  enterDemo: () =>
    set({
      status: 'demo',
      session: null,
      user: null,
      profile: {
        name: 'Gabriel',
        onboardingCompleted: true,
      },
      needsLocalMigration: false,
    }),

  exitDemo: () =>
    set({
      status: 'unauthenticated',
      profile: null,
    }),

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({
        status: 'unauthenticated',
        initialized: true,
        session: null,
        user: null,
      });
      return;
    }

    const client = getSupabase();
    if (!client) {
      set({ status: 'unauthenticated', initialized: true });
      return;
    }

    const {
      data: { session },
    } = await client.auth.getSession();

    if (session?.user) {
      set({
        session,
        user: session.user,
        status: 'authenticated',
      });
      await get().refreshProfile();
      try {
        const needs = await evaluateMigrationFlag();
        set({ needsLocalMigration: needs });
      } catch {
        set({ needsLocalMigration: false });
      }
    } else {
      set({
        session: null,
        user: null,
        profile: null,
        status: 'unauthenticated',
      });
    }

    client.auth.onAuthStateChange(async (event, nextSession) => {
      if (get().status === 'demo') return;

      if (nextSession?.user) {
        set({
          session: nextSession,
          user: nextSession.user,
          status: 'authenticated',
        });
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          await get().refreshProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        set({
          session: null,
          user: null,
          profile: null,
          status: 'unauthenticated',
          needsLocalMigration: false,
        });
      }
    });

    set({ initialized: true });
  },

  refreshProfile: async () => {
    const repos = createSupabaseRepositories();
    if (!repos) return;
    try {
      const profile = await repos.profile.get();
      set({ profile });
    } catch (error) {
      set({ errorMessage: mapErrorToUserMessage(error) });
    }
  },

  signUp: async ({ name, email, password }) => {
    const client = getSupabase();
    if (!client) throw new AppError('Supabase não configurado');
    set({ errorMessage: null });
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });
    if (error) {
      const message = mapErrorToUserMessage(error);
      set({ errorMessage: message });
      throw new AppError(error, message);
    }

    if (data.session) {
      set({
        session: data.session,
        user: data.user,
        status: 'authenticated',
      });
      await get().refreshProfile();
      if (name.trim()) {
        try {
          await createSupabaseRepositories()?.profile.updateName(name.trim());
          await get().refreshProfile();
        } catch {
          // profile trigger may already have set name from metadata
        }
      }
      return { needsEmailConfirmation: false };
    }

    return { needsEmailConfirmation: true };
  },

  signIn: async ({ email, password }) => {
    const client = getSupabase();
    if (!client) throw new AppError('Supabase não configurado');
    set({ errorMessage: null });
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const message = mapErrorToUserMessage(error);
      set({ errorMessage: message });
      throw new AppError(error, message);
    }
    set({
      session: data.session,
      user: data.user,
      status: 'authenticated',
    });
    await get().refreshProfile();
    try {
      const needs = await evaluateMigrationFlag();
      set({ needsLocalMigration: needs });
    } catch {
      set({ needsLocalMigration: false });
    }
  },

  resetPassword: async (email) => {
    const client = getSupabase();
    if (!client) throw new AppError('Supabase não configurado');
    set({ errorMessage: null });
    const { error } = await client.auth.resetPasswordForEmail(email.trim());
    if (error) {
      const message = mapErrorToUserMessage(error);
      set({ errorMessage: message });
      throw new AppError(error, message);
    }
  },

  signOut: async () => {
    const client = getSupabase();
    set({ errorMessage: null });
    if (client) {
      await client.auth.signOut();
    }
    const { useFinanceStore } = await import('@/store/finance-store');
    useFinanceStore.getState().clearPrivateData();
    set({
      session: null,
      user: null,
      profile: null,
      status: 'unauthenticated',
      needsLocalMigration: false,
    });
  },
}));
