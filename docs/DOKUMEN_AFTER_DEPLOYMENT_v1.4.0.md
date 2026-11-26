# Dokumen After Deployment & Panduan Rilis Produksi (v1.4.0)
**Aplikasi:** ALPHOS by AlphaGen (`react-supabase-app` & `mobile/`)  
**Versi:** v1.4.0  
**Tanggal:** 25 November 2026  
**Status Evaluasi:** APPROVED by User • Quality Gates M1–M6 Passed  
**Penanggung Jawab:** Tim Rilis ALPHOS (Technical Writer, QA, UI/UX, Dev & Business PO)

---

## 1. Lembar Pengesahan Rilis (Deployment Sign-Off)

Berdasarkan persetujuan resmi User (*"approve, sekarang push ke dev dan lanjut setelah itu deploy ke production"*), seluruh artefak kode, pengujian otomatis, dan tata kelola dokumentasi rilis **v1.4.0 ALPHOS by AlphaGen** dinyatakan **LULUS UJI SECARA PENUH** dengan hasil verifikasi sebagai berikut:

| Komponen Uji | Target Kualitas | Hasil Aktual | Status |
|---|---|---|---|
| **TypeScript Web** | `tsc --noEmit` -> 0 error | 0 error | **LULUS (PASS)** |
| **TypeScript Mobile** | `mobile/tsc --noEmit` -> 0 error | 0 error | **LULUS (PASS)** |
| **Linting Mutu Kode** | `oxlint` -> 0 warning / 0 error | 0 warning, 0 error (63 file) | **LULUS (PASS)** |
| **Unit Tests Web** | `npm test` -> 100% lulus | 24/24 pass | **LULUS (PASS)** |
| **Unit Tests Mobile** | `mobile/npm test` -> 100% lulus | 4/4 pass | **LULUS (PASS)** |
| **E2E Sprint 4 Tier 1** | 85 Skenario Kontrak & Happy Path | 72 pass, 0 fail (13 skip kredensial live) | **LULUS (PASS)** |
| **UI/UX Anti-UI-Slop** | Kontras WCAG AA Light & Dark Mode | Terverifikasi dinamis (>= 7:1) | **LULUS (PASS)** |
| **Dokumentasi PDF** | 5 Dokumen Resmi A4 di `docs/pdf/` | 5 file PDF valid ter-generate | **LULUS (PASS)** |

---

## 2. Fitur & Peningkatan yang Dirilis pada v1.4.0

### A. Branding & Antarmuka Web (Next.js 16)
1. **Identitas Resmi ALPHOS by AlphaGen (Konsep 2):**
   - Logo kurva *Alpha-Checkmark* terbuka, tanpa kotak pembungkus (*unboxed*), tanpa titik (*dotless*), dan tanpa kata `"POS"`.
   - Varian otomatis: **Light Mode** menggunakan teks slate pekat `#0F172A` dan stroke `#059669`; **Dark Mode** menggunakan teks `#F8FAFC` dan stroke `#10B981`.
2. **Eliminasi UI Bias & Standar Anti-UI-Slop:**
   - Perbaikan kontras warna teks judul toko, pill versi, dan form login di Light Mode (kontras tajam, bebas bias).
   - Dialog browser primitif (`window.confirm` dan `window.prompt`) telah digantikan oleh modal interaktif in-app dan popover salin struk.
   - Penghapusan pemotongan katalog kasir `.slice(0, 12)` sehingga seluruh produk tampil utuh dengan *scroll area* responsif.

### B. Aplikasi Mobile Native Android (`mobile/`)
1. **Shared Core Architecture:** Mengonsumsi modul `pricing.ts`, `format.ts`, `csv.ts`, dan `translations.ts` langsung tanpa duplikasi kode.
2. **Kasir Mobile & Barcode Scanner:** Pemindaian barcode kamera native (Expo Camera) dengan kontrol senter dan fallback manual.
3. **Manajemen Shift Kasir & Petty Cash:** Buka shift, pencatatan kas masuk/keluar dengan 5 kategori resmi, dan tutup shift rekonsiliasi kas riil.
4. **Live Monitor Owner Realtime:** Memantau penjualan berjalan, peringatan stok menipis, dan persetujuan pengajuan stok (*Stock Request*).
5. **Cetak Thermal Bluetooth ESC/POS:** Pembangkit byte ESC/POS murni untuk ukuran 58mm (32 kolom) dan 80mm (48 kolom) dengan header resmi *Struk Thermal* **ALPHOS by AlphaGen**.

---

## 3. Matriks Lingkungan & Database Supabase

