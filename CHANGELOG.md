# Changelog

Semua perubahan penting pada proyek **POS Toko Retail (`react-supabase-app`)** dicatat di file ini.

## [1.3.0] - 2026-11-24 (Fase 2 - Sprint 3 DEV)

### Added
- **Pengaturan Toko Dinamis (`store_settings`)**: Penambahan tabel `store_settings`, context `StoreSettingsProvider`, form **Pengaturan Toko** untuk Owner/Admin (nama toko, alamat, telepon, catatan footer struk, serta tarif pajak/PPN opsional), dan dukungan pada struk digital publik (`get_public_receipt`).
- **Diskon & Pajak/PPN di Kasir**: Dukungan diskon per item dan diskon transaksi (`Rp` / `%`) serta opsi terapkan PPN (`applyTax`) pada `PosCashier` dan fungsi RPC `process_sale` dengan perhitungan sisi server yang tervalidasi.
- **Filter Rentang Tanggal & Export CSV**: Penambahan filter tanggal (`startDate` / `endDate`) serta tombol **Export Penjualan (CSV)** dan **Export Mutasi Stok (CSV)** di `ReportsView` dengan UTF-8 BOM, RFC-4180 escaping, dan proteksi formula injection (`src/utils/csv.ts`).
- **Kompatibilitas Dual Role (`admin`/`user` & `owner`/`kasir`)**: Penambahan helper `isAdminRole()` dan pembaruan RLS/SQL agar mendukung role `admin` dan `user` tanpa memutus akun `owner` dan `kasir` yang sudah ada.

### Changed
- **Shared Core Siap React Native**: Modul `src/types/pos.ts`, `src/utils/format.ts`, `src/utils/pricing.ts`, `src/utils/csv.ts`, dan `src/i18n/translations.ts` dijaga bebas dependensi browser untuk persiapan Sprint 4 (React Native).

## [1.2.0] - 2026-11-24 (Fase 2 - Sprint 2 Refinement & Production Release)

### Added
- **Migrasi Next.js 16 App Router + TypeScript**: Migrasi arsitektur aplikasi ke Next.js `16.4.6` (App Router + Turbopack) dengan TypeScript penuh (`/` Static dan `/receipt/[invoice]` Dynamic).
- **Sign In Username/Email & Sign Up**: Sign In menggunakan Username atau Email melalui fungsi RPC `resolve_login_email`, serta Sign Up dengan Google OAuth atau Email + Password + Confirm Password (akun Kasir tetap dikelola oleh Owner).
- **Bilingual (ID/EN) & Dark/Light Mode**: Dukungan pergantian bahasa Indonesia/Inggris dan tema gelap/terang menggunakan tombol swipe toggle (bendera ID/EN dan ikon Bulan/Matahari) yang tersimpan di `localStorage`.
- **Digital Clock Shift**: Penambahan jam digital real-time (`HH:MM:SS`) saat melakukan Open Shift maupun Close Shift.
- **Kasir Stock Request**: Fitur pengajuan permintaan stok (`stock_requests`) oleh Kasir untuk meminta pengisian ulang stok barang yang habis ke Owner.
- **Owner Live Monitor & Dukungan Username**: Pemantauan aktivitas toko secara langsung berbasis Supabase Realtime (`transactions`, `products`, `shifts`, `stock_requests`) dengan aksi 1-klik **Restock / Approve / Reject**, serta dukungan `@username` di menu **Kelola Kasir**.
- **Rilis Production & Sertifikasi**: Seluruh Quality Gate di DEV lulus (`tsc --noEmit` 0 errors, `oxlint` 0 warnings/0 errors pada 29 file, `npm test` 19/19 passed, `next build` sukses, warm RPC latency ~41–62 ms, UAT & Regression PASS) dan aplikasi dirilis ke Production.

### Changed
- **Upgrade Barcode Scanner**: Peningkatan pemindai barcode dengan dukungan `BarcodeDetector`, *continuous autofocus*, mode **Photo Scan** (scan dari foto/gambar), serta integrasi pemindai kamera langsung pada form **Tambah Produk**.
- **Automated Test Suite**: Cakupan pengujian otomatis pada `tests/sprint2.test.mjs` diperluas dari 14 menjadi 19 tests.

## [1.1.0] - 2026-11-24 (Fase 2 - Sprint 2)

### Added
- **Autentikasi & Pemisahan Role**: Login berbasis Supabase Auth dengan pemisahan peran `Owner` dan `Kasir` melalui tabel profil/role pengguna.
- **Pemisahan UI POV Kasir vs POV Owner**: Tampilan antarmuka disesuaikan otomatis berdasarkan role—kasir fokus pada operasional transaksi, sedangkan owner memiliki akses manajemen penuh termasuk **Mode Kasir** untuk ikut melayani penjualan.
- **Shift Kasir & Petty Cash**: Fitur buka/tutup shift kasir dengan pencatatan modal awal, kas masuk/keluar (*Petty Cash* `IN`/`OUT`), rekonsiliasi kas akhir, serta fitur **Force Close** oleh Owner untuk menutup paksa shift yang masih aktif.
- **Automated Test Suite**: Penambahan `tests/sprint2.test.mjs` (14 tests) untuk memverifikasi alur autentikasi, role, shift kasir, petty cash, dan akses struk publik.

### Security
- **Penguncian RLS (Row Level Security)**: Kebijakan akses tabel diperketat hanya untuk pengguna terautentikasi sesuai peran (`Owner` vs `Kasir`).
- **Digital Receipt Publik Aman**: Akses struk publik `/receipt/:invoice` kini dilayani melalui fungsi RPC `get_public_receipt` (`SECURITY DEFINER`) tanpa membuka akses tabel langsung ke role `anon`.

### Changed
- **Optimasi Code-Splitting**: Penerapan `React.lazy` dan `Suspense` pada rute/komponen halaman utama untuk mempercepat waktu muat awal aplikasi.

## [1.0.0] - 2026-11-24 (Fase 1)

### Added
- **Kasir (POS)**: Keranjang belanja, dukungan metode bayar (`Cash`, `QRIS`, `Transfer`), tombol uang pas/nominal cepat, serta checkout atomik 1-request via Supabase RPC `process_sale`.
- **Barcode Scanner Dual-Mode**: Mendukung scanner USB/Bluetooth maupun kamera browser (`html5-qrcode` dengan *lazy-loading*).
- **Cek Harga Cepat**: Mode khusus karyawan untuk memindai barcode dan langsung melihat harga jual serta sisa stok tanpa masuk keranjang.
- **Manajemen Produk & Scan Mutasi Stok**: Tambah/edit/hapus produk dan scan barcode untuk barang masuk (*restock*) maupun pengurangan stok (*rusak, kedaluwarsa, pemakaian toko*) yang tercatat di `stock_logs`.
- **Laporan & Riwayat**: Ringkasan omzet harian, jumlah nota, estimasi laba kotor, peringatan stok menipis, riwayat transaksi, dan riwayat mutasi stok.
- **Digital Receipt**: Preview struk thermal, salin link publik `/receipt/:invoice`, kirim 1-klik ke WhatsApp, dan Print / Simpan PDF (dilengkapi `vercel.json` SPA rewrite).
- **Supabase Versioning**: Tabel `public.app_versions`, komentar versi skema `v1.0.0`, serta index foreign key & penguncian `search_path` pada fungsi `process_sale`.
