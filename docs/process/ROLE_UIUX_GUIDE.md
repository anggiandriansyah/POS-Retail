# Panduan Peran UI/UX — ALPHOS by AlphaGen (v1.4.0)

Dokumen ini menetapkan aturan desain visual, spesifikasi logo Konsep 2, token desain Web & Mobile, serta alur kerja **Anti-UI-Slop** untuk peran UI/UX pada Sprint 4 (`v1.4.0`).

---

## 1. Peran & Tanggung Jawab UI/UX

1. **Gate 1 (Design & Contract Lock):** Memastikan seluruh token warna, tipografi, jarak (*spacing*), dan komponen logo mengacu pada spesifikasi Konsep 2 serta Shared Core (`src/i18n/translations.ts`).
2. **Review Implementasi Web & Mobile:** Memeriksa seluruh 15 permukaan Web (`W-01` s.d. `W-15`) dan 10 layar Mobile (`M-01` s.d. `M-10`, `US-4.1`–`US-4.6`) sebelum masuk ke pengujian QA Manual.
3. **Gate 3 (Dual-Slop Sign-Off):** Mengisi kolom penilaian `D1`–`D5` pada `docs/process/ANTI_UI_AI_SLOP_RUBRIC.md` bersama QA Manual dan memastikan `0` temuan **Critical** terbuka.

---

## 2. Spesifikasi Resmi Branding ALPHOS by AlphaGen (Konsep 2 Murni)

Sumber acuan tunggal: `alphos_official_concept2_widget.html` dan komponen Web `src/components/AlphosLogo.tsx`.

### Invarian Keras Logo
- **Simbol:** Kurva terbuka *Alpha-Checkmark* (`fill="none"`, `strokeLinecap="round"`, `strokeLinejoin="round"`).
- **Larangan Simbol:** Dilarang menambahkan kotak, bingkai, lingkaran pembungkus (`<rect>`, `<circle>`), maupun titik dekoratif di dalam atau di sekitar simbol.
- **Redaksi Wordmark:** Hanya `"ALPHOS"` + `"by AlphaGen"`. Dilarang keras menampilkan kata `"POS"` di dalam logo maupun sub-teks lockup.

### Tabel 4 Varian Resmi Konsep 2

| Varian | `viewBox` | `<g transform>` & `<path d>` | Warna & Tipografi | Konteks Pemakaian |
|---|---|---|---|---|
| `horizontal` (Master Dark) | `0 0 320 74` | `translate(6, 6)`<br>`M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19` | Canvas `#090e1a` / Border `#1e293b`; Check `#10B981` (`strokeWidth=5.5`); `ALPHOS` `#F8FAFC` (`28`, `800`); `by` `#10B981` + `AlphaGen` `#34D399` (`10`, `700`) | Topbar Web Dark Mode, Header Mobile Dark Mode |
| `vertical` (Stacked Dark) | `0 0 260 170` | `translate(98, 16)`<br>`M 52 26 C 37 21, 19 32, 19 46 C 19 58, 32 63, 42 55 L 48 63 L 64 26` | Canvas `#090e1a`; Check `#10B981` (`strokeWidth=7`); `ALPHOS` `#F8FAFC` (`30`, `800`, `textAnchor="middle"`); `by` `#10B981` + `AlphaGen` `#34D399` (`11`, `700`) | Hero Login Desktop (`LoginPage.tsx`), Layar Splash/Login Mobile (`US-4.2`) |
| `light` (Light Mode) | `0 0 320 74` | `translate(6, 6)`<br>`M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19` | Canvas `#FFFFFF` / Border `#CBD5E1`; Check `#059669` (`strokeWidth=5.5`); `ALPHOS` `#0F172A` (`28`, `800`); `by` `#059669` + `AlphaGen` `#10B981` (`10`, `700`) | Topbar Web Light Mode, Mobile Light Mode, Sampul 5 PDF (`docs/html/01..05.html`), Header Struk Publik |
| `thermal` (Struk Thermal) | `0 0 260 74` | `translate(4, 8)`<br>`M 40 16 C 28 12, 13 22, 13 34 C 13 44, 23 48, 32 42 L 37 48 L 49 16` | Kertas `#FFFFFF` / Preview `#F8FAFC` / Border `#94A3B8`; Check `#000000` (`strokeWidth=6.5`); `ALPHOS` `#000000` (`28`, `900`, `monospace`); `by AlphaGen` `#000000` (`10.5`, `700`, `monospace`) | `ReceiptContent.tsx`, Pratinjau `StoreSettingsForm.tsx`, Header ESC/POS Mobile (`US-4.6`) |

