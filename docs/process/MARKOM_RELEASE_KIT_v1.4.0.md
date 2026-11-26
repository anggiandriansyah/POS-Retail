# Marketing Communication (Markom) Release Kit — ALPHOS by AlphaGen (`v1.4.0`)

Dokumen ini berisi materi komunikasi resmi rilis **Sprint 4 (`v1.4.0`)** untuk **ALPHOS by AlphaGen** pada lingkungan **DEV (`develop` / `tcbhaiyhtndnqgatysmh`)**. Seluruh materi disusun mengikuti pedoman branding Konsep 2 (`alphos_official_concept2_widget.html`) dan standar penulisan Anti-AI-Slop pada `docs/process/ROLE_MARKOM_GUIDE.md`.

---

## 1. Ringkasan Rilis & Penjaga Lingkup (`v1.4.0` DEV)

| Atribut | Nilai Resmi |
|---|---|
| **Produk** | **ALPHOS by AlphaGen** (sebutan singkat: **ALPHOS**) |
| **Versi Rilis** | `v1.4.0` (Sprint 4) |
| **Lingkungan Target** | **DEV** — Supabase `tcbhaiyhtndnqgatysmh`, branch `develop`, Preview Web `https://alphos-develop-anggiandriansyah.vercel.app/` |
| **Status Lingkungan PROD** | Supabase `sbtzajhgchpcdscrwtha` & branch `main` — **NOT TOUCHED / BLOCKED** (tetap pada `v1.3.0` sampai Gate 4 & persetujuan tertulis User) |
| **Target Audit** | `docs/process/ANTI_UI_AI_SLOP_RUBRIC.md` (`A-01`) |

### Batas Lingkup Fungsional (`v1.4.0`)

| Termasuk di Rilis `v1.4.0` (DEV) | Tidak Termasuk di Rilis `v1.4.0` |
|---|---|
| Revamp antarmuka Web (Next.js 16 + TypeScript) & 4 varian logo Konsep 2 | Promosi langsung ke Supabase PROD (`sbtzajhgchpcdscrwtha` — **BLOCKED**) |
| Aplikasi Mobile Android React Native (`mobile/`, `US-4.1`–`US-4.6`) | Aplikasi iOS App Store |
| Integrasi Shared Core bebas DOM (`src/types/pos.ts`, `pricing.ts`, `format.ts`, `csv.ts`, `translations.ts`) | Sinkronisasi multi-gudang antar cabang atau integrasi ERP/akuntansi eksternal |
| Cetak struk thermal Bluetooth ESC/POS (`58 mm` / `80 mm`) & share WhatsApp | Integrasi pelaporan pajak otomatis ke otoritas pajak |
| Tata kelola UI/UX, Markom, QA Manual Dual-Slop, PO Readiness & 5 PDF SOP | Perubahan skema SQL baru (berjalan di atas skema `v1.3.0`) |

---

## 2. Brief Rollout Branding Konsep 2 Murni

Acuan visual tunggal: `alphos_official_concept2_widget.html` dan `src/components/AlphosLogo.tsx`.

### Aturan Visual & Verbal Wajib
- **Simbol:** Kurva terbuka *Alpha-Checkmark* (`fill="none"`, `strokeLinecap="round"`, `strokeLinejoin="round"`).
- **Larangan Simbol:** Jangan tambahkan kotak bingkai, lingkaran pembungkus, atau titik dekoratif di sekitar simbol.
- **Teks Lockup:** Wajib berbunyi `"ALPHOS"` dengan sub-teks `"by AlphaGen"`. Jangan masukkan kata `"POS"` ke dalam logo maupun lockup.
- **Nama Toko Default:** `ALPHOS Store` (`STORE_INFO.name` di `src/utils/format.ts`).
- **Penyebutan Prose:** Gunakan **ALPHOS by AlphaGen** pada penyebutan pertama dan **ALPHOS** pada penyebutan berikutnya. Kata deskriptif seperti *platform kasir* hanya dipakai dalam penjelasan fungsi.

### Matriks Pemakaian 4 Varian Logo

