# Dokumentasi Resmi POS Toko Retail (v1.3.0)

Repositori ini menyimpan seluruh dokumentasi resmi teknis, operasional, pengujian mutu, dan sertifikasi deployment sistem **POS Toko Retail** dalam format **PDF siap cetak / siap bagikan**:

---

## 📑 Daftar Dokumen PDF Resmi

| No | Dokumen PDF | Deskripsi & Isi Pokok | Ukuran |
|:---:|:---|:---|:---:|
| **1** | [**`01_DOKUMEN_VERSIONING_v1.0_sd_v1.3.pdf`**](./pdf/01_DOKUMEN_VERSIONING_v1.0_sd_v1.3.pdf) | **Dokumen Riwayat Versi & Enhancement**<br>• Rangkuman evolusi dari v1.0.0 (MVP), v1.1.0 (Auth & Shift), v1.2.0 (Next.js & Realtime), hingga v1.3.0 (Diskon, PPN, Store Settings, CSV).<br>• Perubahan arsitektur, skema database, keamanan RLS, dan panduan upgrade. | ~180 KB |
| **2** | [**`02_USER_MANUAL_GUIDE_v1.3.0.pdf`**](./pdf/02_USER_MANUAL_GUIDE_v1.3.0.pdf) | **Buku Panduan Pengguna (User Manual Guide) v1.3.0**<br>• Panduan lengkap operasional untuk Kasir (Buka/Tutup Shift, Jam Digital, Petty Cash, Transaksi Kasir, Diskon Item Rp/%, Diskon Nota Rp/%, PPN, Kembalian, Struk Cetak/WhatsApp, Stock Request).<br>• Panduan untuk Owner/Admin (Mode Kasir, Manajemen Produk, Barcode Scanner Kamera, Live Monitor Realtime, Pengaturan Toko Dinamis, Laporan & Filter Tanggal, Export CSV Penjualan/Mutasi Stok ke Excel, Kelola Kasir & Staff).<br>• FAQ & Troubleshooting lengkap. | ~187 KB |
| **3** | [**`03_LAPORAN_PENGUJIAN_AKHIR_v1.3.0.pdf`**](./pdf/03_LAPORAN_PENGUJIAN_AKHIR_v1.3.0.pdf) | **Laporan Pengujian Akhir (Final Test Report)**<br>• Hasil verifikasi Quality Gates: Typecheck (0 error), Oxlint (0 error/warning), Unit & Integration Test (19/19 Pass), E2E Combinatorial Matrix (93 Pass / 0 Fail), Next.js Build Sukses.<br>• Matriks Ketertelusuran Kebutuhan (Requirements Traceability Matrix US-3.1 sd US-3.4 & Dual-Role).<br>• Lembar Hasil UAT (User Acceptance Testing) Manual Checklist. | ~142 KB |
| **4** | [**`04_SERTIFIKASI_DEPLOYMENT_v1.3.0.pdf`**](./pdf/04_SERTIFIKASI_DEPLOYMENT_v1.3.0.pdf) | **Sertifikasi Deployment Production (Production Sign-Off)**<br>• Lembar Pengesahan Rilis Resmi v1.3.0.<br>• Metadata deployment: Git Commit SHA `d8559c5`, Vercel Production Ready (23s), Supabase Production `sbtzajhgchpcdscrwtha` migrasi database sukses (5 batch), Google OAuth Verified.<br>• Quality Gate Sign-Off, Analisis Risiko & Rollback Plan darurat.<br>• Lembar Pengesahan & Tanda Tangan (Lead Dev, QA, DevOps, Product Owner). | ~140 KB |

---

## 🌐 Lingkungan Sistem
- **Production URL:** [https://pos-retail-umber.vercel.app/](https://pos-retail-umber.vercel.app/)
- **Development (DEV) URL:** [https://pos-retail-git-develop-anggiandriansyah.vercel.app/](https://pos-retail-git-develop-anggiandriansyah.vercel.app/)
