import { useCallback, useEffect, useState } from 'react';
import { Lock, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../supabaseClient';
import { formatDateTime, formatRupiah } from '../utils/format';

async function fetchAllShifts() {
  const { data, error } = await supabase
    .from('shifts')
    .select('*, cashier:profiles!shifts_cashier_id_fkey(full_name)')
    .order('opened_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export default function OwnerShifts() {
  const { refreshShift } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [forceShift, setForceShift] = useState(null);
  const [actualCash, setActualCash] = useState('0');
  const [notes, setNotes] = useState('Force close oleh Owner');
  const [submitting, setSubmitting] = useState(false);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllShifts();
      setShifts(data);
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal memuat rekap shift: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllShifts()
      .then((data) => {
        if (cancelled) return;
        setShifts(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setFeedback({ type: 'error', text: `Gagal memuat rekap shift: ${err.message}` });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleForceClose(e) {
    e.preventDefault();
    if (!forceShift) return;
    setFeedback(null);

    const numericActual = Number(actualCash);
    if (actualCash === '' || Number.isNaN(numericActual) || numericActual < 0) {
      setFeedback({ type: 'error', text: 'Nominal uang aktual harus >= 0.' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('close_shift', {
        p_shift_id: forceShift.id,
        p_actual_cash: numericActual,
        p_notes: notes.trim() || 'Force close oleh Owner',
      });
      if (error) throw error;

      setForceShift(null);
      setActualCash('0');
      setNotes('Force close oleh Owner');
      setFeedback({ type: 'success', text: 'Shift berhasil ditutup paksa oleh Owner.' });
      await Promise.all([loadShifts(), refreshShift()]);
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal menutup shift: ${err.message}` });
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
            <h2 style={{ margin: 0 }}>Rekap Shift Semua Kasir</h2>
            <p className="muted-text">
              Pantau modal awal, estimasi kas laci, uang fisik aktual, dan selisih shift.
            </p>
          </div>
          <button type="button" className="btn btn-outline" onClick={loadShifts} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted-text">Memuat data shift...</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kasir</th>
                  <th>Status</th>
                  <th>Buka / Tutup</th>
                  <th>Modal Awal</th>
                  <th>Estimasi Kas</th>
                  <th>Aktual Kas</th>
                  <th>Selisih</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center muted-text">
                      Belum ada riwayat shift.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => {
                    const diff = s.discrepancy != null ? Number(s.discrepancy) : null;
                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.cashier?.full_name || 'Kasir'}</strong>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              s.status === 'OPEN' ? 'status-open' : 'status-closed'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <div>{formatDateTime(s.opened_at)}</div>
                          {s.closed_at && (
                            <div className="muted-text">s/d {formatDateTime(s.closed_at)}</div>
                          )}
                        </td>
                        <td>{formatRupiah(s.opening_cash)}</td>
                        <td>{s.expected_cash != null ? formatRupiah(s.expected_cash) : '-'}</td>
                        <td>{s.actual_cash != null ? formatRupiah(s.actual_cash) : '-'}</td>
                        <td>
                          {diff == null ? (
                            '-'
                          ) : (
                            <strong
                              className={
                                diff === 0
                                  ? 'text-success'
                                  : diff < 0
                                    ? 'text-danger'
                                    : ''
                              }
                            >
                              {diff > 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                            </strong>
                          )}
                        </td>
                        <td>{s.notes || '-'}</td>
                        <td>
                          {s.status === 'OPEN' ? (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setForceShift(s);
                                setActualCash(String(s.opening_cash || 0));
                                setNotes('Force close oleh Owner');
                              }}
                            >
                              <Lock size={13} /> Force Close
                            </button>
                          ) : (
                            <span className="muted-text">Selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {forceShift && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Force Close Shift</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setForceShift(null)}
                aria-label="Tutup modal"
              >
                <X size={16} />
              </button>
            </div>
            <p className="muted-text">
              Kasir: <strong>{forceShift.cashier?.full_name || 'Kasir'}</strong> • Modal Awal:{' '}
              <strong>{formatRupiah(forceShift.opening_cash)}</strong>
            </p>
            <form onSubmit={handleForceClose} className="shift-form">
              <label>
                Uang Fisik Aktual (Rp)
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  required
                />
              </label>
              <label>
                Catatan Force Close
                <textarea
                  rows="2"
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setForceShift(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  <Lock size={15} />
                  <span>{submitting ? 'Menutup...' : 'Konfirmasi Force Close'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