| Varian | Palet Utama | Lokasi Pemakaian |
|---|---|---|
| **Horizontal Master** (`horizontal`) | Latar `#090e1a`, Stroke `#10B981`, `ALPHOS` `#F8FAFC`, `by AlphaGen` `#10B981`/`#34D399` | Topbar Web Dark Mode, header Mobile Dark Mode |
| **Vertical Stacked** (`vertical`) | Latar `#090e1a`, Stroke `#10B981`, `ALPHOS` `#F8FAFC` | Panel hero Login Desktop (`LoginPage.tsx`), layar Splash/Login Mobile (`US-4.2`) |
| **Light Mode** (`light`) | Latar `#FFFFFF`, Border `#CBD5E1`, Stroke `#059669`, `ALPHOS` `#0F172A`, `by AlphaGen` `#059669`/`#10B981` | Topbar Web Light Mode, Mobile Light Mode, 5 PDF resmi (`docs/html/01..05.html`), header struk publik |
| **Struk Thermal** (`thermal`) | Kertas `#FFFFFF`, Tinta `#000000` monospace | `ReceiptContent.tsx`, Pratinjau `StoreSettingsForm.tsx`, header struk thermal Bluetooth ESC/POS (`US-4.6`) |

---

## 3. Pengumuman Rilis `v1.4.0` (Bilingual ID & EN)

### A. Versi Bahasa Indonesia (Rilis Uji DEV & Stakeholder)

**ALPHOS by AlphaGen v1.4.0 Hadir di Web dan Mobile Android (Lingkungan DEV)**

Tim pengembang meluncurkan rilis **ALPHOS by AlphaGen v1.4.0** pada lingkungan pengujian DEV (`develop` / `tcbhaiyhtndnqgatysmh`). Pembaruan ini menyatukan identitas merek **ALPHOS by AlphaGen** di seluruh halaman web, struk digital, dokumen PDF rilis, dan aplikasi mobile.

Seluruh 15 layar Web diperbarui agar kontras warna Light dan Dark Mode terbaca jelas, angka harga rata kanan dengan `tabular-nums`, konfirmasi hapus dan tutup shift memakai modal interaktif, serta seluruh label tersedia dalam Bahasa Indonesia dan Bahasa Inggris. Di sisi mobile, aplikasi **React Native Android (`mobile/`, `US-4.1`–`US-4.6`)** memakai langsung modul Shared Core (`pricing.ts`, `format.ts`, `csv.ts`, `translations.ts`) sehingga hitungan diskon item, diskon nota, PPN, kembalian, dan format struk sama persis dengan Web.

Kasir di Android dapat membuka shift, mencatat kas masuk/keluar (*Petty Cash*), memindai barcode lewat kamera atau input manual, mengirim struk ke WhatsApp, dan mencetak struk `58 mm` atau `80 mm` melalui printer thermal Bluetooth ESC/POS. Pemilik toko dapat memantau penjualan berjalan, peringatan stok menipis, dan permintaan stok dari layar **Live Monitor**. Rilis `v1.4.0` saat ini berjalan khusus pada lingkungan DEV untuk verifikasi QA dan Product Owner sebelum dipertimbangkan naik ke produksi.

### B. English Version (DEV Preview & Stakeholder Update)

**ALPHOS by AlphaGen v1.4.0 Launches Across Web and Android Mobile (DEV Environment)**

The engineering team has released **ALPHOS by AlphaGen v1.4.0** to the DEV verification environment (`develop` / `tcbhaiyhtndnqgatysmh`). This update establishes the **ALPHOS by AlphaGen** brand system across all web views, digital and thermal receipts, release PDFs, and the Android mobile client.

All 15 web views now enforce WCAG AA contrast in both Light and Dark modes, tabular numeric alignment (`tabular-nums`) for prices and totals, modal confirmations replacing browser popups, and full Indonesian/English copy parity. On mobile, the **React Native Android app (`mobile/`, `US-4.1`–`US-4.6`)** imports the DOM-free Shared Core (`pricing.ts`, `format.ts`, `csv.ts`, `translations.ts`) directly, ensuring identical discount, VAT, change, and receipt calculations across Web and Android.

