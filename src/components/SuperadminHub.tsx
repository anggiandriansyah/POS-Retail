'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Profile } from '../types/pos';
import { formatRupiah } from '../utils/format';
import ThemeLangToggles from './ThemeLangToggles';
import { AlphosLogo } from './AlphosLogo';
import { useThemeLang } from '../contexts/useThemeLang';
import { Store, ShieldCheck, LogOut, ExternalLink, Search, CheckCircle, AlertTriangle, XCircle, Info, CreditCard, Eye, Mail, Check, X, QrCode } from 'lucide-react';
import {
  getLocalRegistrations,
  approveLocalRegistration,
  rejectLocalRegistration,
  type SubscriptionRegistration,
} from '../utils/subscriptionStorage';

interface MerchantTenant {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'trial' | 'expired';
  monthlyVolume: number;
  outletCount: number;
  joinedDate: string;
  expiresAt: string;
  city: string;
}

const INITIAL_MERCHANTS: MerchantTenant[] = [
  {
    id: 'merch-001',
    name: 'Toko Ritel Makmur Sentosa',
    ownerName: 'H. Sudirman',
    ownerEmail: 'sudirman@makmursentosa.co.id',
    plan: 'Enterprise',
    status: 'active',
    monthlyVolume: 185400000,
    outletCount: 4,
    joinedDate: '2026-08-10',
    expiresAt: '2027-08-10',
    city: 'Jakarta Selatan',
  },
  {
    id: 'merch-002',
    name: 'Kopi Kenangan Senja',
    ownerName: 'Dewi Lestari',
    ownerEmail: 'dewi@senjakopi.com',
    plan: 'Pro',
    status: 'active',
    monthlyVolume: 74200000,
    outletCount: 2,
    joinedDate: '2026-09-01',
    expiresAt: '2027-09-01',
    city: 'Bandung',
  },
  {
    id: 'merch-003',
    name: 'AlphaMart Fresh Market',
    ownerName: 'Budi Hartono',
    ownerEmail: 'budi@alphamartfresh.id',
    plan: 'Enterprise',
    status: 'active',
    monthlyVolume: 320500000,
    outletCount: 8,
    joinedDate: '2026-07-15',
    expiresAt: '2027-07-15',
    city: 'Surabaya',
  },
  {
    id: 'merch-004',
    name: 'Apotek Sehat Barokah',
    ownerName: 'apt. Rahmat Hidayat',
    ownerEmail: 'rahmat@apoteksehat.id',
    plan: 'Pro',
    status: 'trial',
    monthlyVolume: 42100000,
    outletCount: 1,
    joinedDate: '2026-11-18',
    expiresAt: '2026-12-02',
    city: 'Tangerang',
  },
  {
    id: 'merch-005',
    name: 'Bakery Le Delice',
    ownerName: 'Sophie Tan',
    ownerEmail: 'sophie@ledelice.co.id',
    plan: 'Starter',
    status: 'active',
    monthlyVolume: 29800000,
    outletCount: 1,
    joinedDate: '2026-10-05',
    expiresAt: '2027-10-05',
    city: 'Semarang',
  },
  {
    id: 'merch-006',
    name: 'Distro Urban Streetwear',
    ownerName: 'Rian Pratama',
    ownerEmail: 'rian@urbanstreetwear.com',
    plan: 'Starter',
    status: 'expired',
    monthlyVolume: 12400000,
    outletCount: 1,
    joinedDate: '2026-06-01',
    expiresAt: '2026-11-20',
    city: 'Yogyakarta',
  },
  {
    id: 'merch-007',
    name: 'Grosir Sembako Rejeki Nomplok',
    ownerName: 'Ibu Hj. Aminah',
    ownerEmail: 'aminah@rejekinomplok.id',
    plan: 'Enterprise',
    status: 'active',
    monthlyVolume: 410000000,
    outletCount: 5,
    joinedDate: '2026-05-12',
    expiresAt: '2027-05-12',
    city: 'Medan',
  },
  {
    id: 'merch-008',
    name: 'Barbershop & Grooming Gentlemen',
    ownerName: 'Kevin Wijaya',
    ownerEmail: 'kevin@gentlemengroom.com',
    plan: 'Pro',
    status: 'trial',
    monthlyVolume: 18500000,
    outletCount: 2,
    joinedDate: '2026-11-20',
    expiresAt: '2026-12-04',
    city: 'Bali',
  },
];

