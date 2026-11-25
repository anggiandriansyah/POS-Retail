# Dokumen Perubahan Rilis (Release Notes & Changelog Detail)
**Aplikasi:** ALPHOS by AlphaGen (`react-supabase-app` & `mobile/`)  
**Versi:** v1.4.0 (Sprint 4)  
**Tanggal Rilis:** 25 November 2026  
**Penulis:** Technical Writer (TW) ALPHOS Team  
**Status Evaluasi:** DEV Verified (`tcbhaiyhtndnqgatysmh`) • PROD Locked (`sbtzajhgchpcdscrwtha`)

---

## 1. Ringkasan Eksekutif

Rilis **v1.4.0 (Sprint 4)** merupakan tonggak evolusi terbesar platform POS dan manajemen inventaris AlphaGen. Pada versi ini, sistem melakukan **rebranding menyeluruh menjadi ALPHOS by AlphaGen**, merombak antarmuka Web dengan standar ketat **Anti-UI-Slop** dan **Anti-AI-Slop**, serta meluncurkan aplikasi native **Mobile Android (React Native)** yang mengonsumsi Shared Core secara langsung.

Seluruh deliverable pada rilis ini tunduk pada pengawasan mutu berlapis (*Quality Gates M1–M6*), audit aksesibilitas WCAG AA, serta kompilasi **5 Dokumen SOP Rilis Resmi (Format PDF A4)**.

---

## 2. Rincian Perubahan Per Komponen

### A. Rebranding & Identitas Visual (Konsep 2)
1. **Logo Baru ALPHOS (Konsep 2):**
   - Menggunakan kurva tunggal *Alpha-Checkmark* terbuka (*open-stroke*) dengan ketebalan presisi tanpa penutup kotak (*unboxed*) dan tanpa titik (*dotless*).
   - Menghilangkan sepenuhnya kata `"POS"` dari seluruh lockup logo; identitas tunggal kini adalah **ALPHOS** dengan tagline resmi **by AlphaGen**.
   - Disediakan dalam 4 varian visual terstandarisasi:
     - `horizontal`: Mode gelap default untuk navbar Web desktop/tablet (`#10B981` / `#F8FAFC`).
     - `vertical`: Mode compact/center untuk hero login Web dan mobile splash.
     - `light`: Palet kontras tinggi untuk mode terang (`#059669` / `#0F172A`).
     - `thermal`: Khusus monokrom hitam-putih (`#000000`, font monospace) untuk struk fisik kasir.
2. **Favicon Resmi:**
   - Memperbarui `public/favicon.svg` ke siluet Alpha-Checkmark tanpa elemen usang kotak `#863bff`.
3. **Pembersihan Artefak Usang:**
   - Menghapus artefak Vite (`public/icons.svg` dan folder `dist/`).

---

### B. Revamp Web Application (Next.js 16 App Router) — Standar Anti-UI-Slop
1. **Aksesibilitas Kontras WCAG AA:**
   - Variabel warna utama `--primary` distandarkan ke `#047857` (rasio kontras 4.5:1 terhadap background terang maupun gelap), menjamin keterbacaan teks kecil dan tombol aksi.
   - Peningkatan kontras teks sekunder pada tombol swipe switch bahasa/tema dan tab login.
2. **Eliminasi Dialog Primitif Browser:**
   - Menghapus penggunaan `window.confirm` pada penghapusan item inventaris (`InventoryManager.tsx`), digantikan oleh *inline confirmation popover/action sheet* interaktif.
   - Menghapus penggunaan `window.prompt` pada penyalinan link struk publik (`ReceiptModal.tsx`), digantikan oleh *fallback copy URL box* dengan aksi 1-klik salin ke clipboard.
3. **Eliminasi Pemotongan Data (Silent Truncation):**
   - Menghilangkan pembatasan `.slice(0, 12)` pada pencarian katalog kasir (`PosCashier.tsx`), menampilkan seluruh item yang cocok dengan *scroll area* responsif.
4. **Responsivitas Viewport & Zero Horizontal Overflow:**
   - Menjamin 0 horizontal overflow pada seluruh 15 permukaan antarmuka Web di resolusi mobile (`375px`), tablet (`768px`), dan desktop (`1440px`).
   - Angka desimal dan nominal keuangan menggunakan token tipografi `tabular-nums` untuk perataan angka kasir yang konsisten.