Android cashiers can open shifts, record `IN`/`OUT` petty cash entries, scan barcodes with the device camera or manual entry, share receipt links via WhatsApp, and print `58 mm` or `80 mm` receipts on Bluetooth ESC/POS thermal printers. Store owners can track active shifts, live sales, low-stock alerts, and cashier stock requests in **Live Monitor**. Version `v1.4.0` runs strictly on DEV pending final QA and Product Owner sign-off before any production rollout.

---

## 4. Sorotan Fitur & Manfaat Operasional (`v1.4.0`)

| Area | Kapabilitas Faktual di Codebase | Manfaat Operasional bagi Pengguna | Referensi |
|---|---|---|---|
| **Branding Konsep 2 & Keterbacaan UI** | Logo *Alpha-Checkmark* murni (4 varian), token WCAG AA Light (`#065F46`) & Dark (`#6EE7B7`), `tabular-nums`, tanpa overflow di layar `375px` & `360dp`. | Kasir membaca harga, kembalian, dan tombol aksi tanpa salah ketik atau teks terpotong di layar kecil. | `AlphosLogo.tsx`, `globals.css`, `W-01`..`W-15` |
| **Keamanan Aksi & Paritas ID/EN** | Modal konfirmasi hapus produk dan Force Close Shift menggantikan dialog browser; kamus penuh `id`/`en` termasuk kategori Petty Cash & mobile. | Menghindari salah hapus produk dan memastikan staf berbahasa Indonesia atau Inggris mendapat istilah yang konsisten. | `InventoryManager.tsx`, `OwnerShifts.tsx`, `translations.ts` |
| **Autentikasi & Role Routing Mobile** | Login `@username` atau email (`resolve_login_email`), routing 4 peran (`owner`/`admin`/`kasir`/`user`), penjaga akun nonaktif, toggle tema & bahasa. | Kasir langsung masuk ke layar transaksi sementara Owner melihat menu kendali dan pemantauan toko. | `US-4.1`, `US-4.2` |
| **Kasir Mobile, Scanner & WhatsApp** | Kamera barcode scanner dengan tombol senter & fallback input manual, diskon item/nota (`Rp`/`%`), PPN, checkout atomik `process_sale`, share WhatsApp (`wa.me`). | Kasir tetap bisa melayani antrean dengan kamera HP atau input manual dan mengirim nota digital ke pelanggan. | `US-4.3`, `US-4.4`, `pricing.ts` |
| **Live Monitor & Request Stok** | Pembaruan realtime (`supabase_realtime`) untuk transaksi, shift aktif, stok menipis, serta 1-klik **Restock / Setujui / Tolak** permintaan kasir. | Owner mengetahui rak yang kosong dan memproses pengisian stok tanpa menunggu laporan akhir hari. | `US-4.5`, `OwnerLiveMonitor.tsx` |
| **Printer Thermal Bluetooth ESC/POS** | Pindai & hubungkan printer Bluetooth, pilih kertas `58 mm` / `80 mm`, header *Struk Thermal* **ALPHOS by AlphaGen**, uji cetak, serta pratinjau fallback bila printer belum terhubung. | Toko dapat mencetak struk kertas dari HP Android atau tetap memakai pratinjau/WhatsApp saat printer tidak tersedia. | `US-4.6`, `translations.ts` (`printer`) |

---

## 5. Materi Onboarding Merchant, WhatsApp & Kanal Rilis

### A. Template Broadcast WhatsApp (Bahasa Indonesia — Uji Beta DEV)

```text
Halo Rekan Toko & Tim Penguji,

ALPHOS by AlphaGen v1.4.0 kini aktif di lingkungan uji DEV untuk Web dan aplikasi Android.

Pembaruan utama yang siap diuji:
1. Tampilan baru Light & Dark Mode dengan teks lebih jelas di desktop maupun HP.
2. Aplikasi Kasir Android: buka/tutup shift, catat petty cash, scan barcode kamera, hitung diskon & PPN, dan kirim struk ke WhatsApp.
3. Cetak struk Bluetooth ESC/POS (58 mm & 80 mm) serta pantauan Live Monitor untuk Owner.

Akses Web DEV: https://alphos-develop-anggiandriansyah.vercel.app/
Catatan: Lingkungan uji ini memakai database DEV terpisah dari data toko produksi.

Silakan laporkan temuan layar atau kendala printer ke tim QA/PO. Terima kasih.
```

