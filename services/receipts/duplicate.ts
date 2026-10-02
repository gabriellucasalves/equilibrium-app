import type { ConfirmedReceipt, ProcessedReceipt } from '@/services/receipts/types';

export type DuplicateMatch = {
  receipt: ConfirmedReceipt;
  reason: 'hash' | 'fingerprint';
};

export function findDuplicateReceipt(
  candidate: Pick<
    ProcessedReceipt,
    'merchantName' | 'purchaseDate' | 'totalInCents' | 'fileHash'
  >,
  existing: readonly ConfirmedReceipt[],
): DuplicateMatch | null {
  if (candidate.fileHash) {
    const byHash = existing.find(
      (r) => r.fileHash && r.fileHash === candidate.fileHash,
    );
    if (byHash) return { receipt: byHash, reason: 'hash' };
  }

  const merchant = candidate.merchantName.trim().toLowerCase();
  const match = existing.find((r) => {
    return (
      r.merchantName.trim().toLowerCase() === merchant &&
      r.purchaseDate === candidate.purchaseDate &&
      r.totalAmountCents === candidate.totalInCents &&
      r.processingStatus === 'confirmed'
    );
  });

  return match ? { receipt: match, reason: 'fingerprint' } : null;
}