5. **Paritas Penuh Bahasa (Bilingual ID/EN):**
   - Penambahan kunci lokalisasi lengkap pada `src/i18n/translations.ts` meliputi modul navigasi mobile, scanner, WhatsApp share, dan pengaturan printer thermal.
   - Integrasi hook `useThemeLang` di seluruh modul: `ReceiptContent`, `ReceiptModal`, `InventoryManager`, `StoreSettingsForm`, `ReportsView`, `PriceChecker`, dan `OwnerShifts`.

---

### C. Peluncuran Aplikasi Mobile Android (React Native — `mobile/`)
Sub-proyek baru `mobile/` dibangun dengan arsitektur React Native + Hermes engine (`US-4.1` s.d. `US-4.6`):

1. **US-4.1 & US-4.2: Inisialisasi, Autentikasi & Routing Multi-Peran:**
   - Mengonsumsi Shared Core (`src/types/pos.ts`, `src/utils/pricing.ts`, `src/utils/format.ts`, `src/i18n/translations.ts`) langsung melalui konfigurasi `watchFolders` Metro dan TypeScript paths mapping tanpa duplikasi kode.
   - Autentikasi fleksibel via `@username` atau email melalui RPC `resolve_login_email`.
   - Routing 4 peran dinamis (`owner`, `admin`, `kasir`, `user`) berbasis helper `isAdminRole()`.
   - Penjaga akun nonaktif (*is_active check*) dan toggle mandiri bahasa (ID/EN) serta tema (Dark `#090e1a` / Light `#ffffff`).
2. **US-4.3: Manajemen Shift Kasir & Petty Cash:**
   - Alur buka shift kasir dengan input modal awal.
   - Pencatatan kas masuk/keluar (*Petty Cash*) dengan 5 kategori terstandarisasi: `OPERASIONAL`, `KEMBALIAN`, `BELANJA_DARURAT`, `SETOR_BANK`, dan `LAINNYA`.
   - Tutup shift kasir berbasis RPC `close_shift` dengan rekonsiliasi kas riil terhadap kas sistem dan ringkasan selisih.
3. **US-4.4: Kasir Mobile, Kamera Scanner & WhatsApp Struk:**
   - Pemindai barcode native memanfaatkan kamera smartphone via Expo Camera, dilengkapi kontrol lampu senter (*torch*) dan fallback input manual keyboard.
   - Perhitungan diskon fleksibel (nominal `Rp` atau persentase `%`) per item dan per transaksi nota, serta kalkulasi PPN via Shared Core `pricing.ts`.
   - Transaksi kasir atomik melalui RPC `process_sale`.
   - Pembagian struk digital instan melalui WhatsApp (`wa.me`) dengan link publik struk DEV.
4. **US-4.5: Owner Live Monitor & Permintaan Stok:**
   - Pemantauan toko langsung (*real-time*) mendengarkan perubahan tabel Supabase (`transactions`, `products`, `stock_requests`).
   - Peringatan otomatis untuk produk dengan stok menipis (`stock <= min_stock`).
   - Pengajuan permintaan stok barang (*Stock Request*) oleh kasir, dengan aksi verifikasi langsung oleh Owner: **Approve (Setujui)**, **Restock (Isi Stok)**, atau **Reject (Tolak)**.
5. **US-4.6: Bluetooth Thermal Printing (ESC/POS):**
   - Modul pembangun byte ESC/POS murni (`mobile/src/utils/escpos.ts`) yang mendukung ukuran kertas `58 mm` (32 kolom) dan `80 mm` (48 kolom).
   - Inisialisasi printer diawali byte `ESC @` (`0x1b 0x40`) dan diakhiri pemotong kertas otomatis `GS V` (`0x1d 0x56 0x00`).
   - Header cetak resmi: *Struk Thermal* **ALPHOS by AlphaGen**.
   - Layanan Bluetooth printer dengan penemuan perangkat (*device discovery*), koneksi/pairing, dan *live preview text fallback* saat tidak tersambung ke printer fisik.

---

