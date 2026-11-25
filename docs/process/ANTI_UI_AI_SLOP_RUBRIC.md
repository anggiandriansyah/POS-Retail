# Rubrik Audit Anti-UI-Slop & Anti-AI-Slop — ALPHOS by AlphaGen (v1.4.0)

Dokumen ini mencatat hasil audit objektif UI/UX, Markom, dan QA Manual pada Sprint 4 (`v1.4.0`) untuk lingkungan **DEV (`tcbhaiyhtndnqgatysmh`)**.

---

## 1. Aturan Penilaian & Ambang Lulus
- **`2` (Pass):** Memenuhi seluruh kriteria dimensi pada kondisi Light/Dark, ID/EN, dan viewport target tanpa cacat.
- **`0` (Critical / Fail):** Ditemukan cacat blokir (overflow, kontras &lt; 4.5:1, logo salah, kebocoran PROD, placeholder).
- **Syarat Lulus:** `0` temuan Critical terbuka, skor per permukaan minimal `12 / 14`.

---

## 2. Definisi 7 Dimensi Audit Dual-Slop

| Kode | Fokus | Kriteria Verifikasi Objektif |
|---|---|---|
| **D1** | Concept 2 Brand Fidelity (UI) | Simbol *Alpha-Checkmark* terbuka, tanpa kotak/titik, nol kata `"POS"` di logo, varian `horizontal` / `vertical` / `light` / `thermal` sesuai latar. |
| **D2** | Visual Hierarchy & Density (UI) | Aksi utama jelas, angka harga/stok/total konsisten, tidak berjejal. |
| **D3** | Contrast & Dark/Light Parity (UI) | Kontras WCAG AA (`>= 4.5:1` teks normal, `>= 3.0:1` teks besar); terbaca pada Light & Dark Mode. |
| **D4** | Spacing, Alignment & Typography (UI) | Konsistensi grid, padding, font `Plus Jakarta Sans` + `JetBrains Mono`, nol CSS yatim. |
| **D5** | Viewport, Overflow & Interaction Clarity (UI+AI) | Nol horizontal overflow atau clipping pada `375px`, `768px`, `1440px`, `@media print`, dan layar Android; state loading/empty/error jelas; nol `window.confirm` / `window.prompt`. |
| **D6** | Zero Placeholder & Bilingual ID/EN Parity (UI+AI) | Nol `"POS Retail"`, `"Toko Retail Anda"`, `"Jl. Contoh"`; parity ID/EN 100%. |
| **D7** | Authentic Copy & Truthful Output (AI-Slop) | Teks antarmuka, pesan error, dan hasil kalkulasi sesuai perilaku aktual sistem. |

---

## 3. Tabel Audit Web — 15 Permukaan (`W-01` s.d. `W-15`)

| ID | Permukaan Web | File Sumber | D1 | D2 | D3 | D4 | D5 | D6 | D7 | Skor | Temuan Kritis | Auditor (UI/UX & QA) | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `W-01` | Login, SignUp & Setup Owner | `src/components/LoginPage.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-02` | App Shell, Topbar & Toggle Tema/Bahasa | `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/ThemeLangToggles.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-03` | Kasir Checkout, Diskon & PPN | `src/components/PosCashier.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-04` | Barcode Scanner (USB, Kamera, Foto) | `src/components/BarcodeScanner.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-05` | Cek Harga Cepat | `src/components/PriceChecker.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-06` | Shift Kasir, Jam Digital & Petty Cash | `src/components/ShiftManager.tsx`, `src/components/DigitalClock.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-07` | Request Stok Kasir | `src/components/StockRequestPanel.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-08` | Laporan, Filter Tanggal & Export CSV | `src/components/ReportsView.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-09` | Owner Live Monitor Realtime | `src/components/OwnerLiveMonitor.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-10` | Manajemen Produk, Mutasi Stok & Hapus Inline | `src/components/InventoryManager.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-11` | Rekap Shift Owner & Modal Force Close | `src/components/OwnerShifts.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-12` | Kelola Staf & Hak Akses | `src/components/StaffManager.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-13` | Pengaturan Profil Toko, Pajak & Pratinjau Struk | `src/components/StoreSettingsForm.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-14` | Modal Struk Digital & Share Link/WA | `src/components/ReceiptModal.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |
| `W-15` | Halaman Struk Publik & Cetak Thermal | `src/app/receipt/[invoice]/page.tsx`, `src/components/ReceiptContent.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | UI/UX & QA Manual | `PASS` |

---

## 4. Tabel Audit Mobile — 10 Layar (`M-01` s.d. `M-10` / `US-4.1`–`US-4.6`)

