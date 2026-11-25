# Standar Operasional Prosedur (SOP) Rilis & Dokumentasi Deployment — ALPHOS by AlphaGen

Dokumen ini memuat kesepakatan standar tim **ALPHOS by AlphaGen** mengenai **Kewajiban Deliverables Technical Writer (TW)** pada setiap siklus rilis dan paska-deployment (*Post-Deployment Definition of Done*).

## Ketetapan Kesepakatan (Release Rule)

Setiap kali deployment selesai dilaksanakan (baik ke DEV `tcbhaiyhtndnqgatysmh` maupun PRODUCTION setelah persetujuan user), Technical Writer (TW) wajib menerbitkan dan memperbarui **5 dokumen resmi** dalam format PDF siap cetak di `docs/pdf/`:

1. `01_DOKUMEN_VERSIONING_v1.4.0.pdf` — Riwayat versi, fitur baru, peningkatan, perubahan skema database/RPC/RLS, dan panduan upgrade.
2. `02_USER_MANUAL_GUIDE_v1.4.0.pdf` — Panduan operasional terbaru untuk Web & Mobile (`Owner/Admin` dan `Kasir/User`), termasuk FAQ dan Troubleshooting.
3. `03_LAPORAN_PENGUJIAN_AKHIR_v1.4.0.pdf` — Hasil Quality Gates (`typecheck`, `lint`, `test`, E2E Sprint 4, `build:dev`, uji Android/ESC-POS, serta audit QA Manual Anti-UI-Slop & Anti-AI-Slop).
4. `04_SERTIFIKASI_DEPLOYMENT_v1.4.0.pdf` — Bukti pengesahan rilis resmi (DEV/PROD), metadata commit, analisis risiko, rollback plan, dan lembar tanda tangan.
5. `05_SOP` (`05_SOP_RILIS_DAN_DOKUMENTASI_v1.4.0.pdf`) — Dokumen SOP rilis dan standar mutu dokumentasi ALPHOS by AlphaGen.

Seluruh dokumen wajib memakai identitas visual **ALPHOS by AlphaGen (Konsep 2 Light Mode)**, mematuhi standar **Anti-AI-Slop**, dan menjaga batas lingkungan **DEV (`tcbhaiyhtndnqgatysmh`)** agar tidak pernah membocorkan kredensial atau menyentuh **PROD** tanpa izin eksplisit user.
