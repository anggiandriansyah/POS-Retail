'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Lock,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type { FeedbackMessage, PettyCashLog, PettyCashType } from '../types/pos';
import { formatClockTime, formatDateTime, formatRupiah } from '../utils/format';
import DigitalClock from './DigitalClock';

const PETTY_CATEGORIES = [
  'OPERASIONAL',
  'KEMBALIAN',
  'BELANJA_DARURAT',
  'SETOR_BANK',
  'LAINNYA',
] as const;

interface ClosedShiftSummary {
  opened_at: string;
  closed_at: string;
  discrepancy: number;
}

async function fetchShiftDetails(shiftId: string): Promise<{
  cashSales: number;
  pettyLogs: PettyCashLog[];
}> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const [{ data: cashTxData, error: txErr }, { data: pettyData, error: pettyErr }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('total_amount, payment_method')
        .eq('shift_id', shiftId),
      supabase
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

export interface ShiftManagerProps {
  onShiftOpened?: () => void;
}

export default function ShiftManager({ onShiftOpened }: ShiftManagerProps) {
  const { user, profile, activeShift, refreshShift } = useAuth();
  const { dict } = useThemeLang();
  const t = dict.shift;

  const [openingCash, setOpeningCash] = useState('0');
  const [cashSales, setCashSales] = useState(0);
  const [pettyLogs, setPettyLogs] = useState<PettyCashLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [lastClosedShift, setLastClosedShift] = useState<ClosedShiftSummary | null>(null);

  // Petty cash form
  const [pettyType, setPettyType] = useState<PettyCashType>('OUT');
  const [pettyAmount, setPettyAmount] = useState('');
  const [pettyCategory, setPettyCategory] = useState<string>('OPERASIONAL');
  const [pettyDesc, setPettyDesc] = useState('');

  // Close shift form
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const activeShiftId = activeShift?.id || null;

  const loadDetails = useCallback(async () => {
    if (!activeShiftId) {
      setCashSales(0);
      setPettyLogs([]);
      return;
    }
    setLoadingDetails(true);
    try {
      const result = await fetchShiftDetails(activeShiftId);
      setCashSales(result.cashSales);
      setPettyLogs(result.pettyLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setLoadingDetails(false);
    }
  }, [activeShiftId]);

  useEffect(() => {
    if (!activeShiftId) return;
    let cancelled = false;
    fetchShiftDetails(activeShiftId)
      .then((result) => {
        if (cancelled) return;
        setCashSales(result.cashSales);
        setPettyLogs(result.pettyLogs);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setFeedback({ type: 'error', text: message });
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeShiftId]);

  const summary = useMemo(() => {
    const opening = Number(activeShift?.opening_cash || 0);
    const pettyIn = pettyLogs
      .filter((l) => l.type === 'IN')
      .reduce((s, l) => s + Number(l.amount || 0), 0);
    const pettyOut = pettyLogs
      .filter((l) => l.type === 'OUT')
      .reduce((s, l) => s + Number(l.amount || 0), 0);
    const expectedCash = opening + cashSales + pettyIn - pettyOut;
    return { opening, pettyIn, pettyOut, expectedCash };
  }, [activeShift?.opening_cash, cashSales, pettyLogs]);

  const hasActualInput = actualCash !== '';
  const numericActual = hasActualInput ? Number(actualCash) : NaN;
  const discrepancy =
    hasActualInput && !Number.isNaN(numericActual)
      ? numericActual - summary.expectedCash
      : 0;

  async function handleOpenShift(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user) return;
    setFeedback(null);
    const amount = Number(openingCash);
    if (Number.isNaN(amount) || amount < 0) {
      setFeedback({ type: 'error', text: t.errOpeningCash });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('shifts').insert({
        cashier_id: user.id,
        status: 'OPEN',
        opening_cash: amount,
      });
      if (error) throw error;

      setLastClosedShift(null);
      await refreshShift();
      setOpeningCash('0');
      setFeedback({ type: 'success', text: t.msgShiftOpened });
      if (onShiftOpened) onShiftOpened();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPettyCash(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || !activeShift) return;
    setFeedback(null);
    const amount = Number(pettyAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: t.errPettyAmount });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('petty_cash_logs').insert({
        shift_id: activeShift.id,
        cashier_id: user.id,
        type: pettyType,
        amount,
        category: pettyCategory,
        description: pettyDesc.trim() || null,
      });
      if (error) throw error;

      setPettyAmount('');
      setPettyDesc('');
      setFeedback({
        type: 'success',
        text: `Petty cash (${pettyType}) ${formatRupiah(amount)}`,
      });
      await loadDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseShift(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !activeShift) return;
    setFeedback(null);

    if (!hasActualInput || Number.isNaN(numericActual) || numericActual < 0) {
      setFeedback({ type: 'error', text: t.errActualCash });
      return;
    }

    if (discrepancy !== 0 && !closeNotes.trim()) {
      setFeedback({ type: 'error', text: t.errDiscrepancyNotes });
      return;
    }

    setSubmitting(true);
    try {
      const { data: closedShift, error } = await supabase.rpc('close_shift', {
        p_shift_id: activeShift.id,
        p_actual_cash: numericActual,
        p_notes: closeNotes.trim() || null,
      });
      if (error) throw error;

      const typedClosed = closedShift as { closed_at?: string; discrepancy?: number } | null;

      setLastClosedShift({
        opened_at: activeShift.opened_at,
        closed_at: typedClosed?.closed_at || new Date().toISOString(),
        discrepancy: Number(typedClosed?.discrepancy || 0),
      });
      setActualCash('');
      setCloseNotes('');
      await refreshShift();
      const diffText =
        Number(typedClosed?.discrepancy || 0) === 0
          ? t.exactLabel
          : `${t.discrepancyLabel}: ${formatRupiah(typedClosed?.discrepancy || 0)}`;
      setFeedback({
        type: 'success',
        text: `${t.msgShiftClosed} ${diffText}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shift-layout">
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {!activeShift ? (
        <section className="card shift-open-card">
          <div className="shift-clock-banner">
            <DigitalClock label={t.currentTimeLabel} />
          </div>

          {lastClosedShift && (
            <div className="shift-recorded-times">
              <div className="shift-time-chip">
                <span>{t.openedAtLabel}</span>
                <strong>{formatClockTime(lastClosedShift.opened_at)}</strong>
              </div>
              <div className="shift-time-chip">
                <span>{t.closedAtLabel}</span>
                <strong>{formatClockTime(lastClosedShift.closed_at)}</strong>
              </div>
            </div>
          )}

          <div className="section-header">
            <div>
              <h2>
                <Clock size={20} /> {t.openTitle}
              </h2>
              <p className="muted-text">
                {t.cashierLabel}: <strong>{profile?.full_name}</strong> — {t.openDesc}
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="shift-open-form">
            <label>
              {t.openingCashLabel}
              <input
                type="number"
                min="0"
                step="100"
                className="input"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder={t.openingCashPlaceholder}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <PlayCircle size={18} />
              <span>{submitting ? t.openingBtn : t.openBtn}</span>
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>
                {t.activeTitle} • <span className="status-pill status-open">{dict.openStatus}</span>
              </h2>
              <p className="muted-text">
                {t.openedSince} {formatDateTime(activeShift.opened_at)} {t.byLabel}{' '}
                <strong>{profile?.full_name}</strong>
              </p>
            </div>
            <div className="shift-header-right">
              <div className="shift-time-chip">
                <span>{t.openedAtLabel}</span>
                <strong>{formatClockTime(activeShift.opened_at)}</strong>
              </div>
              <DigitalClock compact />
              <button
                type="button"
                className="btn btn-outline"
                onClick={loadDetails}
                disabled={loadingDetails}
              >
                <RefreshCw size={15} /> {dict.refresh}
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>{t.openingStat}</span>
              <strong>{formatRupiah(summary.opening)}</strong>
            </div>
            <div className="stat-card">
              <span>{t.cashSalesStat}</span>
              <strong>{formatRupiah(cashSales)}</strong>
            </div>
            <div className="stat-card">
              <span>{t.pettyInStat}</span>
              <strong className="text-success">+{formatRupiah(summary.pettyIn)}</strong>
            </div>
            <div className="stat-card">
              <span>{t.pettyOutStat}</span>
              <strong className="text-danger">-{formatRupiah(summary.pettyOut)}</strong>
            </div>
            <div className="stat-card stat-card-highlight">
              <span>{t.expectedCashStat}</span>
              <strong>{formatRupiah(summary.expectedCash)}</strong>
            </div>
          </div>

          <div className="shift-grid">
            <section className="card">
              <h2>{t.pettyTitle}</h2>
              <form onSubmit={handleAddPettyCash} className="shift-form">
                <div className="mode-toggle">
                  <button
                    type="button"
                    className={`chip ${pettyType === 'IN' ? 'active' : ''}`}
                    onClick={() => setPettyType('IN')}
                  >
                    <ArrowDownCircle size={14} /> {t.cashIn}
                  </button>
                  <button
                    type="button"
                    className={`chip ${pettyType === 'OUT' ? 'active-danger' : ''}`}
                    onClick={() => setPettyType('OUT')}
                  >
                    <ArrowUpCircle size={14} /> {t.cashOut}
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    {t.amountLabel}
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={pettyAmount}
                      onChange={(e) => setPettyAmount(e.target.value)}
                      placeholder={t.amountPlaceholder}
                      required
                    />
                  </label>
                  <label>
                    {t.categoryLabel}
                    <select
                      className="input"
                      value={pettyCategory}
                      onChange={(e) => setPettyCategory(e.target.value)}
                    >
                      {PETTY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  {t.descriptionLabel}
                  <input
                    type="text"
                    className="input"
                    value={pettyDesc}
                    onChange={(e) => setPettyDesc(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                  />
                </label>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {t.savePettyBtn}
                </button>
              </form>
            </section>

            <section className="card">
              <div className="section-header" style={{ marginBottom: '12px' }}>
                <h2 style={{ margin: 0 }}>
                  <Lock size={18} /> {t.closeTitle}
                </h2>
                <DigitalClock compact />
              </div>

              <div className="shift-recorded-times" style={{ marginBottom: '12px' }}>
                <div className="shift-time-chip">
                  <span>{t.openedAtLabel}</span>
                  <strong>{formatClockTime(activeShift.opened_at)}</strong>
                </div>
                <div className="shift-time-chip">
                  <span>{t.closedAtLabel}</span>
                  <strong>--:--:--</strong>
                </div>
              </div>

              <form onSubmit={handleCloseShift} className="shift-form">
                <label>
                  {t.actualCashLabel}
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder={t.actualCashPlaceholder}
                    required
                  />
                </label>

                {hasActualInput && !Number.isNaN(numericActual) && (
                  <div
                    className={`alert ${
                      discrepancy === 0 ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    {t.discrepancyLabel}:{' '}
                    <strong>
                      {discrepancy > 0
                        ? `+${formatRupiah(discrepancy)} (${t.overLabel})`
                        : discrepancy < 0
                          ? `${formatRupiah(discrepancy)} (${t.shortLabel})`
                          : t.exactLabel}
                    </strong>
                  </div>
                )}

                <label>
                  {t.notesLabel}{' '}
                  {discrepancy !== 0 ? t.notesRequiredHint : t.notesOptionalHint}
                  <textarea
                    rows={2}
                    className="input"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    required={discrepancy !== 0}
                  />
                </label>

                <button type="submit" className="btn btn-danger btn-lg" disabled={submitting}>
                  <Lock size={17} />
                  <span>{submitting ? t.closingBtn : t.closeBtn}</span>
                </button>
              </form>
            </section>
          </div>

          <section className="card">
            <h2>{t.historyTitle}</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.colTime}</th>
                    <th>{t.colType}</th>
                    <th>{t.colCategory}</th>
                    <th>{t.colDesc}</th>
                    <th>{t.colAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center muted-text">
                        {t.noPettyLogs}
                      </td>
                    </tr>
                  ) : (
                    pettyLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.created_at)}</td>
                        <td>
                          <span
                            className={`badge ${
                              log.type === 'IN' ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td>{log.category}</td>
                        <td>{log.description || '-'}</td>
                        <td>
                          <strong
                            className={log.type === 'IN' ? 'text-success' : 'text-danger'}
                          >
                            {log.type === 'IN' ? '+' : '-'}
                            {formatRupiah(log.amount)}
                          </strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
