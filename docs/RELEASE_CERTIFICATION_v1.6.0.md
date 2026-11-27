# PT ALPHAGEN MULTI TEKNOLOGI
# SERTIFIKASI RILIS RESMI & DOKUMEN VERSIONING v1.6.0 (PRODUCTION)

**Nomor Sertifikat:** CERT-REL-20261128-ALPHOS-160  
**Tanggal Rilis:** 28 November 2026  
**Status Rilis:** 100% PRODUCTION READY & LIVE  
**Disahkan Oleh:** Anggi Andriansyah (Team Leader PT AlphaGen)  

---

## 1. DESKRIPSI RILIS v1.6.0
Rilis **ALPHOS Smart POS v1.6.0** merupakan rilis Minor resmi pertama di lini Generasi 2.0 yang membawa fondasi B2B SaaS Subscriptions, verifikasi pembayaran merchant multi-tier, simulasi interaktif ATM POS, serta tata kelola keamanan akun Superadmin native.

### Fitur Utama:
1. **Model Langganan 3 Tier (Gen Alpha, Gen Beta, Gen Gamma)**
2. **Superadmin Verification Hub B2B**
3. **Simulasi Interaktif Terminal Kasir Kilat & Peringatan Stok (ATM POS)**
4. **Rekonsiliasi Kas Laci (Zero Discrepancy Drawer)**
5. **Matriks Perbandingan Mesin Kasir Konvensional vs ALPHOS**
6. **Autentikasi Native Supabase (Bcrypt Pgcrypto + Strict RLS)**

---

## 2. LINEAGE VERSIONING (v1.0.0 s/d v1.6.0)
Semua versi telah diverifikasi dan disinkronkan ke remote repository GitHub `anggiandriansyah/POS-Retail`:
* `v1.0.0` — Core POS Retail, Barcode Scanner, & Digital Receipt
* `v1.0.1` — Hotfix scanner validation & cash change calculation
* `v1.1.0` — Multi-Role (Owner/Kasir), Strict RLS, Petty Cash, Public Receipt RPC
* `v1.2.0` — Next.js 16 App Router + TypeScript Migration, Bilingual ID/EN, Dark/Light Swipe
* `v1.3.0` — Dynamic Store Settings, Discounts/Tax, CSV Export, Dual-Role Compatibility
* `v1.4.0` — Android Mobile Expo Monorepo, Shared Core, Quality Gates M1-M6, 5 PDFs
* `v1.5.0` — Generation 2.0 B2B Multi-Tenant Ecosystem, Command Center Monitoring
* `v1.5.1` — Hotfix Google Auth session synchronization & Subscriptions Research PRD
* `v1.6.0` — Official Production Release: B2B Subscriptions, Superadmin Hub, ATM POS Simulator

---

## 3. HASIL VERIFIKASI PENGUJIAN
* **Otomasi Unit & Integrasi:** 24/24 Suites PASS (0 failed, 0 flaky)
* **Build Next.js Turbopack:** 0 errors, 0 warnings
* **Audit Keamanan:** Celah VULN-01 & VULN-02 tertutup 100% permanen
* **SOP Operasional:** Terbit Dokumen Resmi PDF `PANDUAN_USER_VERIFIKASI_REGISTRASI_SUPERADMIN.pdf` (SOP-ADM-02, 609.8 KB)

---
*Diterbitkan oleh Tim Rilis PT AlphaGen Multi Teknologi pada 28 November 2026.*
