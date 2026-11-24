import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Lock,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../supabaseClient';
import { formatDateTime, formatRupiah } from '../utils/format';

const PETTY_CATEGORIES = [
  'OPERASIONAL',
  'KEMBALIAN',
  'BELANJA_DARURAT',
  'SETOR_BANK',
  'LAINNYA',
];

async function fetchShiftDetails(shiftId) {
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
    pettyLogs: pettyData || [],
  };
}

export default function ShiftManager({ onShiftOpened }) {
  const { user, profile, activeShift, refreshShift } = useAuth();
  const [openingCash, setOpeningCash] = useState('0');
  const [cashSales, setCashSales] = useState(0);
  const [pettyLogs, setPettyLogs] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Petty cash form
  const [pettyType, setPettyType] = useState('OUT');
  const [pettyAmount, setPettyAmount] = useState('');
  const [pettyCategory, setPettyCategory] = useState('OPERASIONAL');
  const [pettyDesc, setPettyDesc] = useState('');

  // Close shift form
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
      setFeedback({ type: 'error', text: `Gagal memuat detail shift: ${err.message}` });
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
        setFeedback({ type: 'error', text: `Gagal memuat detail shift: ${err.message}` });
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

  async function handleOpenShift(e) {
    e.preventDefault();
    setFeedback(null);
    const amount = Number(openingCash);
    if (Number.isNaN(amount) || amount < 0) {
      setFeedback({ type: 'error', text: 'Modal awal laci harus >= 0.' });
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

      await refreshShift();
      setOpeningCash('0');
      setFeedback({ type: 'success', text: 'Shift berhasil dibuka! Anda siap melayani transaksi.' });
      if (onShiftOpened) onShiftOpened();
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal membuka shift: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPettyCash(e) {
    e.preventDefault();
    setFeedback(null);
    const amount = Number(pettyAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', text: 'Nominal kas harus lebih dari 0.' });
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
        text: `Petty cash (${pettyType}) sebesar ${formatRupiah(amount)} tercatat.`,
      });
      await loadDetails();
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal mencatat petty cash: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseShift(e) {
    e.preventDefault();
    setFeedback(null);

    if (!hasActualInput || Number.isNaN(numericActual) || numericActual < 0) {
      setFeedback({ type: 'error', text: 'Uang fisik aktual harus diisi (>= 0).' });
      return;
    }

    if (discrepancy !== 0 && !closeNotes.trim()) {
      setFeedback({
        type: 'error',
        text: 'Catatan selisih wajib diisi karena uang fisik berbeda dengan estimasi sistem.',
      });
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

      setActualCash('');
      setCloseNotes('');
      await refreshShift();
      const diffText =
        Number(closedShift?.discrepancy || 0) === 0
          ? 'Sesuai (Selisih Rp0)'
          : `Selisih ${formatRupiah(closedShift.discrepancy)}`;
      setFeedback({
        type: 'success',
        text: `Shift berhasil ditutup. ${diffText}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal menutup shift: ${err.message}` });
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
          <div className="section-header">
            <div>
              <h2>
                <Clock size={20} /> Buka Shift Kasir
              </h2>
              <p className="muted-text">
                Kasir: <strong>{profile?.full_name}</strong> — Masukkan modal awal uang tunai di laci sebelum memulai transaksi.
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="shift-open-form">
            <label>
              Modal Awal Laci (Rp)
              <input
                type="number"
                min="0"
                step="100"
                className="input"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="Contoh: 200000"
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <PlayCircle size={18} />
              <span>{submitting ? 'Membuka Shift...' : 'Buka Shift Sekarang'}</span>
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="section-header">
            <div>
              <h2 style={{ margin: 0 }}>
                Shift Aktif • <span className="status-pill status-open">OPEN</span>
              </h2>
              <p className="muted-text">
                Dibuka sejak {formatDateTime(activeShift.opened_at)} oleh{' '}
                <strong>{profile?.full_name}</strong>
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={loadDetails}
              disabled={loadingDetails}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Modal Awal Laci</span>
              <strong>{formatRupiah(summary.opening)}</strong>
            </div>
            <div className="stat-card">
              <span>Penjualan Tunai Shift</span>
              <strong>{formatRupiah(cashSales)}</strong>
            </div>
            <div className="stat-card">
              <span>Petty Cash Masuk (IN)</span>
              <strong className="text-success">+{formatRupiah(summary.pettyIn)}</strong>
            </div>
            <div className="stat-card">
              <span>Petty Cash Keluar (OUT)</span>
              <strong className="text-danger">-{formatRupiah(summary.pettyOut)}</strong>
            </div>
            <div className="stat-card stat-card-highlight">
              <span>Estimasi Uang di Laci</span>
              <strong>{formatRupiah(summary.expectedCash)}</strong>
            </div>
          </div>

          <div className="shift-grid">
            <section className="card">
              <h2>Catat Petty Cash (Kas Masuk / Keluar)</h2>
              <form onSubmit={handleAddPettyCash} className="shift-form">
                <div className="mode-toggle">
                  <button
                    type="button"
                    className={`chip ${pettyType === 'IN' ? 'active' : ''}`}
                    onClick={() => setPettyType('IN')}
                  >
                    <ArrowDownCircle size={14} /> Kas Masuk (IN)
                  </button>
                  <button
                    type="button"
                    className={`chip ${pettyType === 'OUT' ? 'active-danger' : ''}`}
                    onClick={() => setPettyType('OUT')}
                  >
                    <ArrowUpCircle size={14} /> Kas Keluar (OUT)
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Nominal (Rp)
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={pettyAmount}
                      onChange={(e) => setPettyAmount(e.target.value)}
                      placeholder="Contoh: 25000"
                      required
                    />
                  </label>
                  <label>
                    Kategori
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
                  Keterangan
                  <input
                    type="text"
                    className="input"
                    value={pettyDesc}
                    onChange={(e) => setPettyDesc(e.target.value)}
                    placeholder="Contoh: Beli plastik kresek / tambah uang receh"
                  />
                </label>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Simpan Petty Cash
                </button>
              </form>
            </section>

            <section className="card">
              <h2>
                <Lock size={18} /> Tutup Shift (Rekonsiliasi Laci)
              </h2>
              <form onSubmit={handleCloseShift} className="shift-form">
                <label>
                  Uang Fisik Aktual di Laci (Rp)
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="Hitung total uang tunai fisik..."
                    required
                  />
                </label>

                {hasActualInput && !Number.isNaN(numericActual) && (
                  <div
                    className={`alert ${
                      discrepancy === 0 ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    Selisih Laci:{' '}
                    <strong>
                      {discrepancy > 0
                        ? `+${formatRupiah(discrepancy)} (Lebih)`
                        : discrepancy < 0
                          ? `${formatRupiah(discrepancy)} (Kurang)`
                          : 'Rp0 (Pas / Sesuai)'}
                    </strong>
                  </div>
                )}

                <label>
                  Catatan Penutupan {discrepancy !== 0 ? '(Wajib diisi jika ada selisih)' : '(Opsional)'}
                  <textarea
                    rows="2"
                    className="input"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Jelaskan jika ada selisih atau catatan serah terima..."
                    required={discrepancy !== 0}
                  />
                </label>

                <button type="submit" className="btn btn-danger btn-lg" disabled={submitting}>
                  <Lock size={17} />
                  <span>{submitting ? 'Menutup Shift...' : 'Tutup Shift Sekarang'}</span>
                </button>
              </form>
            </section>
          </div>

          <section className="card">
            <h2>Riwayat Petty Cash Shift Ini</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Tipe</th>
                    <th>Kategori</th>
                    <th>Keterangan</th>
                    <th>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center muted-text">
                        Belum ada catatan petty cash pada shift ini.
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
