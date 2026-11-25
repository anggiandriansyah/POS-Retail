# Panduan Peran QA Manual (Standar Anti-UI-Slop & Anti-AI-Slop) — ALPHOS by AlphaGen (v1.4.0)

Dokumen ini menetapkan mindset, klasifikasi tingkat cacat (*severity*), matriks eksekusi uji manual, dan aturan pelaporan jujur bagi **QA Manual** pada Sprint 4 (`v1.4.0`) untuk Web dan Mobile Android.

---

## 1. Mindset Inti QA Manual Sprint 4

1. **UI-Slop adalah Cacat Fungsional:** Kontras teks tidak terbaca, tombol terpotong, overflow horizontal, state loading/error hilang, bahasa tercampur ID/EN, atau dialog `window.confirm` diklasifikasikan sebagai **Functional Defect**, bukan "catatan kosmetik".
2. **AI-Slop adalah Cacat Mutu:** Copy generik/klise yang melanggar `ROLE_MARKOM_GUIDE.md`, dokumentasi yang mengarang langkah UI berbeda dari aplikasi aktual, atau laporan uji yang mengklaim hasil tanpa bukti eksekusi diklasifikasikan sebagai **Blocker Defect**.
3. **Bukti Nyata Wajib Sebelum `PASS`:** Dilarang menandai permukaan `W-01`..`W-15` atau `M-01`..`M-10` sebagai `PASS` sebelum membuka dan menguji permukaan tersebut di kedua tema (**Light & Dark**), kedua bahasa (**ID & EN**), dan ukuran viewport/perangkat target.
4. **Kejujuran Keterbatasan Hardware:** Jika printer thermal Bluetooth fisik atau kamera perangkat fisik tidak tersedia di lingkungan uji, QA Manual **wajib** mencatat batasan tersebut secara eksplisit pada kolom Caveats/Catatan serta memverifikasi UI, permission flow, pratinjau struk thermal, dan payload byte ESC/POS melalui unit test/emulator. Dilarang keras mengklaim cetak fisik berhasil jika tidak ada printer fisik.

---

## 2. Klasifikasi Severity & Ambang Lulus

| Severity | Definisi Cacat (UI-Slop, AI-Slop, Fungsional) | Batas Terbuka untuk Gate 3 / Gate 4 |
|---|---|---|
| **Critical (Blocker)** | • Logo Konsep 2 salah (ada kotak/lingkaran/titik atau kata `"POS"` di logo).<br>• Horizontal overflow atau tombol/teks terpotong di `360px`/`375px` atau Android.<br>• Kontras teks tidak terbaca (`< 4.5:1` teks kecil atau teks putih di latar putih / gelap di latar gelap).<br>• Alur crash, error tidak ditangani, atau tombol aksi utama tidak merespons.<br>• Build/runtime DEV terhubung ke Supabase PROD (`sbtzajhgchpcdscrwtha`) bukan DEV (`tcbhaiyhtndnqgatysmh`).<br>• Placeholder `"POS Retail"` / `"Toko Retail Anda"` masih tampil di UI utama.<br>• Klaim palsu / hasil uji fiktif / langkah manual palsu (AI-Slop). | **Wajib `0`** di seluruh permukaan Web, Mobile, dan Dokumen |
| **Major** | • Inkonsistensi spacing/radius/tipografi `tabular-nums`.<br>• Teks campuran ID/EN pada bahasa aktif.<br>• Masih memakai `window.confirm` / `window.prompt`.<br>• Loading state atau empty state hilang pada panel sekunder.<br>• Frasa klise AI tertinggal di dokumentasi rilis / Markom. | **`0` pada alur inti** (Login, Kasir, Shift, Struk, Live Monitor, Thermal Print). Non-inti wajib diperbaiki atau mendapat pengecualian tertulis PO |
| **Minor** | • Penyesuaian mikro posisi ikon atau teks non-kritis yang tidak menghalangi keterbacaan dan interaksi. | Boleh dicatat sebagai tindak lanjut jika disetujui PO |

