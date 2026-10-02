import * as Crypto from 'expo-crypto';
import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';

const BUCKET = 'receipt-files';
/** Alinha com file_size_limit do bucket (10 MB). */
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export async function hashFileBase64(base64: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64,
  );
}

export function estimateBase64Bytes(base64: string): number {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

export function assertReceiptFileSize(base64: string): void {
  if (estimateBase64Bytes(base64) > MAX_RECEIPT_BYTES) {
    throw new AppError(
      'Arquivo muito grande. Use uma imagem de até 10 MB.',
    );
  }
}

export function buildReceiptObjectPath(
  userId: string,
  receiptId: string,
  ext: string,
  now = new Date(),
): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${userId}/${year}/${month}/${receiptId}.${ext}`;
}

export async function uploadReceiptFile(input: {
  userId: string;
  receiptId: string;
  base64: string;
  mimeType: string;
}): Promise<{ path: string; hash: string }> {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');

  const ext = mimeToExt(input.mimeType);
  const path = buildReceiptObjectPath(input.userId, input.receiptId, ext);
  const hash = await hashFileBase64(input.base64);

  const binary = decodeBase64(input.base64);
  const { error } = await client.storage.from(BUCKET).upload(path, binary, {
    contentType: input.mimeType,
    upsert: false,
  });
  if (error) throw new AppError(error, 'Falha ao enviar o arquivo da nota.');

  return { path, hash };
}

export async function createReceiptSignedUrl(
  filePath: string,
  expiresIn = 120,
): Promise<string> {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new AppError(error, 'Não foi possível abrir o documento.');
  }
  return data.signedUrl;
}

function mimeToExt(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('pdf')) return 'pdf';
  return 'jpg';
}

function decodeBase64(base64: string): ArrayBuffer {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  if (typeof atob === 'function') {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  // Node/test fallback sem tipar Buffer no tsconfig do Expo
  const nodeBuffer = (
    globalThis as unknown as {
      Buffer?: {
        from: (
          value: string,
          encoding: string,
        ) => { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
      };
    }
  ).Buffer;
  if (!nodeBuffer) {
    throw new AppError('Decodificação base64 indisponível neste ambiente.');
  }
  const buf = nodeBuffer.from(cleaned, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
