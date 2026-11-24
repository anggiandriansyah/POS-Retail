'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabaseClient';
import type {
  Product,
  ReceiptModalData,
  StockLog,
  Transaction,
  TransactionItem,
} from '../types/pos';
import { formatDateTime, formatRupiah } from '../utils/format';

interface TodayTransactionSummary {
  total_amount: number;
  transaction_items?: Array<Pick<TransactionItem, 'product_id' | 'price' | 'cost_price' | 'qty'>>;
}

function getStartOfTodayIso(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

async function queryReportsData({
  isOwner,
  userId,
  shiftFilterId,
}: {
  isOwner: boolean;
  userId?: string;
  shiftFilterId: string | null;
}): Promise<{
  transactions: Transaction[];
  todayTransactions: TodayTransactionSummary[];
  stockLogs: StockLog[];
}> {
  if (!supabase) {
    return { transactions: [], todayTransactions: [], stockLogs: [] };
  }

  const startOfTodayIso = getStartOfTodayIso();

  let txQuery = supabase
    .from('transactions')
    .select('*, transaction_items(*), cashier:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  let todayQuery = supabase
    .from('transactions')
    .select('total_amount, transaction_items(product_id, price, cost_price, qty)')
    .gte('created_at', startOfTodayIso);

  if (!isOwner && userId) {
    txQuery = txQuery.eq('cashier_id', userId);
    todayQuery = todayQuery.eq('cashier_id', userId);
    if (shiftFilterId) {
      txQuery = txQuery.eq('shift_id', shiftFilterId);
      todayQuery = todayQuery.eq('shift_id', shiftFilterId);
    }
  }

  const [txResult, todayResult, stockLogsResult] = await Promise.all([
    txQuery,
    todayQuery,
    isOwner
      ? supabase
          .from('stock_logs')
          .select('*, products(name, barcode)')
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as StockLog[] }),
  ]);

  return {
    transactions: (txResult.data as Transaction[]) || [],
    todayTransactions: (todayResult.data as TodayTransactionSummary[]) || [],
    stockLogs: isOwner ? ((stockLogsResult.data as StockLog[]) || []) : [],
  };
}

export interface ReportsViewProps {
  products: Product[];
  onOpenReceipt: (data: ReceiptModalData) => void;
}

