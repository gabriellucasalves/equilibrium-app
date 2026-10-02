import { create } from 'zustand';

import type {
  ProcessedReceipt,
  ReceiptItemDraft,
  ReceiptSourceType,
} from '@/services/receipts/types';

type ReceiptDraftState = {
  status: 'idle' | 'uploading' | 'processing' | 'review' | 'failed';
  source: ReceiptSourceType | null;
  localUri: string | null;
  errorMessage: string | null;
  draft: ProcessedReceipt | null;
  items: ReceiptItemDraft[];
  duplicateReceiptId: string | null;
  setStatus: (status: ReceiptDraftState['status']) => void;
  setError: (message: string | null) => void;
  beginCapture: (source: ReceiptSourceType, uri?: string | null) => void;
  setProcessed: (receipt: ProcessedReceipt) => void;
  updateMerchant: (name: string) => void;
  updateDate: (date: string) => void;
  updateTotal: (cents: number) => void;
  updateItem: (id: string, patch: Partial<ReceiptItemDraft>) => void;
  setDuplicateReceiptId: (id: string | null) => void;
  reset: () => void;
};

const initial = {
  status: 'idle' as const,
  source: null as ReceiptSourceType | null,
  localUri: null as string | null,
  errorMessage: null as string | null,
  draft: null as ProcessedReceipt | null,
  items: [] as ReceiptItemDraft[],
  duplicateReceiptId: null as string | null,
};

export const useReceiptDraftStore = create<ReceiptDraftState>((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  setError: (errorMessage) =>
    set({
      errorMessage,
      status: errorMessage ? 'failed' : 'idle',
    }),
  beginCapture: (source, uri = null) =>
    set({
      ...initial,
      source,
      localUri: uri,
      status: 'uploading',
    }),
  setProcessed: (receipt) =>
    set({
      draft: receipt,
      items: receipt.items,
      status: 'review',
      errorMessage: null,
    }),
  updateMerchant: (name) =>
    set((s) => (s.draft ? { draft: { ...s.draft, merchantName: name } } : {})),
  updateDate: (date) =>
    set((s) => (s.draft ? { draft: { ...s.draft, purchaseDate: date } } : {})),
  updateTotal: (cents) =>
    set((s) => (s.draft ? { draft: { ...s.draft, totalInCents: cents } } : {})),
  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })),
  setDuplicateReceiptId: (duplicateReceiptId) => set({ duplicateReceiptId }),
  reset: () => set(initial),
}));
