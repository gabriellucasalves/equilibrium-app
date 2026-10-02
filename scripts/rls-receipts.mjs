/**
 * RLS + Storage isolation for receipts (Fase 4).
 * Uso: node --env-file=.env scripts/rls-receipts.mjs
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
const emailA = `odooprogramando+rcpt_a_${stamp}@gmail.com`;
const emailB = `odooprogramando+rcpt_b_${stamp}@gmail.com`;

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
  const a = await signUp(emailA, 'Receipt A');
  const b = await signUp(emailB, 'Receipt B');

  if (!a.session || !b.session) {
    console.log(
      'Sessions missing (email confirmation may be required).',
      JSON.stringify({ emailA, emailB, password }, null, 2),
    );
    process.exit(2);
  }

  const path = `${a.user.id}/2026/10/rls-test.jpg`;
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  const { error: upErr } = await a.client.storage
    .from('receipt-files')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (upErr) throw upErr;

  const receiptId = await a.client.rpc('confirm_receipt', {
    p_receipt: {
      merchant_name: 'Mercado RLS',
      merchant_document: null,
      purchase_date: '2026-10-01',
      total_amount_cents: 1990,
      discount_cents: 0,
      additional_charges_cents: 0,
      source_type: 'camera',
      file_path: path,
      file_hash: 'rls-hash',
      parser_provider: 'test',
      parser_confidence: 0.5,
    },
    p_items: [
      {
        raw_description: 'ARROZ',
        normalized_description: 'Arroz',
        quantity: 1,
        unit_price_cents: 1990,
        total_price_cents: 1990,
        category_key: 'groceries',
        confidence: 0.8,
      },
    ],
    p_transaction: {
      amount_cents: 1990,
      description: 'Mercado RLS',
      category_key: 'groceries',
      transaction_date: '2026-10-01',
    },
    p_preferences: [],
  });
  if (receiptId.error) throw receiptId.error;
  const id = receiptId.data;

  const { data: leakedReceipts, error: rErr } = await b.client
    .from('receipts')
    .select('id')
    .eq('id', id);
  if (rErr) throw rErr;
  if (leakedReceipts?.length) {
    console.error('RLS FAIL: B sees A receipt');
    process.exit(1);
  }

  const { data: leakedItems, error: iErr } = await b.client
    .from('receipt_items')
    .select('id')
    .eq('receipt_id', id);
  if (iErr) throw iErr;
  if (leakedItems?.length) {
    console.error('RLS FAIL: B sees A receipt_items');
    process.exit(1);
  }

  const { data: listB, error: listErr } = await b.client.storage
    .from('receipt-files')
    .list(`${a.user.id}/2026/10`);
  if (listErr) {
    // esperado: sem acesso
    console.log('Storage list blocked/errored for B (ok):', listErr.message);
  } else if (listB && listB.length > 0) {
    console.error('STORAGE FAIL: B listed A files', listB);
    process.exit(1);
  }

  const { data: signed, error: sErr } = await b.client.storage
    .from('receipt-files')
    .createSignedUrl(path, 60);
  if (!sErr && signed?.signedUrl) {
    console.error('STORAGE FAIL: B got signed URL for A file');
    process.exit(1);
  }

  const { data: download, error: dErr } = await b.client.storage
    .from('receipt-files')
    .download(path);
  if (!dErr && download) {
    console.error('STORAGE FAIL: B downloaded A file');
    process.exit(1);
  }

  console.log('RLS/Storage OK: B cannot access A receipt/items/file', id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
