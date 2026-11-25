# Kesiapan Bisnis, Alur Proses & Checklist Product Owner (PO) — ALPHOS by AlphaGen (`v1.4.0`)

Dokumen ini mencatat hasil verifikasi kesiapan bisnis dan Product Owner (PO) untuk kandidat rilis Sprint 4 (`v1.4.0`) pada lingkungan **DEV (`tcbhaiyhtndnqgatysmh` / branch `develop`)**.

---

## 1. Status Gerbang Kendali (*Gate 0–4*)

| Gerbang | Nama Gerbang | Penanggung Jawab | Status |
|---|---|---|---|
| **Gate 0** | **PO Scope & Business Readiness** | Product Owner, Lead Dev | `PASS` |
| **Gate 1** | **Design & Shared Core Contract** | UI/UX, Lead Dev | `PASS` |
| **Gate 2** | **Engineering & Automated Verification** | Dev Web, Dev Mobile, QA Automation | `PASS` |
| **Gate 3** | **Dual-Slop Review Gate** | UI/UX, Markom, QA Manual, Technical Writer | `PASS` |
| **Gate 4** | **PO DEV Acceptance & PROD Promotion Lock** | Product Owner / Business | `APPROVED` (DEV) / `BLOCKED` (PROD menunggu izin user) |

---

## 2. Checklist Kesiapan Bisnis & Product Owner (`v1.4.0`)

### Blok A — `R1`: Branding Konsep 2 & Revamp UI Anti-UI-Slop
| No | Kriteria Kesiapan Bisnis | Referensi | Bukti Verifikasi | Status |
|---|---|---|---|---|
| `A.1` | Seluruh 15 permukaan Web (`W-01`–`W-15`) menampilkan identitas **ALPHOS by AlphaGen** Konsep 2 dan bebas placeholder lama. | `R1`, `W-01`..`W-15` | `T1-F2`, `T1-F5` PASS | `PASS` |
| `A.2` | Seluruh 10 layar Mobile (`M-01`–`M-10`) konsisten memakai varian Konsep 2 pada Dark Mode dan Light Mode. | `R1`, `M-01`..`M-10` | `T1-F9-04`, `T1-F9-05` PASS | `PASS` |
| `A.3` | Struk digital publik, pratinjau struk, modal struk, dan template ESC/POS memakai logo Konsep 2 varian Struk Thermal. | `R1`, `US-4.6` | `T1-F6`, `T1-F13` PASS | `PASS` |
| `A.4` | Kelima template dokumen rilis (`docs/html/01..05*.html` dan `docs/pdf/01..05*.pdf`) memakai Konsep 2 Light Mode. | `R1`, `R4` | `T1-F16-01..04` PASS | `PASS` |

### Blok B — `R2`: Cakupan Fungsional Aplikasi Mobile (`US-4.1` s.d. `US-4.6`)
| No | Kriteria Kesiapan Bisnis | User Story | Bukti Verifikasi | Status |
|---|---|---|---|---|
| `B.1` | Proyek mobile React Native di `mobile/` terintegrasi langsung dengan Shared Core tanpa duplikasi rumus/format/i18n. | `US-4.1` | `T1-F8-01..05` PASS | `PASS` |
| `B.2` | Autentikasi mobile (`resolve_login_email`), routing 4 peran (`owner`/`admin`/`kasir`/`user`), toggle ID/EN, Dark/Light berfungsi. | `US-4.2` | `T1-F9` + `mobile.test.mjs` PASS | `PASS` |
| `B.3` | Buka shift, catat petty cash `IN`/`OUT` (5 kategori), dan tutup shift (`close_shift`) berfungsi di DEV. | `US-4.3` | `T1-F10` PASS | `PASS` |
| `B.4` | Kasir mobile, barcode scanner kamera + manual fallback, diskon, PPN, checkout, dan share WhatsApp berfungsi. | `US-4.4` | `T1-F11` + `mobile.test.mjs` PASS | `PASS` |
| `B.5` | Owner Live Monitor (`supabase_realtime`), peringatan stok menipis, dan Stock Request approval berfungsi. | `US-4.5` | `T1-F12` PASS | `PASS` |
| `B.6` | Printer Bluetooth ESC/POS (`58mm`/`80mm`, header ALPHOS, preview fallback) terverifikasi. | `US-4.6` | `T1-F13` + `mobile.test.mjs` PASS | `PASS` |
| `B.7` | Suite pengujian otomatis mobile (`mobile/tests/mobile.test.mjs`) dan `tsc --noEmit` lulus. | `R2`, `AC` | `T1-F14` PASS | `PASS` |