| ID | Layar Mobile | User Story | File Sumber Mobile (`mobile/`) | D1 | D2 | D3 | D4 | D5 | D6 | D7 | Skor | Temuan Kritis | Verifikasi | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `M-01` | App Shell & Role Nav | `US-4.1`, `US-4.2` | `mobile/App.tsx`, `mobile/src/contexts/AppContext.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-02` | Login Mobile | `US-4.2` | `mobile/src/screens/LoginScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-03` | Pengaturan Tema & Bahasa | `US-4.2` | `mobile/src/theme/tokens.ts`, `mobile/src/components/AlphosLogo.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-04` | Shift, Petty Cash & Tutup Shift | `US-4.3` | `mobile/src/screens/ShiftScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-05` | Kasir Mobile, Diskon & PPN | `US-4.4` | `mobile/src/screens/CashierScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-06` | Camera Barcode Scanner & Manual Fallback | `US-4.4` | `mobile/src/screens/CashierScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-07` | Struk Digital & Share WhatsApp | `US-4.4` | `mobile/src/utils/whatsapp.ts` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | Unit Test | `PASS` |
| `M-08` | Printer Bluetooth ESC/POS & Pratinjau | `US-4.6` | `mobile/src/utils/escpos.ts`, `mobile/src/services/thermalPrinter.ts` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | ESC/POS 58/80mm | `PASS` |
| `M-09` | Owner Live Monitor Realtime | `US-4.5` | `mobile/src/screens/OwnerMonitorScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |
| `M-10` | Stock Request & Approval Owner | `US-4.5` | `mobile/src/screens/OwnerMonitorScreen.tsx` | 2 | 2 | 2 | 2 | 2 | 2 | 2 | `14/14` | 0 | TS + Unit | `PASS` |

---

## 5. Tabel Audit Anti-AI-Slop Dokumen, Markom & Kode (`A-01` s.d. `A-08`)

| ID | Objek Audit | Artefak / Jalur Target | Kriteria Pemeriksaan Anti-AI-Slop & Branding | Auditor | Catatan Bukti | Status |
|---|---|---|---|---|---|---|
| `A-01` | Release Kit Markom `v1.4.0` | `docs/process/MARKOM_RELEASE_KIT_v1.4.0.md` | Nol frasa klise AI, seluruh fitur sesuai Web + Mobile aktual. | Markom & QA | Terverifikasi `T1-F15-01` | `PASS` |
| `A-02` | Konsistensi Copywriting Web & Mobile | `src/i18n/translations.ts` | Nol `"POS Retail"` / `"Toko Retail Anda"`, parity ID/EN 100%. | Markom & QA | Terverifikasi `T1-F1-05` | `PASS` |
| `A-03` | Dokumen PDF 01–02 | `docs/html/01..02.html`, `docs/pdf/01..02.pdf` | Konsep 2 Light Mode murni, panduan Web & Mobile akurat. | TW & QA | Terverifikasi `T1-F16` | `PASS` |
| `A-04` | Dokumen PDF 03–04 | `docs/html/03..04.html`, `docs/pdf/03..04.pdf` | Angka uji aktual & DEV-only scope terjaga. | TW & QA | Terverifikasi `T1-F16-05` | `PASS` |
| `A-05` | Dokumen PDF 05 & SOP Rilis | `docs/RELEASE_SOP.md`, `docs/html/05*.html`, `docs/pdf/05*.pdf` | Terpadu pada 5 paket PDF resmi ALPHOS by AlphaGen. | TW & QA | Terverifikasi `T1-F15-02` | `PASS` |
| `A-06` | Dokumentasi Repo Utama | `README.md`, `CHANGELOG.md`, `USER_GUIDE.md`, `docs/README.md` | Selaras `v1.4.0` & 5 PDF resmi. | TW & PO | Terverifikasi `T1-F15-03..05` | `PASS` |
| `A-07` | Kode Shared Core Tanpa Duplikasi | `src/types/pos.ts`, `src/utils/*`, `src/i18n/translations.ts`, `mobile/` | Mobile mengonsumsi Shared Core langsung tanpa duplikasi. | Lead Dev | Terverifikasi `T1-F8-03` | `PASS` |
| `A-08` | Isolasi Supabase DEV & Keamanan PROD | `.env.development`, `mobile/`, build config | Seluruh build mengarah ke DEV `tcbhaiyhtndnqgatysmh`; PROD `0` mutasi. | DevOps & QA | Terverifikasi `build:dev` & `T1-F7` | `PASS` |

---

## 6. Log Temuan Defect Terbuka

| ID Defect | Surface | Kategori | Severity | Kondisi Uji | Ringkasan Temuan | Status |
|---|---|---|---|---|---|---|
| - | - | - | - | - | `0` temuan Critical/Major terbuka setelah perbaikan kontras CSS & transition | `PASS` |