export default function ReportsView({ products, onOpenReceipt }: ReportsViewProps) {
  const { user, profile, activeShift } = useAuth();
  const isOwner = profile?.role === 'owner';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<TodayTransactionSummary[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [subTab, setSubTab] = useState<'transactions' | 'stock_logs'>('transactions');
  const [onlyActiveShift, setOnlyActiveShift] = useState(false);
  const [loading, setLoading] = useState(true);

  const shiftFilterId = !isOwner && onlyActiveShift && activeShift ? activeShift.id : null;

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await queryReportsData({
      isOwner,
      userId: user?.id,
      shiftFilterId,
    });
    setTransactions(result.transactions);
    setTodayTransactions(result.todayTransactions);
    setStockLogs(result.stockLogs);
    setLoading(false);
  }, [isOwner, user?.id, shiftFilterId]);

  useEffect(() => {
    let cancelled = false;
    queryReportsData({
      isOwner,
      userId: user?.id,
      shiftFilterId,
    }).then((result) => {
      if (cancelled) return;
      setTransactions(result.transactions);
      setTodayTransactions(result.todayTransactions);
      setStockLogs(result.stockLogs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOwner, user?.id, shiftFilterId]);

  const summary = useMemo(() => {
    const todayRevenue = todayTransactions.reduce(
      (s, t) => s + Number(t.total_amount),
      0
    );

    const buyPriceMap = new Map(products.map((p) => [p.id, Number(p.buy_price) || 0]));
    let todayProfit = 0;
    for (const tx of todayTransactions) {
      for (const item of tx.transaction_items || []) {
        const snapshotCost = Number(item.cost_price) || 0;
        const unitCost =
          snapshotCost > 0
            ? snapshotCost
            : (item.product_id ? buyPriceMap.get(item.product_id) : undefined) ?? 0;
        todayProfit += (Number(item.price) - unitCost) * item.qty;
      }
    }

    const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

    return {
      todayRevenue,
      todayCount: todayTransactions.length,
      todayProfit,
      lowStockCount,
    };
  }, [todayTransactions, products]);

  const activeSubTab = isOwner ? subTab : 'transactions';

  return (
    <div className="reports-layout">
      <div className="stats-grid">
        <div className="stat-card">
          <span>{isOwner ? 'Omzet Hari Ini' : 'Omzet Saya Hari Ini'}</span>
          <strong>{formatRupiah(summary.todayRevenue)}</strong>
        </div>
        <div className="stat-card">
          <span>{isOwner ? 'Transaksi Hari Ini' : 'Transaksi Saya Hari Ini'}</span>
          <strong>{summary.todayCount} nota</strong>
        </div>
        {isOwner && (
          <>
            <div className="stat-card">
              <span>Estimasi Laba Kotor</span>
              <strong>{formatRupiah(summary.todayProfit)}</strong>
            </div>
            <div className="stat-card">
              <span>Stok Menipis</span>
              <strong>{summary.lowStockCount} produk</strong>
            </div>
          </>
        )}
      </div>

      <section className="card">
        <div className="section-header">
          <div className="mode-toggle">
            <button
              type="button"
              className={`chip ${activeSubTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setSubTab('transactions')}
            >
              {isOwner ? 'Riwayat Transaksi' : 'Riwayat Transaksi Saya'}
            </button>
            {isOwner && (
              <button
                type="button"
                className={`chip ${activeSubTab === 'stock_logs' ? 'active' : ''}`}
                onClick={() => setSubTab('stock_logs')}
              >
                Riwayat Mutasi Stok
              </button>
            )}
            {!isOwner && activeShift && (
              <button
                type="button"
                className={`chip ${onlyActiveShift ? 'active' : ''}`}
                onClick={() => setOnlyActiveShift((prev) => !prev)}
              >
                {onlyActiveShift ? 'Filter: Shift Aktif' : 'Filter: Semua Shift Saya'}
              </button>
            )}
          </div>
          <button type="button" className="btn btn-outline" onClick={handleRefresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted-text">Memuat laporan...</p>
        ) : activeSubTab === 'transactions' ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Waktu</th>
                  {isOwner && <th>Kasir</th>}
                  <th>Metode</th>
                  <th>Total</th>
                  <th>Digital Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 6 : 5} className="text-center muted-text">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <code>{tx.invoice_number}</code>
                      </td>
                      <td>{formatDateTime(tx.created_at)}</td>
                      {isOwner && <td>{tx.cashier?.full_name || 'Kasir'}</td>}
                      <td>
                        <span className="badge">{tx.payment_method.toUpperCase()}</span>
                      </td>
                      <td>
                        <strong>{formatRupiah(tx.total_amount)}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            onOpenReceipt({
                              transaction: {
                                ...tx,
                                cashier_name:
                                  tx.cashier?.full_name || profile?.full_name || 'Kasir',
                              },
                              items: tx.transaction_items || [],
                            })
                          }
                        >
                          <Receipt size={14} /> Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Produk</th>
                  <th>Tipe</th>
                  <th>Perubahan</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center muted-text">
                      Belum ada riwayat perubahan stok.
                    </td>
                  </tr>
                ) : (
                  stockLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td>
                        <strong>{log.products?.name || '-'}</strong>{' '}
                        <span className="muted-text">({log.products?.barcode || '-'})</span>
                      </td>
                      <td>
                        <span className="badge">{log.type}</span>
                      </td>
                      <td>
                        <strong className={log.qty < 0 ? 'text-danger' : 'text-success'}>
                          {log.qty > 0 ? `+${log.qty}` : log.qty}
                        </strong>
                      </td>
                      <td>{log.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
