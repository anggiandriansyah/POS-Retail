import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { createEphemeralSupabaseClient, supabase } from '../supabaseClient';
import { formatDateTime } from '../utils/format';

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default function StaffManager() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal memuat daftar staf: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProfiles()
      .then((data) => {
        if (cancelled) return;
        setProfiles(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setFeedback({ type: 'error', text: `Gagal memuat daftar staf: ${err.message}` });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateCashier(e) {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setFeedback({
        type: 'error',
        text: 'Nama lengkap, email, dan password (min. 6 karakter) wajib diisi.',
      });
      return;
    }

    const ephemeralClient = createEphemeralSupabaseClient();
    if (!ephemeralClient) {
      setFeedback({ type: 'error', text: 'Supabase belum dikonfigurasi.' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await ephemeralClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      if (error) throw error;

      setFullName('');
      setEmail('');
      setPassword('');
      setFeedback({
        type: 'success',
        text: data.session
          ? `Akun kasir "${fullName.trim()}" berhasil dibuat dan langsung aktif.`
          : `Akun kasir "${fullName.trim()}" dibuat. Jika konfirmasi email aktif, minta staf cek inbox.`,
      });
      await loadProfiles();
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal membuat akun kasir: ${err.message}` });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(staff) {
    if (staff.id === user?.id) {
      setFeedback({ type: 'error', text: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
      return;
    }
    setFeedback(null);
    const nextActive = !staff.is_active;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    if (error) {
      setFeedback({ type: 'error', text: `Gagal mengubah status: ${error.message}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `${staff.full_name} sekarang ${nextActive ? 'Aktif' : 'Nonaktif'}.`,
    });
    await loadProfiles();
  }

  async function handleToggleRole(staff) {
    if (staff.id === user?.id) {
      setFeedback({ type: 'error', text: 'Anda tidak dapat mengubah role akun Anda sendiri.' });
      return;
    }
    setFeedback(null);
    const nextRole = staff.role === 'owner' ? 'kasir' : 'owner';
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    if (error) {
      setFeedback({ type: 'error', text: `Gagal mengubah role: ${error.message}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Role ${staff.full_name} diubah menjadi ${nextRole.toUpperCase()}.`,
    });
    await loadProfiles();
  }

  return (
    <div className="inventory-layout">
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <section className="card">
        <h2>
          <UserPlus size={18} /> Tambah Akun Kasir
        </h2>
        <p className="muted-text">
          Membuat akun kasir baru tanpa mengganggu sesi login Owner Anda.
        </p>
        <form onSubmit={handleCreateCashier} className="product-form">
          <div className="form-grid">
            <label>
              Nama Lengkap
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Siti Aminah"
                required
              />
            </label>
            <label>
              Email Login
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasir@toko.com"
                required
              />
            </label>
            <label>
              Password Awal (min. 6 karakter)
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                minLength={6}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={creating}>
              <UserPlus size={15} />
              <span>{creating ? 'Membuat Akun...' : 'Buat Akun Kasir'}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <h2 style={{ margin: 0 }}>Daftar Staf &amp; Hak Akses</h2>
          <button type="button" className="btn btn-outline" onClick={loadProfiles} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted-text">Memuat daftar staf...</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center muted-text">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                ) : (
                  profiles.map((staff) => {
                    const isSelf = staff.id === user?.id;
                    return (
                      <tr key={staff.id}>
                        <td>
                          <strong>{staff.full_name}</strong>{' '}
                          {isSelf && <span className="badge">Anda</span>}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              staff.role === 'owner' ? 'badge-owner' : ''
                            }`}
                          >
                            {staff.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              staff.is_active ? 'status-open' : 'status-closed'
                            }`}
                          >
                            {staff.is_active ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td>{formatDateTime(staff.created_at)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={isSelf}
                              onClick={() => handleToggleRole(staff)}
                            >
                              <Shield size={13} />
                              {staff.role === 'owner' ? 'Jadikan Kasir' : 'Jadikan Owner'}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                staff.is_active ? 'btn-danger' : 'btn-primary'
                              }`}
                              disabled={isSelf}
                              onClick={() => handleToggleActive(staff)}
                            >
                              {staff.is_active ? (
                                <>
                                  <UserX size={13} /> Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <UserCheck size={13} /> Aktifkan
                                </>
                              )}
                            </button>
                          </div>
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
    </div>
  );
}
