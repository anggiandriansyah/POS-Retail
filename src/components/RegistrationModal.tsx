'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Mail,
  ArrowRight,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import type { PackageTier, SubscriptionRegistration } from '../utils/subscriptionStorage';
import { saveLocalRegistration } from '../utils/subscriptionStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useThemeLang } from '../contexts/useThemeLang';

interface RegistrationModalProps {
  initialTier: PackageTier;
  onClose: () => void;
  onSuccess?: (reg: SubscriptionRegistration) => void;
}

const TIER_DETAILS: Record<
  PackageTier,
  { name: string; priceText: string; amount: number; qrisSrc?: string; badge: string; variant: 'alpha' | 'beta' | 'gamma' }
> = {
  gen_alpha: {
    name: 'GEN ALPHA (Freemium Entry)',
    priceText: 'Rp 0 / Selamanya',
    amount: 0,
    badge: 'Gratis Selamanya',
    variant: 'alpha',
  },
  gen_beta: {
    name: 'GEN BETA (Growth Retail Store)',
    priceText: 'Rp 20.000 / Bulan',
    amount: 20000,
    qrisSrc: '/qris-gen-beta-20k.jpg',
    badge: 'Paket Populer',
    variant: 'beta',
  },
  gen_gamma: {
    name: 'GEN GAMMA (Ultimate Enterprise Pro)',
    priceText: 'Rp 30.000 / Bulan',
    amount: 30000,
    qrisSrc: '/qris-gen-gamma-30k.jpg',
    badge: 'Rekomendasi Terbaik',
    variant: 'gamma',
  },
};

