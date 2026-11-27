'use client';

import { useState } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Mail,
  ArrowRight,
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
  { name: string; priceText: string; amount: number; qrisSrc?: string; badge: string; color: string }
> = {
  gen_alpha: {
    name: 'GEN ALPHA — Freemium Entry',
    priceText: 'Rp 0 / Selamanya',
    amount: 0,
    badge: 'Gratis Selamanya',
    color: '#059669',
  },
  gen_beta: {
    name: 'GEN BETA — Growth Retail Store',
    priceText: 'Rp 20.000 / Bulan',
    amount: 20000,
    qrisSrc: '/qris-gen-beta-20k.jpg',
    badge: 'Paket Populer',
    color: '#2563EB',
  },
  gen_gamma: {
    name: 'GEN GAMMA — Ultimate Enterprise Pro',
    priceText: 'Rp 30.000 / Bulan',
    amount: 30000,
    qrisSrc: '/qris-gen-gamma-30k.jpg',
    badge: 'Rekomendasi Terbaik',
    color: '#7C3AED',
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

    if (!isFree && !proofPreview) {
      setErrorMsg(isEn ? 'Please attach a screenshot or receipt photo of your QRIS payment.' : 'Mohon lampirkan foto struk/screenshot bukti transfer pembayaran QRIS Anda.');
      return;
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          color: 'var(--text)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isEn ? 'Close dialog' : 'Tutup dialog'}
        >
          <X size={20} />
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

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
              {successReg.status === 'APPROVED'
                ? (isEn ? 'Store Registration Successfully Activated!' : 'Pendaftaran Toko Berhasil Aktif!')
                : (isEn ? 'Payment Proof & Registration Successfully Submitted!' : 'Bukti Pembayaran & Pendaftaran Berhasil Dikirim!')}
            </h3>

            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              {successReg.status === 'APPROVED' ? (
                isEn ? (
                  <>
                    Congratulations, <strong>{successReg.store_name}</strong> is registered on{' '}
                    <strong style={{ color: currentTierInfo.color }}>{currentTierInfo.name}</strong>. Official confirmation email and activation button dispatched from:
                  </>
                ) : (
                  <>
                    Selamat, toko <strong>{successReg.store_name}</strong> telah terdaftar pada paket{' '}
                    <strong style={{ color: currentTierInfo.color }}>{currentTierInfo.name}</strong>. Email notifikasi
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
                <span>{isEn ? 'Cashier Login Page' : 'Halaman Login Kasir'}</span>
              </a>
            </div>
          </div>
        ) : (
          /* REGISTRATION & CHECKOUT FORM */
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: `${currentTierInfo.color}15`,
                  color: currentTierInfo.color,
                  border: `1px solid ${currentTierInfo.color}35`,
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                {isEn ? (tier === 'gen_alpha' ? 'Free Forever' : tier === 'gen_beta' ? 'Popular Tier' : 'Best Recommendation') : currentTierInfo.badge}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                {isEn ? `Store Registration — ${currentTierInfo.name}` : `Formulir Pendaftaran Toko — ${currentTierInfo.name}`}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                {isEn ? 'Plan Fee: ' : 'Biaya Paket: '}
                <strong style={{ color: currentTierInfo.color }}>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
                  {isEn ? 'POS Login Username' : 'Username Login Kasir'}
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

            {/* QRIS PAYMENT SECTION (For Gen Beta & Gen Gamma) */}
            {!isFree && currentTierInfo.qrisSrc && (
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <QrCode size={18} style={{ color: currentTierInfo.color }} />
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>
                    {isEn ? 'Official QRIS Payment: ' : 'Pembayaran QRIS Resmi: '}
                    {isEn ? (tier === 'gen_beta' ? 'IDR 20,000 / Month' : 'IDR 30,000 / Month') : currentTierInfo.priceText}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  {/* QRIS Image Container */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      maxWidth: '200px',
                      textAlign: 'center',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTierInfo.qrisSrc}
                      alt={`QRIS ${currentTierInfo.name}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '6px',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: 800, marginTop: '6px' }}>
                      NMID: ID1026649384090
                    </div>
                  </div>

                  {/* QRIS Instruction & File Upload */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
                      {isEn
                        ? 'Open your mobile banking or e-wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay). Scan the official QRIS on the left and pay the exact amount.'
                        : 'Silakan buka mobile banking atau e-wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay). Scan QRIS di samping dan selesaikan pembayaran sesuai tagihan.'}
                    </p>

                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '6px',
                      }}
                    >
                      {isEn ? 'Upload Proof of QRIS Payment (Screenshot / Receipt Image):' : 'Unggah Bukti Transfer QRIS (Screenshot / Foto Struk):'}
                    </label>

                    <div
                      style={{
                        border: '2px dashed var(--border-strong)',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--surface)',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="proofUploadInput"
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="proofUploadInput"
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Upload size={22} style={{ color: currentTierInfo.color }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)' }}>
                          {isEn ? 'Click to select receipt / screenshot' : 'Klik untuk pilih foto struk / screenshot'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {isEn ? 'JPG/PNG/WebP, max 5 MB' : 'Format JPG/PNG/WebP, maksimal 5 MB'}
                        </span>
                      </label>
                    </div>

                    {proofPreview && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'var(--primary-soft)',
                          border: '1px solid var(--primary-border)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proofPreview}
                          alt="Preview bukti bayar"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--primary-text)', fontWeight: 600 }}>
                          {isEn ? 'Proof of payment attached' : 'Bukti pembayaran terlampir'}
                        </span>
                      </div>
                    )}
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
                🎉 <strong>{isEn ? 'Free Plan Forever:' : 'Paket Gratis Selamanya:'}</strong>{' '}
                {isEn
                  ? 'No charges apply. Upon registering, your store account activates immediately.'
                  : 'Anda tidak dikenakan biaya apa pun. Setelah mendaftar, akun toko Anda langsung aktif secara instan dan dapat langsung melayani transaksi kasir.'}
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
                        ? (isFree ? 'Register Store Now (Free)' : 'Submit Proof & Complete')
                        : (isFree ? 'Daftarkan Toko Sekarang (Gratis)' : 'Kirim Bukti & Selesaikan Pembayaran')}
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
