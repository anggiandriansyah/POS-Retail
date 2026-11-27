'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ExternalLink,
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
    color: '#10B981',
  },
  gen_beta: {
    name: 'GEN BETA — Growth Retail Store',
    priceText: 'Rp 20.000 / Bulan',
    amount: 20000,
    qrisSrc: '/qris-gen-beta-20k.jpg',
    badge: 'Paket Populer',
    color: '#3B82F6',
  },
  gen_gamma: {
    name: 'GEN GAMMA — Ultimate Enterprise Pro',
    priceText: 'Rp 30.000 / Bulan',
    amount: 30000,
    qrisSrc: '/qris-gen-gamma-30k.jpg',
    badge: 'Rekomendasi Terbaik',
    color: '#8B5CF6',
  },
};

export default function RegistrationModal({ initialTier, onClose, onSuccess }: RegistrationModalProps) {
  const { lang } = useThemeLang();
  const isEn = lang === 'en';
  const [tier, setTier] = useState<PackageTier>(initialTier);
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
      setErrorMsg('Format berkas harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 5 MB.');
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
      setErrorMsg('Mohon lengkapi seluruh kolom formulir pendaftaran.');
      return;
    }

    if (!isFree && !proofPreview) {
      setErrorMsg('Mohon lampirkan foto struk/screenshot bukti transfer pembayaran QRIS Anda.');
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

      // 1. Save local persistence
      saveLocalRegistration(newRegistration);

      // 2. Try Supabase RPC if online
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
      setErrorMsg(`Gagal memproses pendaftaran: ${msg}`);
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
        backgroundColor: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(8px)',
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
          background: 'var(--surface, #111827)',
          border: '1px solid var(--border, #1F293D)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          color: 'var(--text, #F9FAFB)',
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
            color: 'var(--muted, #94A3B8)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Tutup modal"
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
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
              {successReg.status === 'APPROVED'
                ? (isEn ? 'Store Registration Successfully Activated!' : 'Pendaftaran Toko Berhasil Aktif!')
                : (isEn ? 'Payment Proof & Registration Successfully Submitted!' : 'Bukti Pembayaran & Pendaftaran Berhasil Dikirim!')}
            </h3>

            <p style={{ color: 'var(--muted, #94A3B8)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
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
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border, #1F293D)',
                borderRadius: '12px',
                padding: '14px 18px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontWeight: 700 }}>
                <Mail size={16} />
                <span>Pengirim Resmi Notifikasi Email:</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  marginTop: '6px',
                  color: '#F8FAFC',
                }}
              >
                PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;
              </div>
              <div style={{ marginTop: '8px', color: 'var(--muted, #94A3B8)', fontSize: '12px' }}>
                {successReg.status === 'APPROVED'
                  ? (isEn ? 'Please click the button below to complete your store account verification.' : 'Silakan klik tombol di bawah untuk menyelesaikan verifikasi akun toko Anda.')
                  : (isEn ? 'Once payment is approved by Superadmin, an email with verification button will be dispatched automatically.' : 'Setelah pembayaran disetujui Superadmin, email berisi tombol verifikasi akan otomatis meluncur ke email Anda.')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a
                href={`/verify-account?token=${successReg.verification_token}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                <span>{isEn ? 'Open Account Verification' : 'Buka Verifikasi Akun'}</span>
                <ArrowRight size={16} />
              </a>
              <a
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  color: 'var(--text, #F9FAFB)',
                  border: '1px solid var(--border, #1F293D)',
                  textDecoration: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
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
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: `${currentTierInfo.color}20`,
                  color: currentTierInfo.color,
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                {isEn ? (tier === 'gen_alpha' ? 'Free Forever' : tier === 'gen_beta' ? 'Popular Tier' : 'Best Recommendation') : currentTierInfo.badge}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>
                {isEn ? `Store Registration Form — ${currentTierInfo.name}` : `Formulir Pendaftaran Toko — ${currentTierInfo.name}`}
              </h2>
              <p style={{ color: 'var(--muted, #94A3B8)', fontSize: '13px', margin: 0 }}>
                {isEn ? 'Plan Fee: ' : 'Biaya: '}
                <strong style={{ color: currentTierInfo.color }}>
                  {isEn ? (tier === 'gen_alpha' ? 'IDR 0 / Forever' : tier === 'gen_beta' ? 'IDR 20,000 / Month' : 'IDR 30,000 / Month') : currentTierInfo.priceText}
                </strong>
              </p>
            </div>

            {/* Tier Selector Chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['gen_alpha', 'gen_beta', 'gen_gamma'] as PackageTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: tier === t ? `2px solid ${TIER_DETAILS[t].color}` : '1px solid var(--border, #1F293D)',
                    background: tier === t ? `${TIER_DETAILS[t].color}15` : 'transparent',
                    color: tier === t ? '#F8FAFC' : 'var(--muted, #94A3B8)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, background-color 150ms ease, color 150ms ease',
                  }}
                >
                  {t === 'gen_alpha' ? 'Gen Alpha (Free)' : t === 'gen_beta' ? 'Gen Beta (20k)' : 'Gen Gamma (30k)'}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#FCA5A5',
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  {isEn ? 'Full Owner Name' : 'Nama Lengkap Pemilik'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. John Doe' : 'Contoh: Anggi Andriansyah'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  {isEn ? 'Store / Retail Name' : 'Nama Toko / Usaha Ritel'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Makmur Mart' : 'Contoh: Toko Berkah Makmur'}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
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
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
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
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
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
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
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
                    border: '1px solid var(--border, #1F293D)',
                    background: 'var(--bg, #0A0E17)',
                    color: '#FFFFFF',
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
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border, #1F293D)',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <QrCode size={18} style={{ color: currentTierInfo.color }} />
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>
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
                      padding: '10px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      maxWidth: '200px',
                      textAlign: 'center',
                    }}
                  >
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
                    <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: 800, marginTop: '4px' }}>
                      NMID: ID1026649384090
                    </div>
                  </div>

                  {/* QRIS Instruction & File Upload */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted, #94A3B8)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      {isEn
                        ? 'Open your mobile banking or e-wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay). Scan the official QRIS and pay the exact amount.'
                        : 'Silakan buka mobile banking / e-wallet (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay). Scan QRIS di samping dan bayar sesuai nominal tagihan.'}
                    </p>

                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        marginBottom: '6px',
                      }}
                    >
                      {isEn ? 'Upload Proof of QRIS Payment:' : 'Unggah Bukti Transfer QRIS:'}
                    </label>

                    <div
                      style={{
                        border: '2px dashed var(--border, #1F293D)',
                        borderRadius: '10px',
                        padding: '14px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg, #0A0E17)',
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
                        <Upload size={20} style={{ color: currentTierInfo.color }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#93C5FD' }}>
                          {isEn ? 'Click to select receipt / screenshot' : 'Klik untuk pilih foto struk / screenshot'}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--muted, #94A3B8)' }}>
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
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <img
                          src={proofPreview}
                          alt="Preview bukti bayar"
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
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
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: '#A7F3D0',
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #1F293D)',
                  background: 'transparent',
                  color: 'var(--muted, #94A3B8)',
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
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isFree
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
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
