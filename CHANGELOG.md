# Changelog

Semua perubahan penting pada proyek **POS Toko Retail (`react-supabase-app`)** dicatat di file ini.

## [1.0.0] - 2026-11-24 (Fase 1)

### Added
- **Kasir (POS)**: Keranjang belanja, dukungan metode bayar (`Cash`, `QRIS`, `Transfer`), tombol uang pas/nominal cepat, serta checkout atomik 1-request via Supabase RPC `process_sale`.
- **Barcode Scanner Dual-Mode**: Mendukung scanner USB/Bluetooth maupun kamera browser (`html5-qrcode` dengan *lazy-loading*).
- **Cek Harga Cepat**: Mode khusus karyawan untuk memindai barcode dan langsung melihat harga jual serta sisa stok tanpa masuk keranjang.
- **Manajemen Produk & Scan Mutasi Stok**: Tambah/edit/hapus produk dan scan barcode untuk barang masuk (*restock*) maupun pengurangan stok (*rusak, kedaluwarsa, pemakaian toko*) yang tercatat di `stock_logs`.
- **Laporan & Riwayat**: Ringkasan omzet harian, jumlah nota, estimasi laba kotor, peringatan stok menipis, riwayat transaksi, dan riwayat mutasi stok.
- **Digital Receipt**: Preview struk thermal, salin link publik `/receipt/:invoice`, kirim 1-klik ke WhatsApp, dan Print / Simpan PDF (dilengkapi `vercel.json` SPA rewrite).
- **Supabase Versioning**: Tabel `public.app_versions`, komentar versi skema `v1.0.0`, serta index foreign key & penguncian `search_path` pada fungsi `process_sale`.
