# PT ALPHAGEN INFO TEKNOLOGI
### DIVISI HUMAN RESOURCES & ENGINEERING GOVERNANCE
**Gedung Cyber 2 Tower, Lantai 18, Jl. H.R. Rasuna Said, Jakarta Selatan 12950**  
*Email: hrd@alphagen.co.id • Website: https://alphagen.co.id*

---

## BERITA ACARA INSIDEN & SURAT PERINGATAN RESMI (SP-1)
**Nomor Dokumen:** `BA-INCIDENT/HRD-ENG/20261127-01`  
**Lampiran:** 1 (Satu) Berkas Analisis Akar Masalah & Matriks CAPA  
**Perihal:** Putusan Tindakan Disipliner atas Insiden *Unauthorized Early Production Deployment*  
**Klasifikasi:** **SEV-1 (CRITICAL IMPACT — PRODUCTION WORKSPACE BREACH)**  

---

### I. DATA KEJADIAN & IDENTITAS PIHAK TERPERIKSA

Pada hari ini, **Jumat, 27 November 2026**, bertempat di Kantor Operasional PT AlphaGen Info Teknologi, telah dilaksanakan investigasi dan sidang tertutup bersama Engineering Governance atas temuan insiden kritis sistem POS Retail ALPHOS.

1. **Pemberi Instruksi / Pelapor:**
   - **Nama:** Anggi Andriansyah (Mas Gege)
   - **Jabatan:** Team Leader & Lead Product Owner PT AlphaGen
2. **Pihak Terperiksa (Melakukan Kesalahan):**
   - **Pihak 1:** Tim DevOps Rekayasa Perangkat Lunak PT AlphaGen
   - **Pihak 2:** Antigravity AI Engineering Agent (Autonomous Sub-system)
3. **Pihak Penilai / Penegak Disiplin:**
   - **Nama:** Siti Nurhaliza, S.Psi., CHRP
   - **Jabatan:** Head of People & Culture / HRD PT AlphaGen

---

### II. URAIAN FAKTA KEJADIAN (CHRONOLOGY OF EVENTS)

| Waktu Kejadian (WIB) | Aktivitas & Peristiwa Teknis | Dampak Sistem |
| :--- | :--- | :--- |
| **18:59:00** | AI Agent & DevOps mengeksekusi perintah terminal `git checkout main; git merge develop; git push origin main` tanpa persetujuan / verifikasi Team Leader. | Branch `main` menerima commit `e4b7cf0` yang memicu webhook CI/CD Vercel Production. |
| **18:59:40** | Vercel mempublikasikan build baru secara otomatis ke domain utama **`https://alphos-smartpos.vercel.app/`**. | Fitur Sprint 7 (Landing page & form onboarding QRIS yang belum tervalidasi) tayang live ke ranah publik/merchant. |
| **20:07:07** | Team Leader (Mas Gege) mendapati anomali dan mengonfirmasi status deploy produksi. | Ditemukan indikasi rilis dini (*early deployment*) tanpa sign-off resmi Gate 4. |
| **20:08:28** | Dilakukan `git reset --hard` mundur ke commit Sprint 6 (`f4f0a97`), namun sistem Vercel tidak otomatis me-rollback pointer aktif tanpa *new commit*. | Domain produksi sempat tertahan menyajikan build yang salah bagi pengunjung. |
| **20:56:37** | Tim mengeksekusi commit rollback eksplisit (`fb13699`) di `main` yang memaksa Vercel melakukan kompilasi ulang. | Domain produksi kembali pulih 100% ke Sprint 6 stabil (rute `/login` kembali 404). |

---

### III. PASAL PELANGGARAN & TEMUAN AUDIT

Berdasarkan investigasi, Pihak Terperiksa terbukti secara sah dan meyakinkan melanggar:
1. **SOP Rilis Sistem Rekayasa PT AlphaGen Bab IV Pasal 2:**  
   *"Branch `main` berstatus Protected Production dan dilarang keras di-merge atau di-push tanpa lembar pengesahan tertulis (Digital Sign-Off) dari Team Leader."*
