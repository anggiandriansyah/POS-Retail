import type { SupabaseClient } from '@supabase/supabase-js';
import type { PettyCashLog, Shift } from '../types/pos';

export interface ShiftDetailsResult {
  cashSales: number;
  pettyLogs: PettyCashLog[];
}

export interface ShiftCashSummary {
  opening: number;
  pettyIn: number;
  pettyOut: number;
  expectedCash: number;
}

export async function fetchShiftDetails(
  client: SupabaseClient | null,
  shiftId: string
): Promise<ShiftDetailsResult> {
  if (!client) throw new Error('Supabase belum dikonfigurasi.');

  const [{ data: cashTxData, error: txErr }, { data: pettyData, error: pettyErr }] =
    await Promise.all([
      client
        .from('transactions')
        .select('total_amount, payment_method')
        .eq('shift_id', shiftId),
      client
        .from('petty_cash_logs')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: false }),
    ]);

  if (txErr) throw txErr;
  if (pettyErr) throw pettyErr;

  const cashSales = (cashTxData || [])
    .filter((t) => (t.payment_method || '').toLowerCase() === 'cash')
    .reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

  return {
    cashSales,
    pettyLogs: (pettyData as PettyCashLog[]) || [],
  };
}

export function computeShiftSummary(
  activeShift: Pick<Shift, 'opening_cash'> | null | undefined,
  cashSales: number,
  pettyLogs: PettyCashLog[]
): ShiftCashSummary {
  const opening = Number(activeShift?.opening_cash || 0);
  const pettyIn = pettyLogs
    .filter((l) => l.type === 'IN')
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const pettyOut = pettyLogs
    .filter((l) => l.type === 'OUT')
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const expectedCash = opening + cashSales + pettyIn - pettyOut;
  return { opening, pettyIn, pettyOut, expectedCash };
}
