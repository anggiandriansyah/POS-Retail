# Standar Operasional Prosedur (SOP) Rilis & Dokumentasi Deployment

Dokumen ini memuat kesepakatan standar tim rekayasa perangkat lunak sistem **POS Toko Retail** mengenai **Kewajiban Deliverables Technical Writer (TW)** pada setiap siklus rilis / paska-deployment (*Post-Deployment Definition of Done*).

---

## 📌 Ketetapan Kesepakatan (Release Rule)

> **"Setiap kali deployment selesai dilaksanakan (baik ke DEV maupun PRODUCTION), Technical Writer (TW) WAJIB menerbitkan dan memperbarui 4 paket dokumen resmi dalam format PDF siap cetak / siap edar."**

---

## 📑 4 Dokumen Wajib Paska-Deployment

Setiap rilis versi baru (misal: `v1.3.0`, `v1.4.0`, dst.) wajib disertai dokumen berikut di folder `docs/pdf/`:

| No | Dokumen Wajib (Format PDF) | Standar Penamaan File | Isi Pokok & Tanggung Jawab TW |
|:---:|:---|:---|:---|
| **1** | **Dokumen Riwayat Versi & Enhancement** | `01_DOKUMEN_VERSIONING_v<major>.<minor>.pdf` | • Rangkuman seluruh evolusi fitur baru, enhancement, dan bugfix.<br>• Catatan perubahan skema database (tabel, kolom, RPC, trigger, RLS).<br>• Catatan kompatibilitas & panduan upgrade. |
| **2** | **Buku Panduan Pengguna (User Manual Guide)** | `02_USER_MANUAL_GUIDE_v<major>.<minor>.<patch>.pdf` | • Panduan operasional terkini (*latest*) untuk **Kasir/Staff** (shift, kasir, diskon, struk, stock request).<br>• Panduan untuk **Owner/Admin** (mode kasir, produk, live monitor, pengaturan toko, laporan/export CSV, kelola kasir).<br>• FAQ & Troubleshooting yang diverifikasi langsung dari UI aktual. |
| **3** | **Laporan Pengujian Akhir (Final Test Report)** | `03_LAPORAN_PENGUJIAN_AKHIR_v<major>.<minor>.<patch>.pdf` | • Hasil aktual eksekusi Quality Gates: Typecheck, Lint, Unit Test, Live Integration, E2E Matrix, dan Production Build.<br>• Matriks Ketertelusuran Kebutuhan (*Traceability Matrix*) User Story ke Test Case.<br>• Lembar verifikasi UAT manual checklist. |
| **4** | **Sertifikasi Deployment (Production Sign-Off)** | `04_SERTIFIKASI_DEPLOYMENT_v<major>.<minor>.<patch>.pdf` | • Bukti pengesahan rilis resmi.<br>• Metadata deployment: Git Commit SHA, status Vercel, migrasi Supabase, verifikasi OAuth/integrasi eksternal.<br>• Checklist QA/DevOps, Analisis Risiko, Rencana Pemulihan (*Rollback Plan*), dan Lembar Tanda Tangan Pengesahan. |

---

## 🔄 Alur Kerja Paska-Deployment (Post-Deployment Flow)

1. **Deploy Sukses:** DevOps / Lead Developer menyelesaikan build & rilis di Vercel dan Supabase.
2. **Kompilasi Dokumen TW:** Technical Writer mengompilasi draf HTML berstandar cetak A4 dan mengonversinya menjadi dokumen PDF vektor resolusi tinggi.
3. **Penyimpanan Dokumen:** Seluruh PDF disimpan di `docs/pdf/` dan dicatat pada `docs/README.md` serta `README.md` utama.
4. **Sinkronisasi Git:** File dokumentasi PDF di-*commit* dan di-*push* ke branch `develop` dan `main`.
5. **Laporan ke Pemilik/Stakeholder:** Menyampaikan ringkasan rilis dan tautan PDF langsung kepada Pemilik Toko (Product Owner).
