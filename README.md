# ALPHOS • Smart Retail Operating System (`v1.6.0`)
> **PT ALPHAGEN MULTI TEKNOLOGI**  
> *Sistem Kasir, Inventaris & Manajemen Retail Pintar Generasi 2.0 B2B Multi-Tenant Ecosystem*

[![Production Status](https://img.shields.io/badge/Production-Live%20v1.6.0-emerald.svg)](https://alphos-smartpos.vercel.app/)
[![DEV Status](https://img.shields.io/badge/DEV-Live%20v1.6.0-blue.svg)](https://alphos-smartpos-dev.vercel.app/)
[![License](https://img.shields.io/badge/License-Proprietary-purple.svg)](https://alphagen.co.id)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6.svg)](https://www.typescriptlang.org/)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2016-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E.svg)](https://supabase.com/)

---

## 🌐 Live Environments & Deployment Matrix

| Lingkungan | URL Akses | Branch | Versi Sistem | Status Basis Data (Supabase) |
|:---|:---|:---:|:---:|:---|
| **Production** | [https://alphos-smartpos.vercel.app/](https://alphos-smartpos.vercel.app/) | `main` | `v1.6.0` | `sbtzajhgchpcdscrwtha` (Singapore) |
| **Production Mirror** | [https://pos-retail-umber.vercel.app/](https://pos-retail-umber.vercel.app/) | `main` | `v1.6.0` | `sbtzajhgchpcdscrwtha` (Singapore) |
| **Development (DEV)** | [https://alphos-smartpos-dev.vercel.app/](https://alphos-smartpos-dev.vercel.app/) | `develop` | `v1.6.0` | `tcbhaiyhtndnqgatysmh` (Singapore) |

---

## 📌 Ringkasan Rilis v1.6.0 (Sprint 7)
Rilis **`v1.6.0`** menghadirkan kapabilitas enterprise B2B Multi-Tenant, Portal Superadmin Terpusat, Simulasi Kasir Pintar (ATM POS), dan Rekonsiliasi Kas Laci Tanpa Selisih:

1. **Model Langganan B2B 3 Tiers (SaaS Merchant Onboarding):**
   * **Gen Alpha (Rp 0 / Selamanya):** Freemium entry-point untuk UMKM pemula (transaksi kasir dasar & scan barcode).
   * **Gen Beta (Rp 20.000 / bln):** Manajemen inventori aktif, peringatan stok menipis, dan ekspor laporan CSV otomatis.
   * **Gen Gamma (Rp 30.000 / bln):** Fitur enterprise lengkap, multi-gudang, offline scan resilience, dan analitik visual omzet.
2. **Superadmin Verification Hub:**
   * Portal verifikasi bukti transfer QRIS merchant baru secara instan.
   * Approval workflow otomatis dengan token verifikasi email berstandar kriptografi.
3. **Simulasi Interaktif Mesin Kasir Pintar (ATM POS):**
   * **Terminal Kasir Kilat:** Uji alur scan barcode multi-item dan split payment QRIS/Tunai.
   * **Peringatan Stok Realtime:** Indikator otomatis stok kritis dan restock reminder.
   * **Rekonsiliasi Kas Laci (Zero Discrepancy):** Audit otomatis kas masuk vs struk transaksi.
4. **Matriks Perbandingan (Mesin Kasir Konvensional vs ALPHOS):**
   * Komparasi transparan atas biaya langganan, keandalan saat internet padam, dan kemudahan analitik.
5. **Autentikasi Native Supabase & Zero Mock Bypass:**
   * Seluruh autentikasi diproses langsung melalui `auth.users` dan Row Level Security (RLS) `public.profiles` dengan enkripsi kata sandi `pgcrypto` bcrypt standar industri.

---

## 📜 Riwayat Rilis Lengkap (Semantic Versioning Track)

| Versi | Tag Git | Tanggal Rilis | Fokus Fitur & Deskripsi Perubahan |
|:---:|:---:|:---:|:---|
| **v1.6.0** | `v1.6.0` | 28 Nov 2026 | **Sprint 7 — B2B Subscriptions & Superadmin Hub:** 3 tier paket langganan merchant, verifikasi bukti bayar QRIS, ATM POS simulator, comparison matrix, native Supabase superadmin seeding. |
| **v1.5.1** | `v1.5.1` | 26 Nov 2026 | **Sprint 6 — Hotfix & Subscription Research:** Perbaikan Google Auth session sync, PRD model bisnis langganan 3 tiers, pembersihan layout footer. |
| **v1.5.0** | `v1.5.0` | 25 Nov 2026 | **Sprint 5 — B2B Multi-Tenant Ecosystem:** Command Center Monitoring dashboard, landing page SaaS, pemutakhiran arsitektur multi-toko. |
| **v1.4.0** | `v1.4.0` | 24 Nov 2026 | **Sprint 4 — Mobile Android & Shared Core Monorepo:** Aplikasi React Native Expo (`mobile/`), Shared Core TypeScript bebas DOM, Quality Gates M1-M6, 5 berkas PDF resmi rilis. |
| **v1.3.0** | `v1.3.0` | 24 Nov 2026 | **Sprint 3 — Pengaturan Toko, Diskon & Pajak:** Store settings dinamis, diskon per item & per struk (Rp/%), opsi pajak PPN, ekspor transaksi ke CSV. |
| **v1.2.0** | `v1.2.0` | 24 Nov 2026 | **Sprint 2 — Migrasi Next.js 16 & Shift Kasir:** Migrasi ke Next.js 16 App Router, TypeScript murni, manajemen shift kasir, petty cash laci, bilingual ID/EN. |
| **v1.1.0** | `v1.1.0` | 24 Nov 2026 | **Sprint 2 — Multi-Role & Strict RLS:** Pemisahan hak akses Owner dan Kasir, RPC `process_sale`, `close_shift`, serta digital receipt via invoice URL. |
| **v1.0.1** | `v1.0.1` | 23 Nov 2026 | **Hotfix — Stabilitas Kasir:** Perbaikan validasi barcode scanner kamera dan kalkulasi kembalian tunai. |
| **v1.0.0** | `v1.0.0` | 23 Nov 2026 | **Sprint 1 — Core POS Retail Foundation:** Scan barcode produk, keranjang belanja, integrasi Supabase awal, dan cetak struk. |

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

* **Frontend:** [Next.js 16 (Turbopack)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
* **Styling & UI:** Tailwind CSS + Vanilla CSS Variables (Hallmark Design Floor compliant, antislop)
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL 15, Auth, Row Level Security, RPC Security Definer)
* **Mobile App:** [React Native](https://reactnative.dev/) / [Expo SDK 52](https://expo.dev/) (di direktori `mobile/`)
* **Pengujian:** Node.js Native Test Runner (`node --test`), 24/24 Suites Passed
* **Hosting & CI/CD:** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions)

---

## 🔐 Kredensial Pengujian Internal (Demo & Audit)

### 1. Lingkungan Development (DEV)
* **URL:** `https://alphos-smartpos-dev.vercel.app/login`
* **Superadmin:** `admindev` / `Jakarta123`
* **Kasir Demo:** `anggitest123` / `Password123!`

### 2. Lingkungan Production (PROD)
* **URL:** `https://alphos-smartpos.vercel.app/login`
* **Superadmin:** `adminprod` / `Jakarta123`

---

## 📂 Dokumentasi & SOP Resmi

Seluruh berkas panduan operasional dan sertifikasi rilis diarsipkan di folder [`docs/`](./docs/):
1. 📄 [**SOP Panduan User Verifikasi Registrasi Superadmin (PDF)**](./docs/pdf/PANDUAN_USER_VERIFIKASI_REGISTRASI_SUPERADMIN.pdf) *(SOP-ADM-02, 609.8 KB)*
2. 📄 [**Dokumen Sertifikasi Rilis v1.6.0 (MD)**](./docs/RELEASE_CERTIFICATION_v1.6.0.md)
3. 📄 [**Lembar Persetujuan Multi-Pihak (Sign-off Matrix)**](./docs/LEMBAR_PERSETUJUAN_DAN_ALASAN_APPROVAL_PROD_v1.6.0.md)
4. 📄 [**Arsip 5 Paket PDF Rilis v1.4.0**](./docs/pdf/)

---

## 💻 Panduan Menjalankan Project Lokal

```bash
# 1. Clone repository
git clone https://github.com/anggiandriansyah/POS-Retail.git
cd POS-Retail

# 2. Install dependencies
npm install

# 3. Jalankan unit & integration tests
npm test -- --run

# 4. Jalankan development server
npm run dev
# Buka http://localhost:3000 di browser

# 5. Build untuk produksi
npm run build
```

---

## 👥 Tim Pengembang & Tim Pengarah (PT AlphaGen)

* **Team Leader / Final Authority:** Anggi Andriansyah (Mas Gege)
* **Product Owner & Bisnis:** Tari Wulandari & Rama Wijaya
* **Lead Solution Architect:** Fajar Nugraha
* **Frontend Lead:** Dimas Ardianto
* **Backend & Database Engineer:** Aris Pratama
* **Cybersecurity & Compliance:** Hendra Gunawan
* **QA Lead & Automation:** Kevin Sanjaya
* **Technical Writer:** Maya Dewi & TW Team

---
*© 2026 PT AlphaGen Multi Teknologi. Seluruh hak cipta dilindungi undang-undang.*
