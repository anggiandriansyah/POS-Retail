'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  PackageCheck,
  Radio,
  Receipt,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type {
  FeedbackMessage,
  Product,
  Profile,
  Shift,
  StockRequest,
  StockRequestStatus,
  Transaction,
} from '../types/pos';
import { formatClockTime, formatDateTime, formatRupiah } from '../utils/format';

function requestBadgeClass(status: string): string {
  switch (status) {
    case 'RESTOCKED':
      return 'badge-success';
    case 'APPROVED':
      return 'badge-info';
    case 'REJECTED':
      return 'badge-danger';
    default:
      return 'badge-warning';
  }
}

interface LiveSnapshot {
  openShifts: Shift[];
  recentTransactions: Transaction[];
  products: Product[];
  stockRequests: StockRequest[];
  profiles: Profile[];
}

async function fetchLiveSnapshot(): Promise<LiveSnapshot> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const [
    { data: shiftsData, error: shiftsErr },
    { data: txData, error: txErr },
    { data: productsData, error: prodErr },
    { data: reqData, error: reqErr },
    { data: profilesData, error: profErr },
  ] = await Promise.all([
    supabase
      .from('shifts')
      .select('*')
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('products').select('*').order('stock', { ascending: true }),
    supabase
      .from('stock_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, full_name, username, role'),
  ]);

  if (shiftsErr) throw shiftsErr;
  if (txErr) throw txErr;
  if (prodErr) throw prodErr;
  if (reqErr) throw reqErr;
  if (profErr) throw profErr;

  return {
    openShifts: (shiftsData as Shift[]) || [],
    recentTransactions: (txData as Transaction[]) || [],
    products: (productsData as Product[]) || [],
    stockRequests: (reqData as StockRequest[]) || [],
    profiles: (profilesData as Profile[]) || [],
  };
}

export interface OwnerLiveMonitorProps {
  onProductsChanged?: () => Promise<void>;
}