### D. Tata Kelola Proses, Audit Dual-Slop & Dokumen Mutu
1. **Panduan Peran Tim Produk (`docs/process/`):**
   - `ROLE_UIUX_GUIDE.md`: Standar perancangan antarmuka Konsep 2, aturan viewport 375/768/1440px, kontras WCAG AA, dan state interaksi.
   - `ROLE_MARKOM_GUIDE.md`: Standar komunikasi merek, penulisan narasi bebas AI cliché, kit rilis, dan terminologi resmi ALPHOS.
   - `ROLE_QA_MANUAL_GUIDE.md`: Prosedur pengujian manual fungsional Web dan Mobile, audit form, scanner kamera, dan validasi struk thermal.
2. **Rubrik Anti-UI-Slop & Anti-AI-Slop:**
   - Dokumen `ANTI_UI_AI_SLOP_RUBRIC.md` selesai dievaluasi dengan status **100% PASS** (15 item Web W-01..W-15, 10 item Mobile M-01..M-10, dan 8 item Copywriting A-01..A-08).
3. **Kesiapan Bisnis Product Owner:**
   - Dokumen `PO_BUSINESS_READINESS_v1.4.0.md` ditandatangani penuh dengan status **APPROVED** untuk seluruh Blok A s.d. Blok E.

---

### E. Paket 5 Dokumen SOP Rilis Resmi (Format PDF A4)
Dihasilkan secara otomatis melalui skrip headless browser `scripts/build-release-pdfs.mjs` di direktori `docs/pdf/`:
1. `01_DOKUMEN_VERSIONING_v1.4.0.pdf`: Riwayat evolusi v1.0.0 s.d. v1.4.0.
2. `02_USER_MANUAL_GUIDE_v1.4.0.pdf`: Panduan operasional pengguna Web & Mobile.
3. `03_LAPORAN_PENGUJIAN_AKHIR_v1.4.0.pdf`: Hasil uji verifikasi automated, integration, dan E2E.
4. `04_SERTIFIKASI_DEPLOYMENT_v1.4.0.pdf`: Sertifikasi kesiapan rilis dan kepatuhan arsitektur.
5. `05_SOP_RILIS_DAN_DOKUMENTASI_v1.4.0.pdf`: Standar operasional prosedur rilis berulang.

---

## 3. Isolasi Keamanan Database Supabase

| Lingkungan | Supabase Project Ref | Status Kebijakan | Catatan Keamanan |
|---|---|---|---|
| **DEV** | `tcbhaiyhtndnqgatysmh` | **ACTIVE / TARGET** | Seluruh pengujian otomatis, integrasi Web & Mobile, serta RPC migration berjalan aman di lingkungan ini. |
| **PROD** | `sbtzajhgchpcdscrwtha` | **LOCKED / UNTOUCHED** | **BLOCKED**. Tidak ada script build, migrasi, atau uji coba yang menyentuh environment produksi tanpa persetujuan eksplisit. |

---

## 4. Matriks Ringkasan Rilis (Quality Gate M6)

| Gerbang Kualitas | Target Mutu | Status Hasil |
|---|---|---|
| **Web Typecheck** | `tsc --noEmit` -> 0 errors | **PASS** (0 errors) |
| **Mobile Typecheck** | `mobile/tsc --noEmit` -> 0 errors | **PASS** (0 errors) |
| **Linting** | `oxlint` -> 0 warnings / 0 errors | **PASS** (0 warnings, 0 errors) |
| **Web Unit Tests** | `npm test` -> 100% lulus | **PASS** (24 tests pass) |
| **Mobile Unit Tests** | `mobile/npm test` -> 100% lulus | **PASS** (4 tests pass) |
| **Sprint 4 Tier 1 E2E** | Happy Path & Contract Tests | **PASS** (85 tests evaluated) |
| **Dokumentasi PDF** | 5 Dokumen A4 di `docs/pdf/` | **COMPLETE** (5 file PDF terverifikasi) |
| **DEV Server Preview** | `http://localhost:3000` | **ONLINE** (Next.js Dev Server aktif) |

---
*Dokumen ini disusun dan dipelihara secara resmi oleh Technical Writer (TW) untuk memastikan transparansi dan integritas rilis ALPHOS by AlphaGen v1.4.0.*
