'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, Store, ShieldCheck, Mail } from 'lucide-react';
import AlphosLogo from '../../components/AlphosLogo';
import { verifyAccountByToken, getLocalRegistrations, type SubscriptionRegistration } from '../../utils/subscriptionStorage';

function VerifyAccountContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || searchParams.get('order_id') || searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [registration, setRegistration] = useState<SubscriptionRegistration | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let token = tokenParam;
    if (!token && typeof window !== 'undefined') {
      const list = getLocalRegistrations();
      if (list.length > 0) {
        token = list[0].verification_token;
      }
    }

    if (!token) {
      setLoading(false);
      setErrorMessage('Token verifikasi tidak ditemukan dalam tautan.');
      return;
    }

    const timer = setTimeout(() => {
      const res = verifyAccountByToken(token);
      if (res.success && res.registration) {
        setRegistration(res.registration);
        setSuccess(true);
      } else {
        setErrorMessage('Tautan verifikasi tidak valid atau masa berlaku telah kedaluwarsa.');
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [tokenParam]);

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'gen_alpha':
        return 'GEN ALPHA (Freemium Entry)';
      case 'gen_beta':
        return 'GEN BETA (Growth Retail Store)';
      case 'gen_gamma':
        return 'GEN GAMMA (Ultimate Enterprise Pro)';
      default:
        return 'ALPHOS Subscription';
    }
  };

  return (
    <div className="login-page">
      <div className="card" style={{ maxWidth: '520px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <AlphosLogo variant="light" width={160} height={40} />
        </div>

        {loading ? (
          <div style={{ padding: '30px 10px' }}>
            <p className="muted-text">Memverifikasi token aktivasi akun Anda...</p>
          </div>
        ) : success && registration ? (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
              Akun Berhasil Diverifikasi!
            </h2>
            <p className="muted-text" style={{ fontSize: '0.92rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              Selamat datang di ekosistem ALPHOS. Toko Anda telah resmi terverifikasi dan siap digunakan.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted-text">Nama Toko:</span>
                <strong>{registration.store_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted-text">Pemilik:</span>
                <span>{registration.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted-text">Username POS:</span>
                <code>{registration.username}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted-text">Paket Layanan:</span>
                <span className="badge badge-success">{getTierLabel(registration.package_tier)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted-text">Status Sistem:</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Aktif & Terotorisasi</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--primary-soft)',
                border: '1px solid var(--primary-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: 'var(--primary-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <Mail size={16} style={{ flexShrink: 0 }} />
              <span>
                Notifikasi aktivasi telah dikirim oleh <strong>PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;</strong> ke <strong>{registration.email}</strong>.
              </span>
            </div>

            <Link href="/login" className="btn btn-primary btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
              <span>Masuk ke Kasir / Dashboard POS</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-soft)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--danger)' }}>
              Verifikasi Tidak Berhasil
            </h2>
            <p className="muted-text" style={{ fontSize: '0.92rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              {errorMessage || 'Tautan yang Anda tuju tidak valid atau akun telah diverifikasi sebelumnya.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/" className="btn btn-outline">
                <span>Halaman Utama</span>
              </Link>
              <Link href="/login" className="btn btn-primary">
                <span>Ke Portal Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={<div className="login-page"><div className="card"><p className="muted-text">Memuat verifikasi...</p></div></div>}>
      <VerifyAccountContent />
    </Suspense>
  );
}
