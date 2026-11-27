import type { SupabaseClient } from '@supabase/supabase-js';
import type { Transaction, TransactionItem } from '../types/pos';

export interface OfflineQueuedSale {
  id: string;
  invoice_number: string;
  payment_method: string;
  cash_received: number;
  items: Array<{
    product_id: string;
    qty: number;
    discount_type: string;
    discount_value: number;
  }>;
  discount_type: string;
  discount_value: number;
  apply_tax: boolean;
  timestamp: string;
  transaction: Transaction;
  receipt_items: TransactionItem[];
}

const STORAGE_KEY = 'alphos_offline_sales_queue';

export function getOfflineQueue(): OfflineQueuedSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineSale(sale: OfflineQueuedSale): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    queue.push(sale);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline sale to storage', err);
  }
}

export function removeOfflineSale(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to remove offline sale from storage', err);
  }
}

export async function syncOfflineQueue(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const { error } = await supabase.rpc('process_sale', {
        p_invoice_number: item.invoice_number,
        p_payment_method: item.payment_method,
        p_cash_received: item.cash_received,
        p_items: item.items,
        p_discount_type: item.discount_type,
        p_discount_value: item.discount_value,
        p_apply_tax: item.apply_tax,
      });

      if (
        !error ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('already exists')
      ) {
        removeOfflineSale(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