export default function OwnerLiveMonitor({ onProductsChanged }: OwnerLiveMonitorProps) {
  const { dict } = useThemeLang();
  const t = dict.liveMonitor;
  const reqStatusLabels = dict.stockReq.status;

  const [openShifts, setOpenShifts] = useState<Shift[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!supabase) return;
    try {
      const snap = await fetchLiveSnapshot();
      setOpenShifts(snap.openShifts);
      setRecentTransactions(snap.recentTransactions);
      setProducts(snap.products);
      setStockRequests(snap.stockRequests);
      setProfiles(snap.profiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    fetchLiveSnapshot()
      .then((snap) => {
        if (cancelled) return;
        setOpenShifts(snap.openShifts);
        setRecentTransactions(snap.recentTransactions);
        setProducts(snap.products);
        setStockRequests(snap.stockRequests);
        setProfiles(snap.profiles);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setFeedback({ type: 'error', text: message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const channel = client
      .channel('owner-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => loadSnapshot()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadSnapshot();
          if (onProductsChanged) onProductsChanged();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        () => loadSnapshot()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_requests' },
        () => loadSnapshot()
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [loadSnapshot, onProductsChanged]);

  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    for (const p of profiles) {
      map[p.id] = p;
    }
    return map;
  }, [profiles]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stock) <= Number(p.min_stock));
  }, [products]);

  const pendingRequestCount = useMemo(() => {
    return stockRequests.filter((r) => r.status === 'PENDING').length;
  }, [stockRequests]);

  async function handleRestock(req: StockRequest) {
    if (!supabase) return;
    setFeedback(null);
    setBusyId(req.id);
    try {
      if (req.product_id) {
        const { data: prod, error: fetchErr } = await supabase
          .from('products')
          .select('id, stock')
          .eq('id', req.product_id)
          .single();
        if (fetchErr) throw fetchErr;

        const nextStock = Number((prod as { stock: number }).stock || 0) + Number(req.requested_qty || 0);
        const { error: updateProdErr } = await supabase
          .from('products')
          .update({ stock: nextStock })
          .eq('id', req.product_id);
        if (updateProdErr) throw updateProdErr;
      }

      const { error: reqErr } = await supabase
        .from('stock_requests')
        .update({ status: 'RESTOCKED', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      if (reqErr) throw reqErr;

      setFeedback({ type: 'success', text: t.msgRestocked });
      await loadSnapshot();
      if (onProductsChanged) await onProductsChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateRequestStatus(req: StockRequest, nextStatus: StockRequestStatus) {
    if (!supabase) return;
    setFeedback(null);
    setBusyId(req.id);
    try {
      const { error } = await supabase
        .from('stock_requests')
        .update({ status: nextStatus, resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      if (error) throw error;

      setFeedback({
        type: 'success',
        text: nextStatus === 'APPROVED' ? t.msgApproved : t.msgRejected,
      });
      await loadSnapshot();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="live-monitor-layout">
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>
              <Radio size={20} /> {t.title}
            </h2>
            <span className="live-pill">
              <span className="live-dot" /> {t.liveBadge}
            </span>
          </div>
          <p className="muted-text" style={{ marginTop: '4px' }}>
            {t.subtitle}
          </p>
        </div>

        <button type="button" className="btn btn-outline" onClick={loadSnapshot} disabled={loading}>
          <RefreshCw size={15} /> {dict.refresh}
        </button>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <div className="live-kpi-grid">
        <div className="stat-card">
          <span>{t.activeCashiersTitle}</span>
          <strong>{openShifts.length}</strong>
        </div>
        <div className="stat-card">
          <span>{t.liveSalesTitle}</span>
          <strong>{recentTransactions.length}</strong>
        </div>
        <div className={`stat-card ${lowStockProducts.length > 0 ? 'stat-card-warning' : ''}`}>
          <span>{t.lowStockTitle}</span>
          <strong>{lowStockProducts.length}</strong>
        </div>
        <div className={`stat-card ${pendingRequestCount > 0 ? 'stat-card-highlight' : ''}`}>
          <span>{t.incomingRequestsTitle} (Pending)</span>
          <strong>{pendingRequestCount}</strong>
        </div>
      </div>

      <div className="live-monitor-grid">
        <section className="card">
          <div className="section-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={17} /> {t.activeCashiersTitle}
            </h3>
            <span className="badge badge-success">{openShifts.length}</span>
          </div>
          {openShifts.length === 0 ? (
            <p className="muted-text">{t.noActiveCashiers}</p>
          ) : (
            <div className="live-list">
              {openShifts.map((shift) => {
                const cashier = profileMap[shift.cashier_id];
                return (
                  <div key={shift.id} className="live-list-item">
                    <div>
                      <strong>{cashier?.full_name || 'Kasir'}</strong>
                      {cashier?.username && (
                        <span className="username-tag">@{cashier.username}</span>
                      )}
                      <div className="muted-text" style={{ fontSize: '0.8rem' }}>
                        {t.openedAt}: <code>{formatClockTime(shift.opened_at)}</code> •{' '}
                        {t.openingCash}: {formatRupiah(shift.opening_cash)}
                      </div>
                    </div>
                    <span className="status-pill status-open">{dict.openStatus}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={17} /> {t.lowStockTitle}
            </h3>
            <span className={`badge ${lowStockProducts.length > 0 ? 'badge-danger' : 'badge-success'}`}>
              {lowStockProducts.length}
            </span>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="muted-text">{t.noLowStock}</p>
          ) : (
            <div className="live-list">
              {lowStockProducts.slice(0, 8).map((prod) => {
                const isOut = Number(prod.stock) <= 0;
                return (
                  <div key={prod.id} className="live-list-item">
                    <div>
                      <strong>{prod.name}</strong>
                      <div className="muted-text" style={{ fontSize: '0.8rem' }}>
                        {prod.category || '-'} • {t.minStock}: {prod.min_stock}
                      </div>
                    </div>
                    <span className={`badge ${isOut ? 'badge-danger' : 'badge-warning'}`}>
                      {isOut ? t.outOfStock : `${t.lowStock} (${prod.stock})`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageCheck size={18} /> {t.incomingRequestsTitle}
          </h3>
          {pendingRequestCount > 0 && (
            <span className="badge badge-warning">{pendingRequestCount} PENDING</span>
          )}
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{dict.stockReq.colItem}</th>
                <th>{t.requestedBy}</th>
                <th>{dict.stockReq.colQty}</th>
                <th>{dict.stockReq.colNote}</th>
                <th>{dict.stockReq.colStatus}</th>
                <th>{dict.stockReq.colTime}</th>
                <th>{dict.staff.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {stockRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center muted-text">
                    {t.noIncomingRequests}
                  </td>
                </tr>
              ) : (
                stockRequests.map((req) => {
                  const cashier = profileMap[req.requested_by];
                  const isDone = req.status === 'RESTOCKED' || req.status === 'REJECTED';
                  const isBusy = busyId === req.id;

                  return (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.product_name}</strong>
                        {!req.product_id && (
                          <span className="badge" style={{ marginLeft: '6px' }}>
                            {t.customItemTag}
                          </span>
                        )}
                      </td>
                      <td>
                        <span>{cashier?.full_name || '-'}</span>
                        {cashier?.username && (
                          <span className="username-tag">@{cashier.username}</span>
                        )}
                      </td>
                      <td>
                        <code>+{req.requested_qty}</code>
                      </td>
                      <td>{req.note || '-'}</td>
                      <td>
                        <span className={`badge ${requestBadgeClass(req.status)}`}>
                          {reqStatusLabels[req.status as StockRequestStatus] || req.status}
                        </span>
                      </td>
                      <td>{formatDateTime(req.created_at)}</td>
                      <td>
                        {!isDone && (
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={isBusy}
                              onClick={() => handleRestock(req)}
                            >
                              <PackageCheck size={13} />
                              <span>
                                {t.restockBtn} (+{req.requested_qty})
                              </span>
                            </button>
                            {req.status === 'PENDING' && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={isBusy}
                                onClick={() => handleUpdateRequestStatus(req, 'APPROVED')}
                              >
                                <Check size={13} />
                                <span>{t.approveBtn}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={isBusy}
                              onClick={() => handleUpdateRequestStatus(req, 'REJECTED')}
                            >
                              <X size={13} />
                              <span>{t.rejectBtn}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} /> {t.liveSalesTitle}
          </h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>{t.requestedBy}</th>
                <th>Method</th>
                <th>Total</th>
                <th>{dict.stockReq.colTime}</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center muted-text">
                    {t.noSalesYet}
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const cashier = tx.cashier_id ? profileMap[tx.cashier_id] : undefined;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <code>{tx.invoice_number}</code>
                      </td>
                      <td>{cashier?.full_name || '-'}</td>
                      <td>
                        <span className="badge">{(tx.payment_method || 'CASH').toUpperCase()}</span>
                      </td>
                      <td>
                        <strong className="text-success">{formatRupiah(tx.total_amount)}</strong>
                      </td>
                      <td>{formatDateTime(tx.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