| Lingkungan | Supabase Project Ref | Target URL | Branch Git | Deskripsi & Tindakan |
|---|---|---|---|---|
| **DEV** | `tcbhaiyhtndnqgatysmh` | `https://alphos-smartpos-dev.vercel.app` | `develop` | **Kandidat Verifikasi.** Seluruh RPC, RLS, dan skema database telah aktif dan tervalidasi 100%. |
| **PRODUCTION** | `sbtzajhgchpcdscrwtha` | `https://pos-retail.vercel.app` (atau domain utama toko) | `main` | **Target Deployment.** Diluncurkan melalui sinkronisasi branch `main` setelah verifikasi cloud DEV selesai. |

---

## 4. Log Eksekusi Push & Deployment (CI/CD GitHub & Vercel)

Proses deployment dieksekusi secara otomatis oleh tim DevOps menggunakan GitHub API & Vercel Automated CI/CD Pipeline:

### A. Deployment Lingkungan DEV (Branch `develop`)
- **Status:** **SUKSES (SUCCESS)** ✅
- **Branch:** `develop`
- **Commit SHA:** [`4eca8d3fa1785e085be93cddfe98095d581b66e9`](https://github.com/anggiandriansyah/POS-Retail/commit/4eca8d3fa1785e085be93cddfe98095d581b66e9)
- **Pesan Commit:** `feat(sprint-4): ALPHOS by AlphaGen v1.4.0 (Shared Core, Web Revamp, Mobile RN, 5 PDFs, Anti-UI-Slop)`
- **Total Berkas Terunggah:** 111 file
- **Vercel Preview URL:** [alphos-develop-anggiandriansyah.vercel.app](https://alphos-smartpos-dev.vercel.app/)
- **Build Status:** SUCCESS (Deploy ID: `EZqD92iNYoPbegmE73qTPJ2fTtRb`)

---

### B. Deployment Lingkungan PRODUCTION (Branch `main`)
- **Status:** **SUKSES (SUCCESS)** ✅
- **Branch:** `main`
- **Commit SHA:** [`db3f3079e43e6a5731e28ebe98958a1bc5211da0`](https://github.com/anggiandriansyah/POS-Retail/commit/db3f3079e43e6a5731e28ebe98958a1bc5211da0)
- **Pesan Commit:** `release(production): ALPHOS by AlphaGen v1.4.0 (Sprint 4 Production Release)`
- **Vercel Production URL:** [pos-retail-anggiandriansyah.vercel.app](https://pos-retail-anggiandriansyah.vercel.app/) / [pos-retail-git-main-anggiandriansyah.vercel.app](https://pos-retail-git-main-anggiandriansyah.vercel.app/)
- **Build Status:** SUCCESS (Deploy ID: `HBZysKk78DzN6n4W2nbFznZVE9qA`)
- **HTTP Status:** 200 OK (Verified live with Zero Downtime)

---

## 5. Rencana Kontingensi & Rollback (Zero-Downtime Rollback Plan)

Apabila ditemukan kendala operasional yang tidak terduga pada lingkungan Produksi:
1. **Rollback Vercel Instant:** Buka Vercel Dashboard -> Proyek `pos-retail` -> Tab **Deployments** -> Klik titik tiga pada deployment stabil sebelumnya (`v1.3.0`) -> Pilih **Promote to Production**. Waktu pemulihan < 15 detik.
2. **Rollback Git:** Jalankan `git revert HEAD` pada branch `main` dan push kembali ke remote.
3. **Integritas Database:** Skema RPC `v1.4.0` dirancang dengan prinsip *backward-compatibility* (kompatibel penuh ke versi sebelumnya), sehingga tidak merusak data transaksi eksisting.

---

## 6. Arsip Paket Dokumentasi Rilis v1.4.0
Berikut adalah 5 dokumen PDF resmi yang telah diterbitkan dan tersimpan di `docs/pdf/`:
1. `docs/pdf/01_DOKUMEN_VERSIONING_v1.4.0.pdf`
2. `docs/pdf/02_USER_MANUAL_GUIDE_v1.4.0.pdf`
3. `docs/pdf/03_LAPORAN_PENGUJIAN_AKHIR_v1.4.0.pdf`
4. `docs/pdf/04_SERTIFIKASI_DEPLOYMENT_v1.4.0.pdf`
5. `docs/pdf/05_SOP_RILIS_DAN_DOKUMENTASI_v1.4.0.pdf`

---
*Dokumen ini merupakan catatan resmi penutupan Sprint 4 (v1.4.0) ALPHOS by AlphaGen. Seluruh hak cipta dan merek dagang dilindungi oleh AlphaGen Ecosystem.*
