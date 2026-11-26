# PRD & LAPORAN RISET RESMI: MODEL BERLANGGANAN ALPHOS POS WEB
**Program Strategis:** Ekosistem Layanan Berlangganan Retail Modern  
**Target Rilis Pengembangan:** Sprint 7 (Desember 2026)  
**Metodologi:** ATM (*Amati, Tiru, Modifikasi*)  
**Penyusun:** Kolaborasi 5 Divisi (Bisnis, Product Owner, MarComm, UI/UX, Frontend Web)  
**Pengesahan:** Anggi Andriansyah (Gege) • Team Leader PT AlphaGen

---

## 1. Latar Belakang & Analisis Pasar Retail Indonesia
Pasar Point of Sale (POS) cloud di Indonesia didominasi oleh pemain konvensional yang membebankan biaya langganan bulanan berkisar **Rp150.000 hingga Rp350.000 per outlet/bulan** (seperti Moka POS, Pawoon, Majoo, Olsera). 

Dari hasil penelusuran sentimen merchant di **Google Reviews, TikTok Bisnis (#keluhankasir, #bisnisretail), dan YouTube Forum Retail**:
1. **Hambatan Biaya Awal (Barrier to Entry):** Toko kelontong, minimarket mandiri, dan boutique ritel pemula enggan beralih dari buku kas manual ke POS karena biaya langganan tahunan terasa berat sebelum mereka melihat ROI.
2. **Kekecewaan Fitur Free yang Terlalu Dikebiri:** Aplikasi freemium kompetitor sering membatasi transaksi kasir harian (misal hanya 20 transaksi/hari) sehingga tidak bisa digunakan untuk operasional toko sesungguhnya.
3. **Kebutuhan Fitur Andalan:** Pemilik toko membutuhkan analitik visual tren omzet, transfer stok antar cabang, dan sistem keamanan sesi kasir tanpa biaya mahal.

---

## 2. Matriks Komparasi Kompetitor (Prinsip ATM: Amati, Tiru, Modifikasi)

| Penyedia POS | Model Harga Pasar | Kelemahan di Lapangan (Amati) | Fitur Ditiru (Tiru) | Diferensiasi ALPHOS (Modifikasi) |
|:---|:---|:---|:---|:---|
| **Moka POS** | Rp299.000 / bln / outlet | Tidak ada paket gratis, add-on analitik berbayar lagi. | Desain UI back-office yang bersih dan laporan stok varian. | **Gen Gamma (Rp30.000/bln)** memberikan fitur setara Moka dengan efisiensi biaya hingga 90%. |
| **Majoo** | Rp149.000 - Rp249.000 / bln | Kontrak terkunci per tahun, aplikasi berat di HP spek rendah. | Multi-outlet switch dan laporan laba kotor harian. | Aplikasi PWA ultra-ringan berbasis Next.js dengan native SVG rendering <30ms. |
| **Qasir** | Freemium (Add-on Rp20.000 - Rp50.000 per fitur) | Banyak fitur print struk & laporan terpisah-pisah sehingga total tagihan membengkak. | Kemudahan registrasi cepat dan kasir mandiri gratis. | **All-in-One Tiering**: Tanpa biaya tersembunyi, semua fitur andalan paket terbuka tuntas. |
| **Pawoon** | Rp299.000 / bln | Customer support lambat merespons keluhan multi-cabang. | Notifikasi stok menipis dan sistem kasir shift. | Integrasi realtime database Supabase dengan latency sync <50ms. |

---

## 3. Rencana Paket Langganan ALPHOS (3 Label Resmi)

### 🟢 1. GEN ALPHA — *Freemium Entry-Point*
* **Harga:** **Rp 0 / Selamanya (Free Forever)**
* **Target Pengguna:** Toko ritel mikro, kios baru, warung kelontong pemula.
* **Fitur Terbuka:**
  * Bebas login & transaksi kasir POS Web tanpa batas transaksi harian.
  * 1 Outlet mandiri & 1 Akun kasir aktif.
  * Maksimal 50 Item Katalog Produk & Barcode scanner kamera.
  * Cetak struk digital (WhatsApp / Web view).
  * Pencatatan kas masuk/keluar (Petty Cash).
* **Fitur Andalan Di-Lock (Badge Gembok):**
  * 🔒 *Visual Analytics 3-in-1* (Line, Bar, Donut chart ditutup preview blur).
  * 🔒 *Multi-Outlet & Multi-Warehouse Stock Transfer*.
  * 🔒 *Single-Device Active Session Enforcer*.

---

### 🔵 2. GEN BETA — *Growth Retail Store*
* **Harga:** **Rp 20.000 / Bulan** (atau Rp200.000 / Tahun - Hemat 2 Bulan)
* **Target Pengguna:** Toko ritel bertumbuh dengan kasir bergantian dan varian produk melimpah.
* **Fitur Terbuka:**
  * **Semua Fitur Gen Alpha 100%**.
  * Hingga **3 Outlet** & **5 Akun Kasir**.
  * **Unlimited Produk & Kategori** tanpa batasan.
  * Smart Stock Alert (Pemberitahuan produk menipis & reorder).
  * Multi-Metode Pembayaran (Cash, QRIS Statis, Transfer Bank).
  * Ekspor Riwayat Transaksi ke Format CSV / Excel.
  * Manajemen Shift Kasir & Rekonsiliasi Kas Otomatis.
* **Fitur Andalan Di-Lock:**
  * 🔒 *Visual Analytics 3-in-1 Lengkap* (Khusus Gen Gamma).
  * 🔒 *Multi-Warehouse Inter-Branch Stock Transfer*.

---

### 🟣 3. GEN GAMMA — *Ultimate Enterprise Pro (Rekomendasi)*
* **Harga:** **Rp 30.000 / Bulan** (atau Rp300.000 / Tahun - Akses Penuh)
* **Target Pengguna:** Bisnis ritel multi-cabang, grosir, minimarket modern, dan rantai toko.
* **Fitur Terbuka (Unlocks 100% Fitur Andalan ALPHOS):**
  * **Semua Fitur Gen Beta 100%**.
  * **UNLIMITED Outlet & UNLIMITED Akun Kasir**.
  * **Interactive Visual Analytics 3-in-1:** Selector grafik garis (tren omzet harian/mingguan), diagram batang (perbandingan kategori terlaris), dan donut chart (komposisi payment method) dengan tombol cetak laporan bersih.
  * **Multi-Warehouse & Transfer Antar Gudang:** Pelacakan mutasi stok antar cabang dengan nota transfer digital.
  * **Mode Offline PWA (IndexedDB Resilience):** Kasir tetap dapat scan barcode dan cetak struk meski internet mati total, auto-sync saat online.
  * **Single-Device Active Session Enforcer:** Proteksi akun kasir dari penggunaan bersama secara tidak sah.
  * **Prioritas Jalur Cloud Supabase & Export Laporan Pajak PPN Resmi**.

---

## 4. Arsitektur Teknis & Komponen UI/UX (Kesiapan Sprint 7)

```tsx
// Skema Implementasi Client-Side Feature Gating di Next.js (Sprint 7)
export function FeatureGate({
  feature,
  userTier,
  children,
  fallbackPreview,
}: FeatureGateProps) {
  const isAllowed = checkTierEntitlement(userTier, feature);

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-800">
      <div className="filter blur-sm pointer-events-none select-none opacity-40">
        {fallbackPreview || children}
      </div>
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-3 shadow-lg">
          <Lock size={24} />
        </div>
        <h4 className="text-white font-extrabold text-sm mb-1">Fitur Khusus Berlangganan</h4>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Buka fitur ini dengan berlangganan paket Gen Beta (Rp20k) atau Gen Gamma (Rp30k).
        </p>
        <button
          onClick={() => triggerUpgradeModal(feature)}
          className="btn btn-primary btn-sm px-4 py-2 text-xs font-bold shadow-emerald-500/20"
        >
          🚀 Upgrade Sekarang Mulai Rp20.000
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Timeline Eksekusi Sprint 7
1. **Pekan 1:** Slicing UI Landing Page Pricing Table, Modal Checkout Pembayaran QRIS Midtrans/Xendit Sandbox, dan RPC Database Schema Subscription.
2. **Pekan 2:** Integrasi `<FeatureGate>` di seluruh halaman kasir & analitik, pengujian regresi bersama adik-adik magang *AlphaGen Talent*, dan rilis resmi v2.0.0.

*Dokumen ini sah dan siap dijadikan landasan konstruksi Sprint 7.*