### Blok C — `R3`: Kesiapan Peran Baru, Operasional & Markom
| No | Kriteria Kesiapan Bisnis | Referensi | Bukti Verifikasi | Status |
|---|---|---|---|---|
| `C.1` | Panduan kerja peran **UI/UX**, **Markom**, dan **QA Manual Dual-Slop** tersedia di `docs/process/`. | `R3` | `T1-F3` PASS | `PASS` |
| `C.2` | Materi komunikasi rilis `docs/process/MARKOM_RELEASE_KIT_v1.4.0.md` siap edar (ID/EN) dan lolos Anti-AI-Slop. | `R3` | `T1-F15-01` PASS | `PASS` |
| `C.3` | Buku panduan pengguna (`02_USER_MANUAL_GUIDE_v1.4.0.pdf` dan `USER_GUIDE.md`) mencakup Web dan Mobile. | `R3`, `R4` | `T1-F15-05`, `T1-F16` PASS | `PASS` |

### Blok D — `R4`: Lingkungan DEV, Keamanan PROD & Release SOP (5 PDF)
| No | Kriteria Kesiapan Bisnis | Referensi | Bukti Verifikasi | Status |
|---|---|---|---|---|
| `D.1` | Konfigurasi runtime dan build Web (`build:dev`) maupun Mobile (`mobile/`) hanya menargetkan Supabase DEV `tcbhaiyhtndnqgatysmh`. | `R4` | `T1-F7`, `T1-F8-04` PASS | `PASS` |
| `D.2` | Terverifikasi `0` perubahan skema, `0` migrasi, dan `0` deployment ke Supabase PROD (`sbtzajhgchpcdscrwtha`). | `R4` | `prodHits=0` | `PASS` |
| `D.3` | `docs/RELEASE_SOP.md` dan seluruh 5 PDF versi `v1.4.0` terbit di `docs/pdf/`. | `R4` | `T1-F15-02`, `T1-F16-04` PASS | `PASS` |

### Blok E — Standar Ganda Anti-UI-Slop & Anti-AI-Slop
| No | Kriteria Kesiapan Bisnis | Referensi | Bukti Verifikasi | Status |
|---|---|---|---|---|
| `E.1` | `docs/process/ANTI_UI_AI_SLOP_RUBRIC.md` terisi lengkap dengan `0` temuan Critical terbuka. | `AC` | `T1-F18-01` PASS | `PASS` |
| `E.2` | Seluruh laporan uji, dokumen PDF, dan catatan rilis bebas dari frasa klise AI. | `AC` | `T1-F18-03..05` PASS | `PASS` |

---

## 3. Lembar Keputusan & Sign-Off Gate 4

| Peran | Nama / Agen | Lingkup Persetujuan | Tanggal | Status |
|---|---|---|---|---|
| **Lead Developer** | Sprint 4 Dev Team | Gate 1–2: Shared Core, Web Revamp, Mobile US-4.1..4.6, Build & DEV Isolation | 25 Nov 2026 | `APPROVED` |
| **UI/UX** | Sprint 4 UI/UX | Gate 1 & 3: Konsep 2, Token Dark/Light, Audit `W-01`..`W-15` & `M-01`..`M-10` | 25 Nov 2026 | `APPROVED` |
| **MarketingCommunication (Markom)** | Sprint 4 Markom | Gate 3: Brand Voice, `MARKOM_RELEASE_KIT_v1.4.0.md`, Audit Copy Anti-AI-Slop | 25 Nov 2026 | `APPROVED` |
| **QA Manual** | Sprint 4 QA Dual-Slop | Gate 3: Eksekusi Matriks Web & Mobile, `0` Critical Dual-Slop | 25 Nov 2026 | `APPROVED` |
| **Technical Writer** | Sprint 4 TW | Gate 3: 5 PDF Resmi `v1.4.0` (`01`–`05`) di `docs/pdf/` sesuai `RELEASE_SOP.md` | 25 Nov 2026 | `APPROVED` |
| **Product Owner / Business** | Sprint 4 PO | Gate 0 & 4: Persetujuan Kesiapan Bisnis DEV (`tcbhaiyhtndnqgatysmh`) | 25 Nov 2026 | `APPROVED` |

- **Keputusan Rilis DEV (`develop` / `tcbhaiyhtndnqgatysmh`):** `APPROVED`
- **Keputusan Promosi PROD (`main` / `sbtzajhgchpcdscrwtha`):** `BLOCKED (Menunggu Review & Persetujuan User)`
