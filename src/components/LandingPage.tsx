'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Zap,
  WifiOff,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Check,
  ArrowRight,
  Sparkles,
  Store,
  HelpCircle,
  FileCheck2,
  Lock,
} from 'lucide-react';
import AlphosLogo from './AlphosLogo';
import ThemeLangToggles from './ThemeLangToggles';
import RegistrationModal from './RegistrationModal';
import type { PackageTier } from '../utils/subscriptionStorage';
import { useThemeLang } from '../contexts/useThemeLang';

const OPERATIONAL_VALUES = [
  'Bebas Biaya Langganan Selamanya',
  'Kasir Tetap Scan Saat Internet Mati',
  'Rekonsiliasi Kas Laci Tanpa Selisih',
  'Pencegahan Kebocoran Kas & Stok Cabang',
  'Analitik Visual Margin Profit Otomatis',
];

export default function LandingPage() {
  const { theme } = useThemeLang();
  const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);

  // Typewriter effect state
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = OPERATIONAL_VALUES[currentPhraseIndex];
    const typingSpeed = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(fullText.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % OPERATIONAL_VALUES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex]);

  return (
    <div className="landing-wrapper">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ALPHOS Smart Retail POS',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Progressive Web App (PWA)',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'IDR',
                name: 'Gen Alpha (Free)',
              },
              {
                '@type': 'Offer',
                price: '20000',
                priceCurrency: 'IDR',
                name: 'Gen Beta',
              },
              {
                '@type': 'Offer',
                price: '30000',
                priceCurrency: 'IDR',
                name: 'Gen Gamma',
              },
            ],
            creator: {
              '@type': 'Organization',
              name: 'PT AlphaGen',
              url: 'https://alphagen.co.id',
            },
          }),
        }}
      />

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <div className="landing-brand">
            <AlphosLogo variant={theme === 'dark' ? 'horizontal' : 'light'} width={150} height={36} />
          </div>

          <nav className="landing-nav" aria-label="Navigasi Halaman">
            <a href="#fitur" className="landing-nav-link">Fitur Operasional</a>
            <a href="#paket" className="landing-nav-link">Paket Harga</a>
            <a href="#keunggulan" className="landing-nav-link">Keandalan Sistem</a>
            <a href="#faq" className="landing-nav-link">Tanya Jawab</a>
          </nav>

          <div className="landing-header-actions">
            <ThemeLangToggles compact />
            <Link href="/login" className="btn btn-primary landing-login-btn">
              <span>Masuk ke POS</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="landing-hero-section">
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-badge">
              <Sparkles size={14} className="landing-sparkle" />
              <span>Sistem Kasir & Operasional Ritel Modern Indonesia</span>
            </div>

            <h1 className="landing-hero-title">
              Kendali Operasional Ritel Anda:
              <br />
              <span className="landing-typewriter-text">
                {currentText}
                <span className="landing-cursor" aria-hidden="true">|</span>
              </span>
            </h1>

            <p className="landing-hero-desc">
              Kelola kasir, pantau stok multi-cabang, dan amankan perputaran kas harian dengan sistem Point of Sale tangguh yang tetap bekerja penuh meski koneksi internet terputus.
            </p>

            <div className="landing-hero-cta-group">
              <button
                type="button"
                onClick={() => setSelectedTier('gen_alpha')}
                className="btn btn-primary landing-cta-primary"
              >
                <span>Mulai Gratis Sekarang</span>
                <ArrowRight size={16} />
              </button>
              <a href="#paket" className="btn btn-outline landing-cta-secondary">
                <span>Lihat Pilihan Paket</span>
              </a>
            </div>

            <div className="landing-trust-strip">
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>Tanpa Biaya Tersembunyi</span>
              </div>
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>PWA Offline-First Resilience</span>
              </div>
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>Aktivasi Instan & Pembayaran QRIS Resmi</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="fitur" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">Dibangun Khusus Mengatasi Masalah Riil Kasir & Pemilik Toko</h2>
              <p className="landing-section-subtitle">
                Fokus pada efisiensi transaksi, pencegahan kecurangan, dan akurasi rekonsiliasi kas di laci kasir.
              </p>
            </div>

            <div className="landing-feature-grid">
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <WifiOff size={22} />
                </div>
                <h3>PWA Kasir Offline-First</h3>
                <p>
                  Kasir tetap dapat memindai barcode, menghitung kembalian, dan mencetak struk belanja saat internet padam. Antrean transaksi otomatis tersinkronisasi kembali saat jaringan online.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <Zap size={22} />
                </div>
                <h3>Rekonsiliasi Shift & Uang Laci</h3>
                <p>
                  Catat modal awal laci, pengeluaran kas kecil (petty cash), hingga setoran akhir shift. Menghilangkan selisih perhitungan antara kasir dan owner secara transparan.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <TrendingUp size={22} />
                </div>
                <h3>Visual Analytics 3-in-1</h3>
                <p>
                  Pantau jam puncak keramaian toko (Hourly Peak Sales), rincian margin profit bersih per produk, dan klasifikasi perputaran barang cepat/lambat (ABC Velocity).
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <Boxes size={22} />
                </div>
                <h3>Multi-Gudang & Transfer Stok</h3>
                <p>
                  Kirim stok antar cabang dengan surat jalan digital, konfirmasi penerimaan barcode, dan peringatan otomatis jika stok toko telah menyentuh batas minimum.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <ShieldCheck size={22} />
                </div>
                <h3>Single-Device Session Lock</h3>
                <p>
                  Mencegah akun kasir dibuka bersamaan di perangkat yang tidak berwenang. Transaksi terkunci aman ke satu terminal kasir yang sedang bertugas.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <ShoppingBag size={22} />
                </div>
                <h3>Struk Belanja Digital & Fisik</h3>
                <p>
                  Cetak struk ke printer thermal Bluetooth/USB atau bagikan nota transaksi ramah lingkungan via tautan web langsung ke smartphone pelanggan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Packages Section */}
        <section id="paket" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">Pilihan Paket Transparan Sesuai Skala Bisnis Anda</h2>
              <p className="landing-section-subtitle">
                Mulai dari paket gratis untuk warung rintisan hingga kendali multi-cabang lengkap dengan analitik enterprise.
              </p>
            </div>

            <div className="landing-pricing-grid">
              {/* Gen Alpha (Free) */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge">Paket Perintis</span>
                  <h3 className="landing-tier-name">GEN ALPHA</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">Rp 0</span>
                    <span className="price-period">/ selamanya</span>
                  </div>
                  <p className="landing-tier-desc">Cocok untuk toko kelontong, kios, atau warung perintis yang baru memulai komputerisasi kasir.</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Hingga 50 item katalog produk</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>1 Akun kasir aktif</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Mode kasir kilat & scan kamera</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Cetak struk thermal & digital</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Offline cache antrean kasir</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_alpha')}
                  className="btn btn-outline landing-pricing-btn"
                >
                  <span>Daftar Akun Gratis</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Beta (Rp 20.000) */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge badge-popular">Toko Berkembang</span>
                  <h3 className="landing-tier-name">GEN BETA</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">Rp 20.000</span>
                    <span className="price-period">/ bulan</span>
                  </div>
                  <p className="landing-tier-desc">Pilihan tepat untuk minimarket, toko grosir, dan retail berkembang dengan tim kasir.</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span><strong>Katalog produk tanpa batas</strong></span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Hingga 3 outlet & 5 akun staf kasir</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Peringatan stok minimum real-time</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Audit shift & rekonsiliasi kas laci</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Ekspor laporan penjualan Excel/CSV</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_beta')}
                  className="btn btn-outline landing-pricing-btn"
                >
                  <span>Pilih Paket Gen Beta</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Gamma (Rp 30.000 - Recommended) */}
              <div className="landing-pricing-card landing-pricing-featured">
                <div className="landing-featured-ribbon">Rekomendasi Terbaik</div>
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge badge-featured">Solusi Lengkap</span>
                  <h3 className="landing-tier-name">GEN GAMMA</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">Rp 30.000</span>
                    <span className="price-period">/ bulan</span>
                  </div>
                  <p className="landing-tier-desc">Solusi all-in-one untuk ritel multi-cabang, waralaba, dan manajemen pergudangan terpadu.</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span><strong>Semua fitur Gen Beta tanpa batas</strong></span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Multi-cabang & multi-gudang bebas</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Visual Analytics 3-in-1 (Peak, Margin, ABC)</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Transfer stok antar cabang & surat jalan</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Single-Device Session Lock (Anti-Fraud)</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>Dukungan prioritas tim teknis PT AlphaGen</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_gamma')}
                  className="btn btn-primary landing-pricing-btn"
                >
                  <span>Pilih Paket Gen Gamma</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reliability & Security Section */}
        <section id="keunggulan" className="landing-section">
          <div className="landing-container">
            <div className="landing-reliability-card">
              <div className="landing-reliability-text">
                <h2 className="landing-section-title">Mengapa Toko Ritel Mempercayakan ALPHOS?</h2>
                <div className="landing-reliability-list">
                  <div className="landing-rel-item">
                    <Lock size={18} className="text-primary" />
                    <div>
                      <strong>Integritas Baris Transaksi</strong>
                      <p>Kunci deterministik berbasis basis data mencegah selisih stok saat checkout bersamaan di multi-kasir.</p>
                    </div>
                  </div>
                  <div className="landing-rel-item">
                    <Store size={18} className="text-primary" />
                    <div>
                      <strong>Resistensi Pemadaman Jaringan</strong>
                      <p>Antrean offline berbasis indexed storage lokal menjamin kasir tetap melayani pembeli tanpa henti.</p>
                    </div>
                  </div>
                  <div className="landing-rel-item">
                    <FileCheck2 size={18} className="text-primary" />
                    <div>
                      <strong>Persetujuan & Verifikasi Resmi</strong>
                      <p>Registrasi paket divalidasi langsung oleh tim internal PT AlphaGen dengan notifikasi email terverifikasi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">Pertanyaan yang Sering Diajukan</h2>
              <p className="landing-section-subtitle">Informasi seputar pendaftaran, aktivasi, dan penggunaan ALPHOS.</p>
            </div>

            <div className="landing-faq-grid">
              <div className="landing-faq-card">
                <h4>Bagaimana cara kerja pembayaran QRIS?</h4>
                <p>
                  Setelah memilih paket berbayar (Gen Beta / Gen Gamma), Anda cukup memindai kode QRIS resmi AlphaGen Ecosystem dari aplikasi perbankan atau e-wallet apa pun, lalu unggah bukti transfer saat mendaftar.
                </p>
              </div>

              <div className="landing-faq-card">
                <h4>Berapa lama proses verifikasi akun?</h4>
                <p>
                  Paket gratis (Gen Alpha) langsung aktif secara instan. Untuk paket berbayar, tim admin kami memverifikasi bukti pembayaran maksimal dalam 15 menit, lalu Anda menerima email aktivasi resmi.
                </p>
              </div>

              <div className="landing-faq-card">
                <h4>Apakah butuh perangkat keras (hardware) khusus?</h4>
                <p>
                  Tidak. ALPHOS berjalan di peramban web modern pada smartphone, tablet, laptop, maupun komputer kasir desktop, dan kompatibel dengan printer struk thermal Bluetooth maupun USB.
                </p>
              </div>

              <div className="landing-faq-card">
                <h4>Bagaimana jika internet di toko mati mendadak?</h4>
                <p>
                  Sistem otomatis beralih ke mode offline. Kasir tetap dapat memindai barang, menghitung total, dan menyelesaikan penjualan. Data akan otomatis disinkronkan saat koneksi kembali pulih.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <AlphosLogo variant="light" width={140} height={34} />
            <p className="landing-footer-tagline">
              Platform Point of Sale dan manajemen ritel cerdas karya anak bangsa.
            </p>
            <p className="landing-footer-corp">
              Dikelola oleh <strong>PT AlphaGen Info</strong> (<a href="mailto:no-reply@alphagen.co.id">no-reply@alphagen.co.id</a>)
            </p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <h5>Navigasi</h5>
              <a href="#fitur">Fitur Utama</a>
              <a href="#paket">Paket Harga</a>
              <a href="#faq">Pertanyaan Umum</a>
              <Link href="/login">Portal Kasir / Login</Link>
            </div>

            <div className="landing-footer-col">
              <h5>Ekosistem ALPHOS</h5>
              <Link href="/login">Kasir & Dashboard Owner</Link>
              <a href="/monitor.html" target="_blank" rel="noopener noreferrer">Command Center Monitoring</a>
              <Link href="/login">Superadmin Internal</Link>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div className="landing-container landing-footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} PT AlphaGen. Seluruh hak cipta dilindungi undang-undang.</span>
            <span>Versi Sistem: 1.5.1 (Production Ready)</span>
          </div>
        </div>
      </footer>

      {/* Registration & Payment Modal */}
      {selectedTier && (
        <RegistrationModal
          initialTier={selectedTier}
          onClose={() => setSelectedTier(null)}
          onSuccess={() => {
            // Keep open to show email instructions or close
          }}
        />
      )}
    </div>
  );
}
