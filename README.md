# POS Toko Retail (`v1.3.0`)

Aplikasi Kasir & Manajemen Toko Retail Modern berbasis **Next.js 16 (App Router + Turbopack)**, **TypeScript**, dan **Supabase (PostgreSQL + Auth + Realtime + RLS)**.

- **🌐 Live Production:** [https://pos-retail-umber.vercel.app/](https://pos-retail-umber.vercel.app/)
- **🧪 Live DEV Preview:** [https://pos-retail-git-develop-anggiandriansyah.vercel.app/](https://pos-retail-git-develop-anggiandriansyah.vercel.app/)

---

## 📚 Dokumentasi Resmi (Format PDF)

Seluruh dokumen teknis dan operasional resmi tersimpan di folder [`docs/`](./docs/README.md) dalam format **PDF siap cetak**:

1. [**Dokumen Riwayat Versi & Enhancement (v1.0.0 s/d v1.3.0)**](./docs/pdf/01_DOKUMEN_VERSIONING_v1.0_sd_v1.3.pdf) — Rangkuman evolusi fitur, skema database, dan panduan upgrade.
2. [**Buku Panduan Pengguna (User Manual Guide v1.3.0)**](./docs/pdf/02_USER_MANUAL_GUIDE_v1.3.0.pdf) — Panduan lengkap operasional untuk Kasir dan Owner.
3. [**Laporan Pengujian Akhir (Final Test Report v1.3.0)**](./docs/pdf/03_LAPORAN_PENGUJIAN_AKHIR_v1.3.0.pdf) — Verifikasi Quality Gate, matriks ketertelusuran kebutuhan, dan hasil UAT.
4. [**Sertifikasi Deployment Production (Production Sign-Off)**](./docs/pdf/04_SERTIFIKASI_DEPLOYMENT_v1.3.0.pdf) — Pengesahan rilis resmi, metadata deployment, dan analisis risiko/rollback.

---

## 🚀 Fitur Unggulan v1.3.0
- **Pengaturan Toko Dinamis:** Nama toko, alamat, telepon, catatan footer struk, dan tarif pajak yang dapat dikustomisasi langsung oleh Owner.
- **Diskon Fleksibel & Pajak PPN:** Diskon per item (`Rp` atau `%`), diskon nota global, dan kotak centang PPN opsional.
- **Laporan & Export Excel (CSV):** Filter rentang tanggal serta export data transaksi penjualan dan mutasi stok ke CSV berstandar RFC-4180 dengan UTF-8 BOM.
- **Manajemen Shift & Petty Cash:** Buka/tutup shift kasir dengan jam digital real-time, pencatatan kas masuk/keluar, dan rekonsiliasi kas otomatis.
- **Autentikasi & Multi-Role:** Dukungan login username/email, Google OAuth, serta 4 role sistem (`owner`, `admin`, `kasir`, `user`).
- **Live Monitor Realtime:** Pemantauan transaksi dan stok secara langsung dengan aksi 1-klik Approve/Reject permintaan kasir.
- **Arsitektur Shared Core:** Logika bisnis murni bebas DOM, siap diintegrasikan dengan aplikasi mobile React Native pada Sprint 4.
