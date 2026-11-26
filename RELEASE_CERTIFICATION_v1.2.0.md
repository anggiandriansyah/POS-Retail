# Release Certification — POS Toko Retail `v1.2.0`

Dokumen ini menyatakan bahwa rilis **POS Toko Retail `v1.2.0`** (Next.js 16 App Router + TypeScript + Supabase + Vercel) telah melewati seluruh tahapan verifikasi kualitas (*Quality Gate*) di lingkungan **DEV** dan dinyatakan **SIAP RILIS KE PRODUCTION**.

---

## 1. Informasi Rilis

| Item | Detail |
| :--- | :--- |
| **Aplikasi** | POS Toko Retail (`react-supabase-app`) |
| **Versi** | `v1.2.0` |
| **Tanggal Sertifikasi** | 2026-11-24 |
| **Stack Utama** | Next.js `16.4.6` (App Router + Turbopack), React `19.3.1`, TypeScript `5.9.3`, Supabase (`@supabase/supabase-js` `2.119.2`) |
| **Lingkungan Uji (DEV)** | `https://alphos-smartpos-dev.vercel.app/` |
| **Status Akhir** | **CERTIFIED / PASS** |

---

## 2. Ringkasan Hasil Quality Gate (DEV)

| No | Quality Gate | Kriteria Lulus | Hasil Verifikasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **TypeScript Check** (`tsc --noEmit`) | 0 errors | `0 errors` | **PASS** |
| 2 | **Linter** (`oxlint`) | 0 errors, 0 warnings | `0 warnings, 0 errors` (29 files) | **PASS** |
| 3 | **Automated Test Suite** (`npm test`) | Seluruh unit/integration test lulus | `19/19 passed` (`tests/sprint2.test.mjs`) | **PASS** |
| 4 | **Production Build** (`next build`) | Build sukses tanpa error | `16.4.6` Turbopack sukses (`/` Static, `/receipt/[invoice]` Dynamic) | **PASS** |
| 5 | **Performance Test** | Latensi RPC dalam batas wajar | Warm RPC latency `~41–62 ms` | **PASS** |
| 6 | **Regression Test** | Tidak ada regresi pada fitur v1.0.0–v1.1.0 | Seluruh alur utama berjalan normal | **PASS** |
| 7 | **UAT & Browser Verification (DEV)** | Verifikasi UI, scanner, auth, & flow E2E di browser | Terverifikasi di `https://alphos-smartpos-dev.vercel.app/` | **PASS** |

---

## 3. Ruang Lingkup Fitur yang Disertifikasi (`v1.2.0`)

1. **Migrasi Next.js 16 App Router + TypeScript**: Struktur routing `src/app/` (`/` Static dan `/receipt/[invoice]` Dynamic) dengan strict TypeScript.
2. **Sign In Username/Email & Sign Up**: Resolusi login via `resolve_login_email` RPC, Sign Up Owner (Email/Password & Google OAuth), serta pengelolaan akun Kasir (`@username`) oleh Owner.
3. **Bilingual (`ID`/`EN`) & Dark/Light Mode**: Swipe toggle tersimpan di `localStorage`.
4. **Digital Clock Shift**: Jam real-time `HH:MM:SS` pada Open Shift dan Close Shift.
5. **Upgrade Barcode Scanner**: Dukungan native `BarcodeDetector`, *continuous autofocus*, **Photo Scan**, serta integrasi kamera langsung di form **Tambah Produk**.
6. **Kasir Stock Request & Owner Live Monitor**: Permintaan stok oleh Kasir (`stock_requests`) dan pemantauan realtime Owner dengan 1-klik **Restock / Approve / Reject**.

---

## 4. Kesimpulan

Seluruh *Quality Gate* teknis, performa, regresi, serta UAT di lingkungan DEV telah terpenuhi tanpa temuan *blocker*. Rilis **`v1.2.0`** disetujui untuk dipromosikan ke lingkungan **Production**.