---

## 3. Matriks & Protokol Eksekusi Uji Manual

### 3.1 Matriks Uji Web (`W-01` s.d. `W-15`)
Setiap permukaan Web wajib diperiksa pada kombinasi:
- **Viewport:** Desktop (`1440x900`), Tablet (`768x1024`), Mobile Web (`375x812`), serta `@media print` khusus permukaan `W-15` (Struk Publik & Cetak Thermal).
- **Tema:** Light Mode (`light`) dan Dark Mode (`dark`).
- **Bahasa:** Bahasa Indonesia (`id`) dan English (`en`).
- **Role:** `kasir` (`W-01`..`W-08`, `W-14`..`W-15`) dan `owner` (`W-01`..`W-15`).
- **Isolasi Lingkungan:** Pastikan Network tab browser / konfigurasi build mengarah ke `https://tcbhaiyhtndnqgatysmh.supabase.co` (DEV) dan tidak pernah ke `sbtzajhgchpcdscrwtha` (PROD).

### 3.2 Matriks Uji Mobile Android (`M-01` s.d. `M-10` / `US-4.1`–`US-4.6`)
- **Target Eksekusi:** Perangkat Android atau Emulator via `adb` dengan APK debug/release DEV.
- **Cakupan Wajib:**
  1. Verifikasi Shared Core (`pricing.ts`, `format.ts`, `translations.ts`) menghasilkan nilai rupiah, diskon, PPN, dan kembalian yang identik dengan Web.
  2. Uji login, role routing 4-role (`owner`/`admin`/`kasir`/`user`), akun nonaktif, toggle ID/EN, dan toggle Dark/Light (`US-4.2`).
  3. Uji buka shift, petty cash `IN`/`OUT`, hitung selisih, dan tutup shift (`US-4.3`).
  4. Uji tambah item keranjang, scan kamera (permission allow/deny + manual fallback), diskon item/nota, PPN, checkout, dan share struk WhatsApp (`US-4.4`).
  5. Uji Owner Live Monitor realtime, low-stock alert, dan kirim/approve/restock/reject Stock Request (`US-4.5`).
  6. Uji layar Bluetooth Thermal Printer, pilih lebar kertas `58mm`/`80mm`, pratinjau logo Struk Thermal Konsep 2, serta penanganan error saat Bluetooth mati/izin ditolak (`US-4.6`).

### 3.3 Protokol Audit Anti-AI-Slop Dokumen & Kode
1. Periksa `docs/process/MARKOM_RELEASE_KIT_v1.4.0.md`, `docs/html/01..05.html`, `docs/pdf/01..05.pdf`, `README.md`, dan `USER_GUIDE.md` terhadap daftar frasa terlarang di `ROLE_MARKOM_GUIDE.md §3`.
2. Bandingkan langkah operasional pada `02_USER_MANUAL_GUIDE` dengan nama tab, tombol, dan alur aktual di Web & Mobile.
3. Periksa laporan hasil uji (`03_LAPORAN_PENGUJIAN_AKHIR`) dan sertifikasi (`04_SERTIFIKASI_DEPLOYMENT`) untuk memastikan angka pass/fail, commit SHA, dan batasan hardware sesuai log eksekusi nyata.

---

## 4. Format Pelaporan Temuan Defect

Setiap temuan cacat wajib dicatat dengan format tabel berikut:

```markdown
| ID | Surface (`W-xx`/`M-xx`/`A-xx`) | Kategori | Severity | Kondisi Uji (Viewport/Device, Tema, Bahasa) | Langkah Reproduksi | Expected vs Actual | Status |
|---|---|---|---|---|---|---|---|
| DEF-01 | W-03 | UI-Slop | Critical | 375x812, Dark, EN | Buka tab Cashier -> lihat daftar produk | Tidak ada overflow horizontal vs kartu produk melebar 410px | OPEN |
```

Kategori yang diakui: `UI-Slop`, `AI-Slop`, `Functional`, `Security/Env`.
