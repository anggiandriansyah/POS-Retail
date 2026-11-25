# Panduan Peran MarketingCommunication (Markom) — ALPHOS by AlphaGen (v1.4.0)

Dokumen ini mendefinisikan ruang lingkup kerja, aturan identitas merek, standar penulisan **Anti-AI-Slop**, serta daftar artefak komunikasi rilis untuk peran **MarketingCommunication (markom)** pada Sprint 4 (`v1.4.0`).

---

## 1. Peran & Ruang Lingkup Markom

1. **Penjaga Konsistensi Merek:** Memastikan seluruh antarmuka Web, aplikasi Mobile Android, struk cetak/digital, materi rilis, dan 5 dokumen resmi PDF memakai identitas **ALPHOS by AlphaGen** sesuai Konsep 2.
2. **Audit Microcopy UI (ID & EN):** Meninjau teks pada `src/i18n/translations.ts` bersama UI/UX dan Dev agar label tombol, pesan error, empty state, dan notifikasi WhatsApp ringkas, akurat, serta bebas jargon membingungkan.
3. **Penyusun Materi Rilis `v1.4.0`:** Menyusun `docs/process/MARKOM_RELEASE_KIT_v1.4.0.md` pada Milestone M5 setelah fitur Web Revamp dan Mobile (`US-4.1`–`US-4.6`) selesai dibangun.
4. **Gate 3 Review:** Memberikan sign-off pada audit `A-01`..`A-08` di `docs/process/ANTI_UI_AI_SLOP_RUBRIC.md` sebelum rilis DEV disahkan oleh Product Owner.

---

## 2. Aturan Penamaan Brand (Kepatuhan Konsep 2)

| Elemen | Aturan Wajib | Larangan |
|---|---|---|
| **Nama Produk Lengkap** | `ALPHOS by AlphaGen` | `POS Retail`, `PT POS Retail Indonesia`, `ALPHOS POS` |
| **Penyebutan Singkat** | `ALPHOS` | `POS Toko Retail` |
| **Logo Lockup** | Simbol *Alpha-Checkmark* murni + `"ALPHOS"` + `"by AlphaGen"` | Menambahkan kata `"POS"` pada logo, memberi kotak/titik pada simbol |
| **Default Nama Toko** | `ALPHOS Store` (`STORE_INFO.name`) | `Toko Retail Anda`, `Jl. Contoh No. 123, Indonesia` |

**Catatan:** Kata "kasir", "point-of-sale", atau "sistem kasir" boleh dipakai hanya sebagai kata benda deskriptif di dalam kalimat penjelasan fungsi (contoh: *"Platform kasir dan inventaris untuk toko retail"*), bukan sebagai bagian dari nama merek atau logo.

---

## 3. Standar Copywriting Anti-AI-Slop (Aturan Keras)

Setiap dokumen rilis, pengumuman merchant, panduan pengguna, dan microcopy UI wajib mematuhi 4 aturan berikut:

1. **Berbasis Fakta Fitur Aktual:** Setiap kapabilitas yang ditulis wajib ada di codebase `v1.4.0` (Web Revamp + Mobile `US-4.1`–`US-4.6`). Dilarang mengklaim fitur yang tidak ada (mis. akuntansi pajak otomatis tahunan, multi-gudang antar-negara, atau sinkronisasi ERP eksternal).
2. **Maksimal Satu Klaim per Kalimat:** Gunakan kalimat aktif, pendek, dan langsung menyebut objek kerja (kasir, owner, barcode, shift, struk thermal Bluetooth).
3. **Microcopy UI Berbasis Aksi & Solusi:**
   - **Tombol:** Gunakan kata kerja + objek spesifik (contoh: `Simpan Pengaturan`, `Cetak Struk Thermal`, `Bagikan via WhatsApp`), bukan label kabur seperti `Lanjutkan` atau `Proses Data`.
   - **Pesan Error:** Sebutkan penyebab dan langkah perbaikan (contoh: `Bluetooth tidak aktif. Aktifkan Bluetooth perangkat Anda.`), bukan pesan generik `Terjadi kesalahan`.
   - **Empty State:** Jelaskan kondisi saat ini dan ke mana pengguna harus melangkah (contoh: `Keranjang masih kosong. Scan barcode atau klik produk di sebelah kiri.`).
4. **Zero-Tolerance Daftar Frasa Terlarang (Otomatis Gagal Review Markom):**
   - Pembuka klise: *"Di era digital saat ini..."*, *"Di tengah perkembangan teknologi yang pesat..."*, *"In today's fast-paced..."*
   - Kata sifat kosong/hiperbolis: *"terobosan revolusioner"*, *"cutting-edge"*, *"game-changer"*, *"holistik"*, *"sinergi"*, *"komprehensif"*, *"elegan"*, *"seamless"*, *"world-class"*, *"next-generation"*.
   - Kalimat pengisi generik: *"solusi end-to-end yang memberdayakan bisnis Anda"*, *"mengoptimalkan pengalaman pengguna secara menyeluruh"*, *"membawa efisiensi ke level berikutnya"*.
   - Struktur repetitif buatan: Daftar bullet yang seluruh poinnya memakai pola identik *"Judul Menggelegar — deskripsi 3 kata sifat generik"*.

---

## 4. Checklist Deliverables Markom Sprint 4 (`v1.4.0`)

| # | Deliverable | Target File / Lokasi | Kriteria Penerimaan |
|---|---|---|---|
| 1 | Audit copy ID/EN Web (`W-01`..`W-15`) & Mobile (`M-01`..`M-10`) | `src/i18n/translations.ts` | Nol sisa `"POS Retail"` / `"Toko Retail Anda"`, paritas ID/EN 100%, microcopy error & empty state jelas |
| 2 | Release Kit `v1.4.0` (Announcement ID/EN, Spotlight Web + Mobile `US-4.1`–`US-4.6`, Merchant Launch WhatsApp Copy) | `docs/process/MARKOM_RELEASE_KIT_v1.4.0.md` (dibuat pada M5) | Lolos pemeriksaan Anti-AI-Slop (`A-01`..`A-03`), seluruh fitur yang disebut terverifikasi ada di `v1.4.0` |
| 3 | Verifikasi Header, Footer & Narasi 5 Dokumen Resmi PDF | `docs/html/01..05.html` & `docs/pdf/01..05.pdf` | Semua 5 dokumen memakai branding **ALPHOS by AlphaGen** Konsep 2 Light Mode, lingkup DEV akurat, nol frasa terlarang |
| 4 | Sign-off Gate 3 | `docs/process/ANTI_UI_AI_SLOP_RUBRIC.md` & `PO_BUSINESS_READINESS_v1.4.0.md` | Seluruh audit copy & dokumen berstatus `PASS` dengan `0` Critical terbuka |
