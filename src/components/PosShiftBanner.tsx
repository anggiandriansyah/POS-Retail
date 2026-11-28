'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type { FeedbackMessage, PettyCashLog } from '../types/pos';
import { formatClockTime, formatErrorMessage, formatRupiah } from '../utils/format';
import { computeShiftSummary, fetchShiftDetails } from '../utils/shiftHelpers';

export interface PosShiftBannerProps {
  onGoToShift?: () => void;
  onFeedback?: (msg: FeedbackMessage) => void;
}

export default function PosShiftBanner({ onGoToShift, onFeedback }: PosShiftBannerProps) {
  const { user, activeShift, refreshShift } = useAuth();
  const { dict } = useThemeLang();
  const pDict = dict.pos;
  const sDict = dict.shift;

  // Open shift modal state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('0');
  const [openError, setOpenError] = useState('');
  const [submittingOpen, setSubmittingOpen] = useState(false);

  // Close shift modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [loadingCloseDetails, setLoadingCloseDetails] = useState(false);
  const [cashSales, setCashSales] = useState(0);
  const [pettyLogs, setPettyLogs] = useState<PettyCashLog[]>([]);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeError, setCloseError] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

  useEffect(() => {
    if (!showOpenModal && !showCloseModal) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showOpenModal && !submittingOpen) setShowOpenModal(false);
        if (showCloseModal && !submittingClose) setShowCloseModal(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showOpenModal, showCloseModal, submittingOpen, submittingClose]);

  const summary = useMemo(
    () => computeShiftSummary(activeShift, cashSales, pettyLogs),
    [activeShift, cashSales, pettyLogs]
  );

  const hasActualInput = actualCash !== '';
  const sanitizedActualStr = String(actualCash).trim().replace(/\./g, '').replace(/,/g, '.');
  const numericActual = hasActualInput ? Number(sanitizedActualStr) : NaN;
  const discrepancy =
    hasActualInput && Number.isFinite(numericActual) && !Number.isNaN(numericActual)
      ? numericActual - summary.expectedCash
      : 0;

  async function openCloseShiftModal() {
    if (!activeShift) return;
    setCloseError('');
    setActualCash('');
    setCloseNotes('');
    setShowCloseModal(true);
    setLoadingCloseDetails(true);
    try {
      const result = await fetchShiftDetails(supabase, activeShift.id);
      setCashSales(result.cashSales);
      setPettyLogs(result.pettyLogs);
    } catch (err) {
      setCloseError(formatErrorMessage(err));
    } finally {
      setLoadingCloseDetails(false);
    }
  }

  async function handleOpenShiftSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user) return;
    setOpenError('');

    const rawSanitized = String(openingCash).trim().replace(/\./g, '').replace(/,/g, '.');
    const amount = Number(rawSanitized);
    if (!Number.isFinite(amount) || Number.isNaN(amount) || amount < 0) {
      setOpenError(sDict.errOpeningCash);
      return;
    }

    setSubmittingOpen(true);
    try {
      const { error } = await supabase.from('shifts').insert({
        cashier_id: user.id,
        status: 'OPEN',
        opening_cash: amount,
      });
      if (error) throw error;

      await refreshShift();
      setOpeningCash('0');
      setShowOpenModal(false);
      onFeedback?.({ type: 'success', text: sDict.msgShiftOpened });
    } catch (err) {
      setOpenError(formatErrorMessage(err));
    } finally {
      setSubmittingOpen(false);
    }
  }

  async function handleCloseShiftSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !activeShift) return;
    setCloseError('');

    if (
      !hasActualInput ||
      !Number.isFinite(numericActual) ||
      Number.isNaN(numericActual) ||
      numericActual < 0
    ) {
      setCloseError(sDict.errActualCash);
      return;
    }

    if (discrepancy !== 0 && !closeNotes.trim()) {
      setCloseError(sDict.errDiscrepancyNotes);
      return;
    }

    setSubmittingClose(true);
    try {
      const { data: closedShift, error } = await supabase.rpc('close_shift', {
        p_shift_id: activeShift.id,
        p_actual_cash: numericActual,
        p_notes: closeNotes.trim() || null,
      });
      if (error) throw error;

      const typedClosed = closedShift as { discrepancy?: number } | null;
      await refreshShift();
      setShowCloseModal(false);
      setActualCash('');
      setCloseNotes('');
      const diffVal = Number(typedClosed?.discrepancy || 0);
      const diffText =
        diffVal === 0 ? sDict.exactLabel : `${sDict.discrepancyLabel}: ${formatRupiah(diffVal)}`;
      onFeedback?.({
        type: 'success',
        text: `${sDict.msgShiftClosed} ${diffText}.`,
      });
    } catch (err) {
      setCloseError(formatErrorMessage(err));
    } finally {
      setSubmittingClose(false);
    }
  }

  return (
    <>
      {!activeShift ? (
        <div className="shift-warning-banner" data-shift-status="closed">
          <div className="shift-warning-text">
            <AlertTriangle size={20} aria-hidden="true" />
            <div>
              <strong>{pDict.shiftWarningTitle}</strong>
              <p className="muted-text" style={{ margin: 0 }}>
                {pDict.shiftWarningDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary pos-shift-action-btn"
            onClick={() => {
              setOpenError('');
              setOpeningCash('0');
              setShowOpenModal(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>{pDict.openShiftBtn}</span>
          </button>
        </div>
      ) : (
        <div className="shift-active-banner" data-shift-status="open">
          <div className="shift-active-info">
            <CheckCircle2 size={20} aria-hidden="true" />
            <div className="shift-active-meta">
              <strong>{pDict.shiftActiveBadge}</strong>
              <span>
                {pDict.openingCashShort}: <strong>{formatRupiah(activeShift.opening_cash)}</strong>
              </span>
              <span>
                {pDict.openedAtShort}: <strong>{formatClockTime(activeShift.opened_at)}</strong>
              </span>
            </div>
          </div>

          <div className="shift-active-actions">
            {onGoToShift && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onGoToShift}
              >
                <Clock size={14} aria-hidden="true" />
                <span>{pDict.pettyDetailBtn}</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger btn-sm pos-shift-action-btn"
              onClick={openCloseShiftModal}
            >
              <Lock size={14} aria-hidden="true" />
              <span>{pDict.closeShiftBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-open-shift-title"
          onClick={() => {
            if (!submittingOpen) setShowOpenModal(false);
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="pos-open-shift-title" style={{ margin: 0 }}>
                {pDict.openShiftModalTitle}
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowOpenModal(false)}
                disabled={submittingOpen}
                aria-label={dict.common.closeBtn}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <p className="muted-text" style={{ marginTop: 0 }}>
              {sDict.openDesc}
            </p>

            {openError && (
              <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                {openError}
              </div>
            )}

            <form onSubmit={handleOpenShiftSubmit} className="shift-form">
              <label>
                {sDict.openingCashLabel}
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="input"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder={sDict.openingCashPlaceholder}
                  required
                  autoFocus
                />
              </label>
              <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowOpenModal(false)}
                  disabled={submittingOpen}
                >
                  {dict.cancel}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingOpen}>
                  <PlayCircle size={16} aria-hidden="true" />
                  <span>{submittingOpen ? sDict.openingBtn : sDict.openBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Reconciliation Modal */}
      {showCloseModal && activeShift && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-close-shift-title"
          onClick={() => {
            if (!submittingClose) setShowCloseModal(false);
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="pos-close-shift-title" style={{ margin: 0 }}>
                {pDict.closeShiftModalTitle}
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCloseModal(false)}
                disabled={submittingClose}
                aria-label={dict.common.closeBtn}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {loadingCloseDetails ? (
              <p className="muted-text">{pDict.loadingShiftDetails}</p>
            ) : (
              <div className="pos-shift-summary-grid">
                <div className="pos-shift-summary-row">
                  <span className="muted-text">{sDict.openingStat}</span>
                  <span>{formatRupiah(summary.opening)}</span>
                </div>
                <div className="pos-shift-summary-row">
                  <span className="muted-text">{sDict.cashSalesStat}</span>
                  <span>{formatRupiah(cashSales)}</span>
                </div>
                <div className="pos-shift-summary-row">
                  <span className="muted-text">{sDict.pettyInStat}</span>
                  <span className="text-success">+{formatRupiah(summary.pettyIn)}</span>
                </div>
                <div className="pos-shift-summary-row">
                  <span className="muted-text">{sDict.pettyOutStat}</span>
                  <span className="text-danger">-{formatRupiah(summary.pettyOut)}</span>
                </div>
                <div className="pos-shift-summary-row pos-shift-summary-total">
                  <span>{sDict.expectedCashStat}</span>
                  <strong>{formatRupiah(summary.expectedCash)}</strong>
                </div>
              </div>
            )}

            {closeError && (
              <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                {closeError}
              </div>
            )}

            <form onSubmit={handleCloseShiftSubmit} className="shift-form">
              <label>
                {sDict.actualCashLabel}
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder={sDict.actualCashPlaceholder}
                  required
                  autoFocus
                />
              </label>

              {hasActualInput && !Number.isNaN(numericActual) && (
                <div className={`alert ${discrepancy === 0 ? 'alert-success' : 'alert-error'}`}>
                  {sDict.discrepancyLabel}:{' '}
                  <strong>
                    {discrepancy > 0
                      ? `+${formatRupiah(discrepancy)} (${sDict.overLabel})`
                      : discrepancy < 0
                        ? `${formatRupiah(discrepancy)} (${sDict.shortLabel})`
                        : sDict.exactLabel}
                  </strong>
                </div>
              )}

              <label>
                {sDict.notesLabel}{' '}
                {discrepancy !== 0 ? sDict.notesRequiredHint : sDict.notesOptionalHint}
                <textarea
                  rows={2}
                  className="input"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={sDict.notesPlaceholder}
                  required={discrepancy !== 0}
                />
              </label>

              <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCloseModal(false)}
                  disabled={submittingClose}
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingClose || loadingCloseDetails}
                >
                  <Lock size={15} aria-hidden="true" />
                  <span>{submittingClose ? sDict.closingBtn : sDict.closeBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
