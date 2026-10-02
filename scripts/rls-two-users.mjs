/**
 * Teste manual/automatizado de RLS com dois usuários (anon key).
 * Uso: node --env-file=.env scripts/rls-two-users.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY');
  process.exit(1);
}

const stamp = Date.now();
const password = 'TestPass123!';
const emailA = `odooprogramando+rls_a_${stamp}@gmail.com`;
const emailB = `odooprogramando+rls_b_${stamp}@gmail.com`;

async function signUp(email, name) {
  const client = createClient(url, anon);
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return { client, user: data.user, session: data.session };
}

async function main() {
  console.log('Creating users…');
  const a = await signUp(emailA, 'User A');
  const b = await signUp(emailB, 'User B');

  if (!a.session || !b.session) {
    console.log(
      'Sessions missing (email confirmation may be required). Confirm via SQL and re-run sign-in.',
    );
    console.log(JSON.stringify({ emailA, emailB, password }, null, 2));
    process.exit(2);
  }

  const { data: txA, error: errA } = await a.client
    .from('transactions')
    .insert({
      user_id: a.user.id,
      type: 'expense',
      amount_cents: 10000,
      description: 'Supermercado RLS',
      category_key: 'groceries',
      transaction_date: '2026-10-01',
    })
    .select('id')
    .single();
  if (errA) throw errA;

  const { data: leaked, error: errB } = await b.client
    .from('transactions')
    .select('id, description')
    .eq('id', txA.id);

  if (errB) throw errB;
  if (leaked && leaked.length > 0) {
    console.error('RLS FAIL: user B can see user A transaction', leaked);
    process.exit(1);
  }

  console.log('RLS OK: user B cannot see user A transaction', txA.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