### B. WhatsApp Broadcast Template (English — DEV Beta Testing)

```text
Hello Store Partners & QA Testers,

ALPHOS by AlphaGen v1.4.0 is now live in the DEV testing environment for Web and Android.

Key updates ready for verification:
1. Refreshed Light and Dark Mode screens with readable contrast on desktop and mobile.
2. Android Cashier app: shift open/close, petty cash logs, camera barcode scanning, item/order discounts, VAT, and WhatsApp receipt sharing.
3. Bluetooth ESC/POS thermal printing (58 mm and 80 mm) plus Owner Live Monitor and Stock Requests.

DEV Web URL: https://alphos-develop-anggiandriansyah.vercel.app/
Note: This preview runs on the isolated DEV database and does not affect production store data.

Please share UI feedback or printer test notes with the QA/PO team. Thank you.
```

### C. Checklist Onboarding Merchant (4 Langkah Ringkas)

1. **Masuk Akun (`US-4.2`):** Buka Web DEV atau aplikasi Android **ALPHOS**, lalu login memakai `@username` atau email yang didaftarkan Owner.
2. **Atur Profil Toko & Pajak:** Owner membuka menu **Pengaturan Toko** untuk mengisi Nama Toko, Alamat, Telepon, Catatan Footer Struk, dan tarif PPN default.
3. **Buka Shift & Siapkan Printer (`US-4.3`, `US-4.6`):** Kasir mengisi modal awal laci saat **Buka Shift**, lalu menghubungkan printer thermal Bluetooth `58 mm`/`80 mm` di menu Pengaturan jika menggunakan cetak kertas.
4. **Layani Transaksi & Kirim Struk (`US-4.4`):** Pindai barcode produk via kamera atau scanner USB, pilih metode bayar (`Cash`/`QRIS`/`Transfer`), lalu cetak struk thermal atau bagikan via WhatsApp.

### D. Copy Singkat Kanal Rilis / Changelog Sosial (ID & EN)

- **ID:** *Rilis DEV ALPHOS by AlphaGen v1.4.0 tersedia untuk pengujian internal. Pembaruan mencakup tampilan Web Konsep 2 di Light dan Dark Mode serta aplikasi kasir Android dengan barcode scanner kamera, Live Monitor, dan cetak struk Bluetooth 58 mm/80 mm.*
- **EN:** *ALPHOS by AlphaGen v1.4.0 DEV preview is open for verification. The release delivers the Concept 2 Web UI refresh across Light and Dark modes alongside the Android cashier app with camera barcode scanning, Owner Live Monitor, and 58 mm/80 mm Bluetooth thermal printing.*

---

## 6. Self-Check Anti-AI-Slop & Kesiapan Markom (`A-01`)

| Kriteria Pemeriksaan (`ROLE_MARKOM_GUIDE.md §3`) | Hasil Verifikasi Markom |
|---|---|
| Nol kebocoran merek lama (`POS Toko Retail`, `PT POS Retail`, penyebutan POS pada logo, `Toko Retail Anda`, `Jl. Contoh`) | Terverifikasi `0` kemunculan |
| Nol frasa pembuka klise, kata sifat hiperbolis, atau kalimat pengisi generik | Terverifikasi `0` kemunculan |
| Maksimal 1 klaim faktual per kalimat & seluruh fitur merujuk ke codebase `v1.4.0` / `US-4.1`–`US-4.6` | Terpenuhi |
| Disclaimer lingkungan DEV (`tcbhaiyhtndnqgatysmh`) dan status PROD `sbtzajhgchpcdscrwtha` tidak tersentuh tercantum jelas | Terpenuhi |
| Kejujuran perangkat keras (pratinjau thermal & fallback WhatsApp dijelaskan bila printer Bluetooth fisik absen) | Terpenuhi |