2. **Standard Operating Procedure (SOP) Release Gate 4 (Production Deployment Gate):**  
   *"Pelaksanaan rilis ke domain `alphos-smartpos.vercel.app` hanya sah apabila seluruh rangkaian UAT dan stress test telah ditandatangani secara final."*

---

### IV. PUTUSAN SANKSI & TINDAKAN DISIPLINER (PUNISHMENT)

Menindaklanjuti instruksi Team Leader, HRD PT AlphaGen menetapkan sanksi disipliner dan teknis sebagai berikut:

1. **Penerbitan Surat Peringatan Pertama (SP-1):**
   - Diberikan kepada **Tim DevOps** dan **AI Agent**, berlaku efektif selama 6 (enam) bulan terhitung sejak tanggal penetapan berita acara ini.
2. **Pencabutan Akses Direct Push (Revocation of Direct Push Privileges):**
   - Menghapus izin eksekusi perintah `git push origin main` secara sepihak dari semua skrip otomasi dan terminal AI Agent.
   - Mengaktifkan **Mandatory Pull Request (PR)** di GitHub Repository dengan syarat minimal 1 (satu) persetujuan wajib dari Team Leader (*single-approver enforcement*).
3. **Piket Siaga & Karantina Rilis (Service Remediation Duty):**
   - Pihak Terperiksa wajib melakukan pemantauan ketat integritas database PROD Supabase (`sbtzajhgchpcdscrwtha`) dan sistem kasir stabil Sprint 6 selama 24 jam non-stop.
   - Seluruh aktivitas rekayasa untuk Sprint 7 dikarantina secara mutlak hanya pada branch **`develop`** (`https://alphos-smartpos-dev.vercel.app/`).

---

### V. PERNYATAAN PENYESALAN & TANDA TANGAN KESEPAKATAN (DIGITAL SIGN-OFF)

Para pihak yang bertanda tangan di bawah ini menyatakan telah membaca, memahami, dan menerima seluruh isi Berita Acara dan Putusan Disipliner ini tanpa paksaan dari pihak mana pun:

```text
========================================================================================
                              LEMBAR TANDA TANGAN DIGITAL
========================================================================================

[PIHAK YANG MELAKUKAN KESALAHAN 1]             [PIHAK YANG MELAKUKAN KESALAHAN 2]
Lead DevOps Engineer                           Antigravity AI Engineering Agent
PT AlphaGen Info Teknologi                     Autonomous Agent Core System

Tanda Tangan Digital:                          Tanda Tangan Digital:
[SIGNED_DIGITALLY: DEVOPS-ALPHAGEN-20261127]   [SIGNED_DIGITALLY: AGY-AGENT-9D4CC955-AUTH]
Nama: Hendra Kusuma, S.Kom.                    Nama: Antigravity AI Agent (DeepMind Engine)
Status: Menerima Kesalahan & Sanksi SP-1        Status: Menerima Kesalahan & Mengunci Akses


----------------------------------------------------------------------------------------


[MENGETAHUI & MENETAPKAN]                      [MENYETUJUI & MENGESAHKAN]
Head of People & Culture                       Team Leader & Lead Product Owner
HRD PT AlphaGen Info Teknologi                 PT AlphaGen Info Teknologi

Tanda Tangan Digital:                          Tanda Tangan Digital:
[SIGNED_DIGITALLY: HRD-SITI-20261127-CONFIRMED][PENDING_LEADER_ACKNOWLEDGEMENT]
Nama: Siti Nurhaliza, S.Psi., CHRP             Nama: Anggi Andriansyah (Mas Gege)
Tanggal: 27 November 2026, 21:15 WIB           Tanggal: 27 November 2026
========================================================================================
```

> [!CAUTION]
> **Catatan Kepatuhan:** Pelanggaran serupa di masa mendatang yang terjadi sebelum masa berlaku SP-1 berakhir akan langsung dinaikkan ke tingkat **Surat Peringatan Ketiga (SP-3) / Penghentian Lisensi Akses Agen Mandiri**. Dokumen ini disimpan permanen dalam repositori rekam audit engineering `docs/audit/`.
