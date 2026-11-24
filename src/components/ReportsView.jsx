import { useCallback, useEffect, useMemo, useState } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatDateTime, formatRupiah } from '../utils/format';

function getStartOfTodayIso() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

async function queryReportsData() {
  const startOfTodayIso = getStartOfTodayIso();
  const [{ data: txData }, { data: todayTxData }, { data: logData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('transactions')
      .select('total_amount, transaction_items(product_id, price, qty)')
      .gte('created_at', startOfTodayIso),
    supabase
      .from('stock_logs')
      .select('*, products(name, barcode)')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    transactions: txData || [],
    todayTransactions: todayTxData || [],
    stockLogs: logData || [],
  };
}

export default function ReportsView({ products, onOpenReceipt }) {
  const [transactions, setTransactions] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [subTab, setSubTab] = useState('transactions');
  const [loading, setLoading] = useState(true);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await queryReportsData();
    setTransactions(result.transactions);
    setTodayTransactions(result.todayTransactions);
    setStockLogs(result.stockLogs);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queryReportsData().then((result) => {
      if (cancelled) return;
      setTransactions(result.transactions);
      setTodayTransactions(result.todayTransactions);
      setStockLogs(result.stockLogs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const todayRevenue = todayTransactions.reduce(
      (s, t) => s + Number(t.total_amount),
      0
    );

    const buyPriceMap = new Map(products.map((p) => [p.id, Number(p.buy_price) || 0]));
    let todayProfit = 0;
    for (const tx of todayTransactions) {
      for (const item of tx.transaction_items || []) {
        const buyPrice = buyPriceMap.get(item.product_id) ?? 0;
        todayProfit += (Number(item.price) - buyPrice) * item.qty;
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

  return (
    <div className="reports-layout">
      <div className="stats-grid">
        <div className="stat-card">
          <span>Omzet Hari Ini</span>
          <strong>{formatRupiah(summary.todayRevenue)}</strong>
        </div>
        <div className="stat-card">
          <span>Transaksi Hari Ini</span>
          <strong>{summary.todayCount} nota</strong>
        </div>
        <div className="stat-card">
          <span>Estimasi Laba Kotor</span>
          <strong>{formatRupiah(summary.todayProfit)}</strong>
        </div>
        <div className="stat-card">
          <span>Stok Menipis</span>
          <strong>{summary.lowStockCount} produk</strong>
        </div>
      </div>

      <section className="card">
        <div className="section-header">
          <div className="mode-toggle">
            <button
              type="button"
              className={`chip ${subTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setSubTab('transactions')}
            >
              Riwayat Transaksi
            </button>
            <button
              type="button"
              className={`chip ${subTab === 'stock_logs' ? 'active' : ''}`}
              onClick={() => setSubTab('stock_logs')}
            >
              Riwayat Mutasi Stok
            </button>
          </div>
          <button type="button" className="btn btn-outline" onClick={handleRefresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted-text">Memuat laporan...</p>
        ) : subTab === 'transactions' ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Waktu</th>
                  <th>Metode</th>
                  <th>Total</th>
                  <th>Digital Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center muted-text">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td><code>{tx.invoice_number}</code></td>
                      <td>{formatDateTime(tx.created_at)}</td>
                      <td><span className="badge">{tx.payment_method.toUpperCase()}</span></td>
                      <td><strong>{formatRupiah(tx.total_amount)}</strong></td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            onOpenReceipt({
                              transaction: tx,
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
                    <td colSpan="5" className="text-center muted-text">
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
                      <td><span className="badge">{log.type}</span></td>
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