export default function RegistrationModal({ initialTier, onClose, onSuccess }: RegistrationModalProps) {
  const { lang } = useThemeLang();
  const isEn = lang === 'en';
  const tier = initialTier;

  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReg, setSuccessReg] = useState<SubscriptionRegistration | null>(null);

  const currentTierInfo = TIER_DETAILS[tier];
  const isFree = tier === 'gen_alpha';

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(isEn ? 'File format must be an image (JPG, PNG, or WebP).' : 'Format berkas harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(isEn ? 'Maximum image size is 5 MB.' : 'Ukuran gambar maksimal 5 MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !storeName.trim() || !email.trim() || !phone.trim() || !username.trim() || !password) {
      setErrorMsg(isEn ? 'Please fill out all registration fields.' : 'Mohon lengkapi seluruh kolom formulir pendaftaran.');
      return;
    }

    if (!isFree) {
      setSubmitting(true);
      try {
        const orderId = 'INV-' + Date.now();
        const snapRes = await fetch('/api/payment/midtrans/snap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            grossAmount: currentTierInfo.amount,
            customerName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            finishUrl: window.location.origin + '/verify-account?status=success',
            itemDetails: [
              {
                id: tier,
                price: currentTierInfo.amount,
                quantity: 1,
                name: tier === 'gen_beta' ? 'Langganan Gen Beta' : 'Langganan Gen Gamma',
              },
            ],
          }),
        });

        const snapData = await snapRes.json();
        if (!snapRes.ok || !snapData.success || !snapData.redirectUrl) {
          throw new Error(snapData.error || 'Gagal membuat sesi pembayaran.');
        }

        const newRegistration: SubscriptionRegistration = {
          id: 'reg-' + Date.now(),
          full_name: fullName.trim(),
          store_name: storeName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          username: username.trim().toLowerCase(),
          package_tier: tier,
          amount: currentTierInfo.amount,
          payment_method: 'midtrans_snap',
          status: 'PENDING_APPROVAL',
          verification_token: orderId,
          is_verified: false,
          created_at: new Date().toISOString(),
        };
        saveLocalRegistration(newRegistration);

        // Arahkan otomatis ke layar pembayaran Midtrans Snap (QRIS Dinamis / Virtual Account)
        window.location.href = snapData.redirectUrl;
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(isEn ? `Failed to initiate payment: ${msg}` : `Gagal memulai pembayaran: ${msg}`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const isAutoApproved = isFree;

      const newRegistration: SubscriptionRegistration = {
        id: 'reg-' + Date.now(),
        full_name: fullName.trim(),
        store_name: storeName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        username: username.trim().toLowerCase(),
        package_tier: tier,
        amount: currentTierInfo.amount,
        payment_method: isFree ? 'free' : 'qris',
        payment_proof_url: proofPreview,
        status: isAutoApproved ? 'APPROVED' : 'PENDING_APPROVAL',
        verification_token: token,
        is_verified: isAutoApproved,
        verified_at: isAutoApproved ? new Date().toISOString() : null,
        approved_at: isAutoApproved ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      };

      saveLocalRegistration(newRegistration);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.rpc('submit_subscription_registration', {
            p_full_name: newRegistration.full_name,
            p_store_name: newRegistration.store_name,
            p_email: newRegistration.email,
            p_phone: newRegistration.phone,
            p_username: newRegistration.username,
            p_package_tier: newRegistration.package_tier,
            p_payment_proof: proofPreview ? 'Uploaded' : null,
          });
        } catch (supabaseErr) {
          console.warn('Supabase registration sync warning:', supabaseErr);
        }
      }

      setSuccessReg(newRegistration);
      if (onSuccess) {
        onSuccess(newRegistration);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(isEn ? `Failed to submit registration: ${msg}` : `Gagal memproses pendaftaran: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="modal-card modal-card-wide"
        style={{ padding: '24px', color: 'var(--text)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="icon-btn"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '44px',
            height: '44px',
          }}
          aria-label={isEn ? 'Close dialog' : 'Tutup dialog'}
        >
          <X size={20} aria-hidden="true" />
        </button>

        {successReg ? (
          /* SUCCESS CONFIRMATION STATE */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 id="reg-modal-title" style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
              {successReg.status === 'APPROVED'
                ? (isEn ? 'Store Registration Successfully Activated!' : 'Pendaftaran Toko Berhasil Aktif!')
                : (isEn ? 'Payment Proof & Registration Successfully Submitted!' : 'Bukti Pembayaran & Pendaftaran Berhasil Dikirim!')}
            </h3>

            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              {successReg.status === 'APPROVED' ? (
                isEn ? (
                  <>
                    Congratulations, <strong>{successReg.store_name}</strong> is registered on{' '}
                    <strong className={`reg-tier-accent--${currentTierInfo.variant}`}>{currentTierInfo.name}</strong>. Official confirmation email and activation button dispatched from:
                  </>
                ) : (
                  <>
                    Selamat, toko <strong>{successReg.store_name}</strong> telah terdaftar pada paket{' '}
                    <strong className={`reg-tier-accent--${currentTierInfo.variant}`}>{currentTierInfo.name}</strong>. Email notifikasi
                    dan tautan verifikasi resmi telah dikirimkan dari:
                  </>
                )
              ) : (
                isEn ? (
                  <>
                    Thank you, <strong>{successReg.full_name}</strong>. Store registration for{' '}
                    <strong>{successReg.store_name}</strong> with QRIS payment of{' '}
                    <strong>{currentTierInfo.priceText}</strong> is currently pending manual verification by PT AlphaGen Superadmin team.
                  </>
                ) : (
                  <>
                    Terima kasih, <strong>{successReg.full_name}</strong>. Pendaftaran toko{' '}
                    <strong>{successReg.store_name}</strong> dengan pembayaran QRIS sebesar{' '}
                    <strong>{currentTierInfo.priceText}</strong> sedang dalam antrean verifikasi manual oleh tim
                    Superadmin PT AlphaGen.
                  </>
                )
              )}
            </p>

            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 18px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                <Mail size={16} />
                <span>{isEn ? 'Official Notification Sender:' : 'Pengirim Resmi Notifikasi Email:'}</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
              >
                PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;
              </div>
              <div style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '12px' }}>
                {successReg.status === 'APPROVED'
                  ? (isEn ? 'Please click the button below to complete your store account verification.' : 'Silakan klik tombol di bawah untuk menyelesaikan verifikasi akun toko Anda.')
                  : (isEn ? 'Once payment is approved by Superadmin, an email with verification button will be dispatched automatically.' : 'Setelah pembayaran disetujui Superadmin, email berisi tombol verifikasi akan otomatis meluncur ke email Anda.')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a
                href={`/verify-account?token=${successReg.verification_token}`}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                <span>{isEn ? 'Open Account Verification' : 'Buka Verifikasi Akun'}</span>
                <ArrowRight size={16} />
              </a>
              <a
                href="/login"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '12px 20px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                <span>{isEn ? 'Login Page' : 'Halaman Login'}</span>
              </a>
            </div>
          </div>
        ) : (
          /* REGISTRATION & CHECKOUT FORM */
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px', paddingRight: '44px' }}>
              <div className={`reg-tier-pill reg-tier-pill--${currentTierInfo.variant}`}>
                {isEn ? (tier === 'gen_alpha' ? 'Free Forever' : tier === 'gen_beta' ? 'Popular Tier' : 'Best Recommendation') : currentTierInfo.badge}
              </div>
              <h2 id="reg-modal-title" style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                {isEn ? `Store Registration: ${currentTierInfo.name}` : `Formulir Pendaftaran Toko: ${currentTierInfo.name}`}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                {isEn ? 'Plan Fee: ' : 'Biaya Paket: '}
                <strong className={`reg-tier-accent--${currentTierInfo.variant}`}>
                  {isEn ? (tier === 'gen_alpha' ? 'IDR 0 / Forever' : tier === 'gen_beta' ? 'IDR 20,000 / Month' : 'IDR 30,000 / Month') : currentTierInfo.priceText}
                </strong>
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--danger-soft)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger-text)',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Fields: Data Toko & Diri */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'Full Owner Name' : 'Nama Lengkap Pemilik'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Anggi Andriansyah' : 'Contoh: Anggi Andriansyah'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'Store / Retail Name' : 'Nama Toko / Usaha Ritel'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Toko Berkah Makmur' : 'Contoh: Toko Berkah Makmur'}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'Email Address (For Notifications)' : 'Alamat Email (Untuk Notifikasi)'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'WhatsApp / Phone Number' : 'Nomor WhatsApp / HP'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'Login Username' : 'Username Login'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. anggistore' : 'Contoh: anggitoko'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {isEn ? 'Account Password' : 'Password Akun'}
                </label>
                <input
                  type="password"
                  required
                  placeholder={isEn ? 'Minimum 6 characters' : 'Minimal 6 karakter'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* AUTOMATED PAYMENT SECTION (For Gen Beta & Gen Gamma) */}
            {!isFree && (
              <div className="reg-modal-flat-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CreditCard size={18} className={`reg-tier-accent--${currentTierInfo.variant}`} aria-hidden="true" />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>
                    {isEn ? 'Instant Online Payment: ' : 'Pembayaran Otomatis Online: '}
                    {currentTierInfo.priceText}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {isEn
                      ? 'Pay instantly with Dynamic QRIS (GoPay, ShopeePay, DANA) or Bank Virtual Account (BCA, Mandiri, BRI, BNI). Store license activates in real-time right after payment without manual verification.'
                      : 'Bayar instan via QRIS Dinamis (GoPay, ShopeePay, DANA) atau Virtual Account (BCA, Mandiri, BRI, BNI). Lisensi toko langsung aktif otomatis detik itu juga tanpa perlu antre verifikasi manual.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      QRIS Dinamis
                    </span>
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      Virtual Account Bank
                    </span>
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', fontWeight: 700, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                      Faktur Resmi PDF
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
                    <ShieldCheck size={14} style={{ color: '#10b981' }} />
                    <span>{isEn ? 'Official & secure transaction licensed by Bank Indonesia.' : 'Diproses resmi & aman terverifikasi Bank Indonesia.'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Instant Active Note for Gen Alpha */}
            {isFree && (
              <div
                style={{
                  background: 'var(--primary-soft)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: 'var(--primary-text)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', verticalAlign: 'middle' }}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <strong>{isEn ? 'Free Plan Forever:' : 'Paket Gratis Selamanya:'}</strong>
                </span>{' '}
                {isEn
                  ? 'No charges apply. Upon registering, your store account activates immediately.'
                  : 'Anda tidak dikenakan biaya apa pun. Setelah mendaftar, akun toko Anda langsung aktif secara instan dan dapat langsung digunakan.'}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-outline"
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {submitting ? (
                  <span>{isEn ? 'Processing registration...' : 'Memproses pendaftaran...'}</span>
                ) : (
                  <>
                    <span>
                      {isEn
                        ? (isFree ? 'Register Store Now (Free)' : `Pay Now (${currentTierInfo.priceText})`)
                        : (isFree ? 'Daftarkan Toko Sekarang (Gratis)' : `Bayar Sekarang (${currentTierInfo.priceText})`)}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