interface SuperadminHubProps {
  profile: Profile;
  onSignOut: () => void;
  onSwitchToMerchantView?: () => void;
}

export function SuperadminHub({ profile, onSignOut, onSwitchToMerchantView }: SuperadminHubProps) {
  const { theme, dict, lang } = useThemeLang();
  const s = dict.superadmin;
  const isEn = lang === 'en';

  const [merchants, setMerchants] = useState<MerchantTenant[]>(INITIAL_MERCHANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantTenant | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [isSprint5SignedOff, setIsSprint5SignedOff] = useState(false);

  // Sprint 7: Subscription Registrations & QRIS Approval State
  const [activeSuperadminTab, setActiveSuperadminTab] = useState<'merchants' | 'registrations'>('merchants');
  const [registrations, setRegistrations] = useState<SubscriptionRegistration[]>([]);
  const [regFilter, setRegFilter] = useState<'all' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('all');
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [approvedNotification, setApprovedNotification] = useState<{
    storeName: string;
    email: string;
    token: string;
    tier: string;
  } | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('alphos_sprint5_signed_off') === 'true') {
        setIsSprint5SignedOff(true);
      }
      setRegistrations(getLocalRegistrations());
    } catch {
      // ignore storage access errors
    }
  }, []);

  const pendingRegsCount = useMemo(() => {
    return registrations.filter(r => r.status === 'PENDING_APPROVAL').length;
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchSearch =
        r.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = regFilter === 'all' || r.status === regFilter;
      return matchSearch && matchStatus;
    });
  }, [registrations, searchQuery, regFilter]);

  const handleApproveReg = (reg: SubscriptionRegistration) => {
    const res = approveLocalRegistration(reg.id);
    if (res.success && res.registration) {
      setRegistrations(getLocalRegistrations());
      setApprovedNotification({
        storeName: reg.store_name,
        email: reg.email,
        token: res.registration.verification_token,
        tier: reg.package_tier,
      });
      setActionSuccessMessage(`Pendaftaran ${reg.store_name} (${reg.package_tier.toUpperCase()}) disetujui! Notifikasi email dikirim via PT AlphaGen Info.`);
      setTimeout(() => setActionSuccessMessage(''), 5000);
    }
  };

  const handleRejectReg = (reg: SubscriptionRegistration) => {
    const reason = prompt('Masukkan alasan penolakan pembayaran/pendaftaran:', 'Bukti pembayaran QRIS tidak sesuai/tidak terbaca.');
    if (reason === null) return;
    const updated = rejectLocalRegistration(reg.id, reason);
    if (updated) {
      setRegistrations(getLocalRegistrations());
      setActionSuccessMessage(`Pendaftaran ${reg.store_name} telah ditolak.`);
      setTimeout(() => setActionSuccessMessage(''), 4000);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = merchants.length;
    const active = merchants.filter(m => m.status === 'active').length;
    const trial = merchants.filter(m => m.status === 'trial').length;
    const expired = merchants.filter(m => m.status === 'expired').length;
    const totalGmv = merchants.reduce((acc, m) => acc + m.monthlyVolume, 0);
    // Estimated SaaS MRR: Starter = 299k, Pro = 799k, Enterprise = 1.999k
    const platformMrr = merchants
      .filter(m => m.status === 'active')
      .reduce((acc, m) => {
        if (m.plan === 'Enterprise') return acc + 1999000;
        if (m.plan === 'Pro') return acc + 799000;
        return acc + 299000;
      }, 0);

    return { total, active, trial, expired, totalGmv, platformMrr };
  }, [merchants]);

  // Filtered List
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [merchants, searchQuery, statusFilter]);

  const handleToggleStatus = (merchantId: string) => {
    setMerchants(prev =>
      prev.map(m => {
        if (m.id === merchantId) {
          const nextStatus = m.status === 'active' ? 'expired' : 'active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
    setActionSuccessMessage(s.actionSuccess);
    setTimeout(() => setActionSuccessMessage(''), 3500);
  };

  return (
    <div className="superadmin-shell">
      {/* Top Superadmin Navigation Header */}
      <header className="superadmin-header">
        <div className="superadmin-brand">
          <AlphosLogo
            variant={theme === 'dark' ? 'horizontal' : 'light'}
            width={140}
            height={34}
            className="alphos-logo"
          />
          <div className="superadmin-title-wrap">
            <h1>
              <span>{s.title}</span>
              <span className="superadmin-badge-root">{s.badge}</span>
            </h1>
            <p className="muted-text" style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>
              {s.ecosystem}
            </p>
          </div>
        </div>

        <div className="superadmin-actions">
          <div className="superadmin-user-pill">
            <span className="superadmin-dot-online" />
            <span>
              {s.sessionPrefix}: <strong>{profile.username || 'admin'}</strong> ({profile.full_name})
            </span>
          </div>

          <ThemeLangToggles compact />

          {onSwitchToMerchantView && (
            <button
              type="button"
              onClick={onSwitchToMerchantView}
              className="btn btn-outline btn-sm"
              title={s.switchModePosTitle}
            >
              <Store size={14} />
              <span>{s.switchModePos}</span>
            </button>
          )}

          <a
            href="/monitor.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            title="Buka Live Command Center monitoring"
          >
            <ExternalLink size={14} />
            <span>{s.monitorBtn}</span>
          </a>

          <button
            type="button"
            onClick={onSignOut}
            className="btn btn-danger btn-sm"
            title="Keluar dari akun superadmin"
          >
            <LogOut size={14} />
            <span>{s.signOut}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-content" style={{ marginTop: '16px' }}>
        {/* Sprint 5 Sign-off Status Banner */}
        {isSprint5SignedOff && (
          <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎉</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem' }}>
                  {isEn ? 'Sprint 5 Cloud DEV Sign-Off Successfully Approved!' : 'Sprint 5 Cloud DEV Sign-Off Telah Disahkan!'}
                </strong>
                <span className="muted-text" style={{ fontSize: '0.78rem' }}>
                  {isEn ? 'Official release document approved by Team Leader ' : 'Dokumen rilis resmi disetujui oleh Team Leader '}
                  <strong>Anggi Andriansyah (Gege)</strong> • Token: <code>SIG-GEGE-20261125-DEV-APPROVED</code>
                </span>
              </div>
            </span>
            <span className="badge badge-success" style={{ fontWeight: 800 }}>
              Step 5 Approved
            </span>
          </div>
        )}

        {/* Banner Alert if any */}
        {actionSuccessMessage && (
          <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} />
              {actionSuccessMessage}
            </span>
            <button
              type="button"
              onClick={() => setActionSuccessMessage('')}
              className="icon-btn"
              style={{ width: '24px', height: '24px', border: 'none', background: 'transparent' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Global SaaS Platform Metrics Cards */}
        <section className="superadmin-metrics-grid">
          <div className="superadmin-metric-card">
            <div className="superadmin-metric-top">
              <span className="superadmin-metric-label">{s.totalTenants}</span>
              <span className="superadmin-metric-icon" title="Merchants">🏢</span>
            </div>
            <div className="superadmin-metric-val">{metrics.total} {isEn ? 'Stores' : 'Toko'}</div>
            <div className="superadmin-metric-sub">
              <span className="badge badge-success">{metrics.active} {s.activeStatus}</span>
              <span className="badge badge-warning">{metrics.trial} {s.trialStatus}</span>
              <span className="badge badge-danger">{metrics.expired} {s.expiredStatus}</span>
            </div>
          </div>

          <div className="superadmin-metric-card">
            <div className="superadmin-metric-top">
              <span className="superadmin-metric-label">{s.saasMrr}</span>
              <span className="superadmin-metric-icon" title="Revenue">💰</span>
            </div>
            <div className="superadmin-metric-val text-success">
              {formatRupiah(metrics.platformMrr)}
            </div>
            <div className="superadmin-metric-sub" style={{ color: 'var(--primary)' }}>
              <strong>+18.4%</strong> {isEn ? 'vs previous month' : 'dari bulan sebelumnya'}
            </div>
          </div>

          <div className="superadmin-metric-card">
            <div className="superadmin-metric-top">
              <span className="superadmin-metric-label">{s.totalGmv}</span>
              <span className="superadmin-metric-icon" title="GMV">📈</span>
            </div>
            <div className="superadmin-metric-val">
              {formatRupiah(metrics.totalGmv)}
            </div>
            <div className="superadmin-metric-sub">
              {isEn ? '30-day cross-outlet accumulation' : 'Akumulasi 30 hari lintas outlet ritel'}
            </div>
          </div>

          <div className="superadmin-metric-card">
            <div className="superadmin-metric-top">
              <span className="superadmin-metric-label">{isEn ? 'Platform Health & SLA' : 'Kesehatan & SLA Platform'}</span>
              <span className="superadmin-metric-icon" title="System SLA">⚡</span>
            </div>
            <div className="superadmin-metric-val" style={{ color: '#3b82f6' }}>
              99.98%
            </div>
            <div className="superadmin-metric-sub">
              <span className="superadmin-dot-online" />
              <span>Postgres Supabase latency: ~14ms</span>
            </div>
          </div>
        </section>

        {/* Sprint 7: Superadmin Sub-Navigation Bar */}
        <div style={{ display: 'flex', gap: '10px', margin: '20px 0 16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSuperadminTab('merchants')}
            className={`btn ${activeSuperadminTab === 'merchants' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          >
            <Store size={16} />
            <span>{isEn ? 'Retail Tenant Management' : 'Manajemen Tenant Ritel'} ({merchants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSuperadminTab('registrations')}
            className={`btn ${activeSuperadminTab === 'registrations' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          >
            <CreditCard size={16} />
            <span>{isEn ? 'Subscription & QRIS Approvals' : 'Persetujuan Registrasi & QRIS'}</span>
            {pendingRegsCount > 0 && (
              <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                {pendingRegsCount} {isEn ? 'Pending' : 'Menunggu'}
              </span>
            )}
          </button>
        </div>

        {/* Approved Email Dispatch Notification Banner */}
        {approvedNotification && (
          <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} />
                Email Konfirmasi Terkirim Resmi: PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;
              </strong>
              <button
                type="button"
                onClick={() => setApprovedNotification(null)}
                className="icon-btn"
                style={{ border: 'none', background: 'transparent' }}
                title="Tutup pemberitahuan"
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
              Toko <strong>{approvedNotification.storeName}</strong> ({approvedNotification.tier.toUpperCase()}) telah disetujui. Tautan verifikasi akun telah dikirim ke <strong>{approvedNotification.email}</strong>:
              <div style={{ marginTop: '6px' }}>
                <a
                  href={`/verify-account?token=${approvedNotification.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                >
                  <ExternalLink size={13} />
                  <span>Uji Tautan Verifikasi: /verify-account?token={approvedNotification.token}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Multi-Tenant Merchant Management Table Section */}
        {activeSuperadminTab === 'merchants' && (
        <section className="card">
          <div className="superadmin-table-controls">
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>
                {s.overviewHeading}
              </h2>
              <p className="muted-text" style={{ margin: 0, fontSize: '0.82rem' }}>
                {isEn ? 'Manage subscriptions, feature tiers, and ALPHOS multi-tenant isolation' : 'Kelola hak akses langganan, paket fitur, dan isolasi tenant ALPHOS'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              {/* Search Bar */}
              <div className="superadmin-search-wrap">
                <input
                  type="text"
                  placeholder={s.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input"
                />
                <span className="superadmin-search-icon">
                  <Search size={14} />
                </span>
              </div>

              {/* Status Filter Chips */}
              <div className="superadmin-filter-group">
                {(['all', 'active', 'trial', 'expired'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`chip ${statusFilter === st ? 'active' : ''}`}
                  >
                    {st === 'all' ? s.allStatus : st === 'active' ? s.activeStatus : st === 'trial' ? s.trialStatus : s.expiredStatus}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{s.tableMerchant}</th>
                  <th>{s.tableOwner}</th>
                  <th>{s.tablePlan}</th>
                  <th>{s.tableStatus}</th>
                  <th>{s.tableVolume}</th>
                  <th>{s.outlets}</th>
                  <th>{s.expiresOn}</th>
                  <th style={{ textAlign: 'center' }}>{s.tableAction}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                      {isEn ? 'No merchants found matching your search.' : 'Tidak ada merchant yang sesuai dengan kriteria pencarian.'}
                    </td>
                  </tr>
                ) : (
                  filteredMerchants.map(m => (
                    <tr key={m.id}>
                      <td>
                        <strong style={{ display: 'block', color: 'var(--text)' }}>{m.name}</strong>
                        <span className="muted-text" style={{ fontSize: '0.74rem' }}>
                          {m.city} • <code style={{ fontSize: '0.72rem' }}>{m.id}</code>
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.ownerName}</div>
                        <span className="muted-text" style={{ fontSize: '0.74rem' }}>{m.ownerEmail}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.plan === 'Enterprise'
                              ? 'badge-plan-enterprise'
                              : m.plan === 'Pro'
                              ? 'badge-plan-pro'
                              : 'badge-plan-starter'
                          }`}
                        >
                          {m.plan}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.status === 'active'
                              ? 'badge-success'
                              : m.status === 'trial'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {m.status === 'active' ? (
                            <>
                              <CheckCircle size={11} /> {s.activeStatus}
                            </>
                          ) : m.status === 'trial' ? (
                            <>
                              <AlertTriangle size={11} /> {isEn ? '14-Day Trial' : 'Trial 14-Hari'}
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> {s.expiredStatus}
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatRupiah(m.monthlyVolume)}
                      </td>
                      <td>
                        <span className="badge">{m.outletCount} {s.outlets}</span>
                      </td>
                      <td className="muted-text" style={{ fontSize: '0.78rem' }}>
                        {s.expiresOn} {m.expiresAt}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedMerchant(m)}
                            className="btn btn-outline btn-sm"
                            title={isEn ? 'View merchant specification details' : 'Lihat detail spesifikasi merchant'}
                          >
                            <Info size={12} />
                            <span>{isEn ? 'Details' : 'Detail'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(m.id)}
                            className={`btn btn-sm ${m.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                            title={m.status === 'active' ? (isEn ? 'Suspend this merchant' : 'Bekukan sementara merchant ini') : (isEn ? 'Reactivate merchant' : 'Aktifkan kembali akses merchant')}
                          >
                            {m.status === 'active' ? s.deactivate : s.activate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {/* TAB 2: Subscription Registrations & QRIS Approval Section */}
        {activeSuperadminTab === 'registrations' && (
          <section className="card">
            <div className="superadmin-table-controls">
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>
                  Persetujuan Registrasi & Pembayaran QRIS
                </h2>
                <p className="muted-text" style={{ margin: 0, fontSize: '0.82rem' }}>
                  Verifikasi bukti transfer QRIS dan persetujuan pembuatan akun POS ritel baru.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <div className="superadmin-search-wrap">
                  <input
                    type="text"
                    placeholder="Cari toko, nama pemilik, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input"
                  />
                  <span className="superadmin-search-icon">
                    <Search size={14} />
                  </span>
                </div>

                <div className="superadmin-filter-group">
                  {(['all', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRegFilter(st)}
                      className={`chip ${regFilter === st ? 'active' : ''}`}
                    >
                      {st === 'all'
                        ? 'Semua Status'
                        : st === 'PENDING_APPROVAL'
                        ? '⏳ Menunggu Approval'
                        : st === 'APPROVED'
                        ? '✓ Disetujui'
                        : '✕ Ditolak'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Toko & Pemilik</th>
                    <th>Kontak & Username</th>
                    <th>Paket Layanan</th>
                    <th>Nominal</th>
                    <th>Bukti Pembayaran</th>
                    <th>Status Approval</th>
                    <th>Verifikasi</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                        Tidak ada permohonan registrasi yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text)' }}>{r.store_name}</strong>
                          <span className="muted-text" style={{ fontSize: '0.74rem' }}>
                            {r.full_name} • <code>{r.id}</code>
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>{r.email}</div>
                          <span className="muted-text" style={{ fontSize: '0.74rem' }}>
                            {r.phone} • User: <code>{r.username}</code>
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.package_tier === 'gen_gamma'
                                ? 'badge-plan-enterprise'
                                : r.package_tier === 'gen_beta'
                                ? 'badge-plan-pro'
                                : 'badge-plan-starter'
                            }`}
                          >
                            {r.package_tier.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {r.amount === 0 ? 'Gratis (Rp 0)' : formatRupiah(r.amount)}
                        </td>
                        <td>
                          {r.payment_proof_url ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProof(r.payment_proof_url!)}
                              className="btn btn-outline btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} />
                              <span>Lihat Bukti QRIS</span>
                            </button>
                          ) : (
                            <span className="muted-text" style={{ fontSize: '0.78rem' }}>Tanpa Berkas</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'APPROVED'
                                ? 'badge-success'
                                : r.status === 'PENDING_APPROVAL'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {r.status === 'APPROVED' ? 'Disetujui' : r.status === 'PENDING_APPROVAL' ? 'Menunggu Approval' : 'Ditolak'}
                          </span>
                        </td>
                        <td>
                          {r.is_verified ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              <Check size={11} /> Terverifikasi
                            </span>
                          ) : (
                            <span className="badge" style={{ fontSize: '0.72rem' }}>
                              Belum Aktivasi
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {r.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveReg(r)}
                                  className="btn btn-primary btn-sm"
                                  title="Setujui pendaftaran dan kirim email aktivasi"
                                >
                                  <Check size={13} />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectReg(r)}
                                  className="btn btn-danger btn-sm"
                                  title="Tolak pendaftaran"
                                >
                                  <X size={13} />
                                  <span>Tolak</span>
                                </button>
                              </>
                            )}
                            {r.status === 'APPROVED' && (
                              <a
                                href={`/verify-account?token=${r.verification_token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                                title="Buka tautan verifikasi akun"
                              >
                                <ExternalLink size={12} />
                                <span>Tautan</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Merchant Detail Modal */}
        {selectedMerchant && (
          <div className="modal-backdrop" onClick={() => setSelectedMerchant(null)}>
            <div className="modal-card" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🏢</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      {selectedMerchant.name}
                    </h3>
                    <span className="muted-text" style={{ fontSize: '0.74rem' }}>
                      ID Tenant: <code>{selectedMerchant.id}</code>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMerchant(null)}
                  className="icon-btn"
                  title="Tutup dialog"
                >
                  ✕
                </button>
              </div>

              <div className="merchant-modal-grid">
                <div className="merchant-modal-item">
                  <div className="merchant-modal-item-label">{s.tableOwner}</div>
                  <div className="merchant-modal-item-val">{selectedMerchant.ownerName}</div>
                  <div className="merchant-modal-item-sub">{selectedMerchant.ownerEmail}</div>
                </div>

                <div className="merchant-modal-item">
                  <div className="merchant-modal-item-label">{s.city}</div>
                  <div className="merchant-modal-item-val">{selectedMerchant.city}</div>
                  <div className="merchant-modal-item-sub">{selectedMerchant.outletCount} {s.outlets} {isEn ? 'Registered' : 'Terdaftar'}</div>
                </div>

                <div className="merchant-modal-item">
                  <div className="merchant-modal-item-label">{s.tablePlan}</div>
                  <div className="merchant-modal-item-val" style={{ color: 'var(--primary)' }}>
                    {selectedMerchant.plan} Plan
                  </div>
                  <div className="merchant-modal-item-sub">{s.expiresOn} {selectedMerchant.expiresAt}</div>
                </div>

                <div className="merchant-modal-item">
                  <div className="merchant-modal-item-label">{s.tableVolume}</div>
                  <div className="merchant-modal-item-val text-success">
                    {formatRupiah(selectedMerchant.monthlyVolume)}
                  </div>
                  <div className="merchant-modal-item-sub">{s.tableStatus}: {selectedMerchant.status.toUpperCase()}</div>
                </div>
              </div>

              <div className="merchant-security-box">
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                  Tenant Data Isolation & Security:
                </strong>
                {isEn
                  ? 'All transactional data, cashiers, warehouse inventory, and shift logs for this merchant are strictly isolated in Supabase PostgreSQL via Row-Level Security (RLS) multi-tenancy.'
                  : 'Data transaksi, kasir, inventaris gudang, dan riwayat shift merchant ini diisolasi secara ketat di Supabase PostgreSQL dengan Row-Level Security (RLS) multitenancy per tenant-id.'}
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedMerchant.id)}
                  className={`btn btn-sm ${selectedMerchant.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {selectedMerchant.status === 'active' ? s.deactivate : s.activate}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMerchant(null)}
                  className="btn btn-outline btn-sm"
                >
                  {s.closeModal}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Proof Lightbox Modal */}
        {previewProof && (
          <div className="modal-backdrop" onClick={() => setPreviewProof(null)}>
            <div className="modal-card" style={{ maxWidth: '480px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Pratinjau Bukti Pembayaran QRIS</h3>
                <button type="button" onClick={() => setPreviewProof(null)} className="icon-btn">✕</button>
              </div>
              <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewProof}
                  alt="Bukti Transfer QRIS"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setPreviewProof(null)} className="btn btn-primary btn-sm">
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
