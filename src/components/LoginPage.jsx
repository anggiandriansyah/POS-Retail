import { useState } from 'react';
import { LogIn, ShieldCheck, Store } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { APP_VERSION, STORE_INFO } from '../utils/format';

export default function LoginPage() {
  const { hasOwner, authError, signIn, claimFirstOwner } = useAuth();
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const appEnv =
    import.meta.env.VITE_APP_ENV ||
    (import.meta.env.DEV ? 'development' : 'production');
  const isDevEnv = appEnv !== 'production';

  const activeMode = !hasOwner && mode === 'claim_owner' ? 'claim_owner' : 'login';

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim() || !password) {
      setFeedback({ type: 'error', text: 'Email dan password wajib diisi.' });
      return;
    }

    if (activeMode === 'claim_owner') {
      if (!fullName.trim()) {
        setFeedback({ type: 'error', text: 'Nama lengkap Owner wajib diisi.' });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', text: 'Password minimal 6 karakter.' });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (activeMode === 'claim_owner') {
        const result = await claimFirstOwner(email, password, fullName);
        if (result?.needsEmailConfirmation) {
          setFeedback({
            type: 'success',
            text: 'Akun Owner dibuat! Cek email Anda untuk verifikasi lalu login.',
          });
          setMode('login');
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Gagal memproses autentikasi.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-brand">
          <div className="brand-logo">
            <Store size={24} />
          </div>
          <div>
            <h1>
              {STORE_INFO.name}{' '}
              {isDevEnv && <span className="env-badge">DEV</span>}
            </h1>
            <span className="muted-text">
              POS Retail &amp; Inventory • <code>v{APP_VERSION}</code>
            </span>
          </div>
        </div>

        {!hasOwner && (
          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'login'}
              className={`chip ${activeMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setFeedback(null);
              }}
            >
              <LogIn size={14} /> Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'claim_owner'}
              className={`chip ${activeMode === 'claim_owner' ? 'active' : ''}`}
              onClick={() => {
                setMode('claim_owner');
                setFeedback(null);
              }}
            >
              <ShieldCheck size={14} /> Daftar sebagai Owner Pertama
            </button>
          </div>
        )}

        {(authError || feedback) && (
          <div
            className={`alert ${
              feedback?.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            {feedback?.text || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {activeMode === 'claim_owner' && (
            <label>
              Nama Lengkap Owner
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@toko.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={activeMode === 'claim_owner' ? 'new-password' : 'current-password'}
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
          >
            {activeMode === 'claim_owner' ? (
              <>
                <ShieldCheck size={18} />
                <span>{submitting ? 'Mendaftarkan...' : 'Daftar & Klaim Owner Pertama'}</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>{submitting ? 'Memproses...' : 'Masuk ke Kasir / Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        <p className="muted-text login-hint">
          {activeMode === 'claim_owner'
            ? 'Setup awal: akun pertama akan otomatis menjadi Owner toko.'
            : 'Hubungi Owner jika Anda belum memiliki akun kasir.'}
        </p>
      </div>
    </div>
  );
}