- **Favicon Web (`public/favicon.svg`):** Menggunakan *Alpha-Checkmark* `#10B981` tanpa kotak/titik dalam `viewBox="0 0 64 64"` (`translate(-11.5, -13.5) scale(1.3)`).

---

## 3. Design Tokens (Paritas Web CSS & Mobile React Native)

Sumber token Web: `src/app/globals.css` dan `src/app/layout.tsx`.

### 3.1 Palet Warna Light & Dark Mode

| Token | Light Mode (`:root`) | Dark Mode (`[data-theme='dark']`) | Pemakaian |
|---|---|---|---|
| `--bg` | `#f1f5f9` | `#0b1120` (Canvas brand `#090e1a`) | Latar halaman utama |
| `--bg-elevated` | `#f8fafc` | `#111827` | Permukaan sekunder / header tabel |
| `--surface` | `#ffffff` | `#151e31` | Kartu, modal, panel |
| `--surface-hover` | `#f8fafc` | `#1e293b` | Hover baris tabel / tile produk |
| `--text` | `#0f172a` | `#f1f5f9` | Teks utama & judul |
| `--text-secondary` | `#334155` | `#cbd5e1` | Label form & sub-judul |
| `--muted` | `#64748b` | `#94a3b8` | Teks pendukung & timestamp |
| `--border` / `--border-strong` | `#e2e8f0` / `#cbd5e1` | `#263248` / `#334155` | Garis pemisah & border input |
| `--primary` / `--primary-hover` | `#059669` / `#047857` | `#10b981` / `#059669` | Tombol utama, fokus, aksen aktif |
| `--primary-soft` / `--primary-text` | `#ecfdf5` / `#065f46` | `rgba(16,185,129,0.14)` / `#6ee7b7` | Badge & teks aksen aman kontras |
| `--hero-bg` | `linear-gradient(145deg, #064e3b 0%, #0f172a 100%)` | `linear-gradient(145deg, #022c22 0%, #090d16 100%)` | Panel hero Login |

### 3.2 Status Semantik

| Status | Light Mode (Bg / Text) | Dark Mode (Bg / Text) |
|---|---|---|
| Danger / Error | `#fef2f2` / `#991b1b` (solid `#dc2626`) | `rgba(239, 68, 68, 0.14)` / `#fca5a5` (solid `#ef4444`) |
| Warning / Low Stock | `#fffbeb` / `#92400e` | `rgba(245, 158, 11, 0.14)` / `#fcd34d` |
| Info / Kasir | `#eff6ff` / `#1e40af` | `rgba(59, 130, 246, 0.15)` / `#93c5fd` |
| Owner Badge | `#ede9fe` / `#5b21b6` | `rgba(139, 92, 246, 0.2)` / `#c4b5fd` |

### 3.3 Aturan Kontras WCAG AA
- Teks normal (`< 18px` atau `< 14px bold`) wajib mencapai rasio kontras minimal **4.5:1**.
- Teks besar (`>= 18px` atau `>= 14px bold`) dan komponen ikon aktif minimal **3.0:1**.
- **Aturan khusus Light Mode:** `#059669` (`--primary`) di atas `#ffffff` hanya berkisar ~3.77:1. Oleh karena itu:
  - Teks aksen hijau kecil di atas `#ffffff` atau `#ecfdf5` **wajib** memakai `--primary-text` (`#065f46`).
  - Tombol hijau dengan teks `#ffffff` ukuran standar (`0.875rem`) harus memakai latar `#047857` (`--primary-hover`, kontras 5.48:1) atau font bold berukuran cukup.
  - Dilarang memakai `#10B981` sebagai warna teks kecil di atas latar putih.

