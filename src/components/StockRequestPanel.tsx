'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { PackagePlus, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type { FeedbackMessage, Product, StockRequest, StockRequestStatus } from '../types/pos';
import { formatDateTime } from '../utils/format';

function statusBadgeClass(status: string): string {
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

export interface StockRequestPanelProps {
  products?: Product[];
}

export default function StockRequestPanel({ products = [] }: StockRequestPanelProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const { dict } = useThemeLang();
  const t = dict.stockReq;

  const [itemMode, setItemMode] = useState<'existing' | 'custom'>('existing');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customName, setCustomName] = useState('');
  const [requestedQty, setRequestedQty] = useState('10');
  const [note, setNote] = useState('');

  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aLow = a.stock <= a.min_stock ? 0 : 1;
      const bLow = b.stock <= b.min_stock ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  const fetchMyRequests = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_requests')
      .select('*')
      .eq('requested_by', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setFeedback({ type: 'error', text: error.message });
    } else {
      setRequests((data as StockRequest[]) || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;
    let cancelled = false;

    client
      .from('stock_requests')
      .select('*')
      .eq('requested_by', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setFeedback({ type: 'error', text: error.message });
        } else {
          setRequests((data as StockRequest[]) || []);
        }
        setLoading(false);
      });

    const channel = client
      .channel(`kasir-stock-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_requests',
          filter: `requested_by=eq.${userId}`,
        },
        () => {
          fetchMyRequests();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [fetchMyRequests, userId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user) return;
    setFeedback(null);

    const qty = Number(requestedQty);
    if (Number.isNaN(qty) || qty < 1) {
      setFeedback({ type: 'error', text: t.errQty });
      return;
    }

    let productId: string | null = null;
    let productName = '';

    if (itemMode === 'existing') {
      if (!selectedProductId) {
        setFeedback({ type: 'error', text: t.errSelectProduct });
        return;
      }
      const found = products.find((p) => String(p.id) === String(selectedProductId));
      if (!found) {
        setFeedback({ type: 'error', text: t.errSelectProduct });
        return;
      }
      productId = found.id;
      productName = found.name;
    } else {
      if (!customName.trim()) {
        setFeedback({ type: 'error', text: t.errCustomName });
        return;
      }
      productName = customName.trim();
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('stock_requests').insert({
        requested_by: user.id,
        product_id: productId,
        product_name: productName,
        requested_qty: qty,
        note: note.trim() || null,
        status: 'PENDING',
      });
      if (error) throw error;

      setSelectedProductId('');
      setCustomName('');
      setRequestedQty('10');
      setNote('');
      setFeedback({ type: 'success', text: t.msgSent });
      await fetchMyRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inventory-layout">
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <section className="card">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>
              <PackagePlus size={18} /> {t.title}
            </h2>
            <p className="muted-text" style={{ marginTop: '4px' }}>
              {t.subtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="mode-toggle" style={{ marginBottom: '4px' }}>
            <button
              type="button"
              className={`chip ${itemMode === 'existing' ? 'active' : ''}`}
              onClick={() => setItemMode('existing')}
            >
              {t.modeExisting}
            </button>
            <button
              type="button"
              className={`chip ${itemMode === 'custom' ? 'active' : ''}`}
              onClick={() => setItemMode('custom')}
            >
              {t.modeCustom}
            </button>
          </div>

          <div className="form-grid">
            {itemMode === 'existing' ? (
              <label>
                {t.productLabel}
                <select
                  className="input"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">{t.productPlaceholder}</option>
                  {sortedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({t.stockLeft}: {p.stock})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                {t.customNameLabel}
                <input
                  type="text"
                  className="input"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t.customNamePlaceholder}
                  required
                />
              </label>
            )}

            <label>
              {t.qtyLabel}
              <input
                type="number"
                min="1"
                className="input"
                value={requestedQty}
                onChange={(e) => setRequestedQty(e.target.value)}
                required
              />
            </label>

            <label>
              {t.noteLabel}
              <input
                type="text"
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? t.submittingBtn : t.submitBtn}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>{t.listTitle}</h2>
            <span className="live-pill">
              <span className="live-dot" /> {t.realtimeTag}
            </span>
          </div>
          <button type="button" className="btn btn-outline" onClick={fetchMyRequests} disabled={loading}>
            <RefreshCw size={15} /> {dict.refresh}
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.colItem}</th>
                <th>{t.colQty}</th>
                <th>{t.colNote}</th>
                <th>{t.colStatus}</th>
                <th>{t.colTime}</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center muted-text">
                    {t.noRequests}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.product_name}</strong>
                    </td>
                    <td>
                      <code>{req.requested_qty}</code>
                    </td>
                    <td>{req.note || '-'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(req.status)}`}>
                        {t.status[req.status as StockRequestStatus] || req.status}
                      </span>
                    </td>
                    <td>{formatDateTime(req.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