### 3.4 Tipografi, Radius, Spacing & Target Sentuh
- **Font UI:** `Plus Jakarta Sans` (`--font-sans`), bobot `400`, `500`, `600`, `700`, `800`.
- **Font Monospace:** `JetBrains Mono` (`--font-mono`) untuk kode barcode, nomor nota (`INV-...`), jam digital, dan struk thermal.
- **Angka Tabular:** Wajib `font-variant-numeric: tabular-nums` pada harga, subtotal, total, kembalian, stok, statistik shift, dan jam digital.
- **Radius Standar:** `6px` (`code`), `8px` (`btn-sm`, `icon-btn`), `10px` (`btn`, `input`, `nav-tab`, `alert`, `cart-item`), `12px` (`camera-box`, `product-tile`, `digital-clock`), `14px` (`card`, `stat-card`, `price-result`), `16px` (`modal-card`), `20px` (`login-split-shell`), `999px` (badge/pill/chip).
- **Spacing & Layout Web:** `.main-content` `max-width: 1380px`, `padding: 22px 24px 40px`; `.card` `padding: 20px`; `.pos-layout` `1.4fr 1fr`, `gap: 18px`.
- **Touch Target:** Minimal `44x44px` pada kontrol interaktif Web layar sentuh dan minimal `48x48dp` pada tombol utama Mobile Android (`PosCashier`, pembayaran, scanner, tombol navigasi bawah).
- **Breakpoint Uji:** Web `1440x900` (desktop), `<= 960px` (tablet/single-column `.pos-layout` & `.login-split-shell`), `<= 640px` / `375x812` (mobile web), `@media print` (struk thermal), serta viewport Android `360dp`–`412dp`.

---

## 4. Sepuluh Larangan Keras Anti-UI-Slop

1. **Dilarang memakai class CSS yatim (undefined):** Setiap class yang dipanggil komponen (mis. `.icon-btn.danger`, `.stock-pill.low`, `.price-result.not-found`, `.chip.active-danger`) wajib memiliki definisi CSS aktif di `globals.css`.
2. **Dilarang menimpa layout dengan `style={{}}` masif:** Flex/grid item keranjang, filter tanggal, dan formulir harus menggunakan class CSS terstruktur agar responsif di breakpoint `<= 960px` dan `<= 640px`.
3. **Dilarang memakai dialog native browser:** Ganti seluruh `window.confirm` dan `window.prompt` dengan komponen modal/inline confirmation yang dapat diakses keyboard dan konsisten tema Light/Dark.
4. **Dilarang memotong daftar secara diam-diam:** Jika daftar produk dibatasi (mis. `.slice(0, 12)`), wajib tampilkan indikator jumlah produk tersembunyi (`showingProductsHint`) dan aksi lihat semua (`showAllProductsBtn`).
5. **Dilarang membiarkan teks hardcoded satu bahasa:** Seluruh label, placeholder, pesan error, header tabel, dan `aria-label` wajib bersumber dari `translations.ts` (`id`/`en`).
6. **Dilarang membiarkan horizontal overflow:** Tidak boleh ada scrollbar horizontal pada layar `360px`/`375px` maupun pada perangkat Android.
7. **Dilarang menghilangkan state feedback:** Setiap layar/form wajib memiliki loading state, empty state dengan arahan aksi, error state yang jelas, dan konfirmasi sukses.
8. **Dilarang membiarkan teks placeholder lama:** Tidak boleh ada `"POS Retail"`, `"Toko Retail Anda"`, atau `"Jl. Contoh"` pada tampilan aplikasi atau pratinjau.
9. **Dilarang membungkus logo Konsep 2 dengan kotak:** Hapus wadah kotak `.brand-logo` yang memaksa ikon berada di dalam persegi; render `<AlphosLogo />` langsung.
10. **Dilarang merusak aksesibilitas dasar:** Setiap tombol ikon wajib memiliki `aria-label` terlokalisasi; modal wajib memakai `role="dialog"` dan `aria-modal="true"`.

---

## 5. Alur Kerja UI/UX Sprint 4 (Gate 1 s.d. Gate 3)

| Tahap | Aksi UI/UX | Keluaran Terukur |
|---|---|---|
| **Gate 1 (M1)** | Mengunci varian `AlphosLogo`, token Dark/Light, dan daftar 15 permukaan Web + 10 layar Mobile | `ROLE_UIUX_GUIDE.md` & `ANTI_UI_AI_SLOP_RUBRIC.md` |
| **Pendampingan M2–M4** | Review implementasi Web (`W-01`..`W-15`) dan Mobile (`M-01`..`M-10`) terhadap larangan Anti-UI-Slop | Catatan perbaikan per komponen sebelum merge ke `develop` |
| **Review M5** | Review tata letak 5 template PDF `docs/html/01..05.html` (Konsep 2 Light Mode, margin cetak A4) | Persetujuan visual 5 HTML/PDF |
| **Gate 3 (M6)** | Eksekusi audit visual bersama QA Manual pada Light/Dark & ID/EN | Seluruh baris `W-01`..`W-15` dan `M-01`..`M-10` berstatus `PASS`, `0` temuan Critical terbuka |
