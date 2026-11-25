# Panduan Pengguna ALPHOS by AlphaGen (`v1.4.0`)

Panduan operasional lengkap untuk aplikasi **Web (Next.js 16)** dan **Mobile Android (React Native / Expo)** pada lingkungan DEV (`tcbhaiyhtndnqgatysmh`).

## 1. Autentikasi, Bahasa & Tema
- **Masuk (Sign In):** Gunakan `username` atau `email` beserta kata sandi, atau gunakan tombol **Lanjutkan dengan Google**.
- **Bilingual (ID/EN) & Tema:** Gunakan tombol switch `ID / EN` dan `Light / Dark` di sudut kanan atas pada Web maupun Mobile.
- **Role Sistem:** `owner` dan `admin` memiliki akses manajemen penuh + Mode Kasir; `kasir` dan `user` fokus pada operasional kasir, cek harga, shift, dan permintaan stok.

## 2. Operasional Kasir (Web & Mobile)
- **Buka & Tutup Shift:** Masukkan modal awal kasir sebelum bertransaksi. Catat kas masuk/keluar (*Petty Cash* kategori `OPERASIONAL`, `KEMBALIAN`, `BELANJA_DARURAT`, `SETOR_BANK`, `LAINNYA`) dan tutup shift untuk rekonsiliasi kas otomatis.
- **Kasir & Barcode Scanner:** Cari produk atau pindai barcode menggunakan scanner USB, kamera Web (`html5-qrcode`), atau kamera Mobile (`expo-camera`) dengan fallback input manual.
- **Diskon & Pajak PPN:** Terapkan diskon per item (`Rp` / `%`), diskon nota global, dan opsi PPN opsional sesuai pengaturan toko.
- **Struk Digital & Cetak Thermal Bluetooth:** Kirim tautan struk digital (`/receipt/[invoice]`) via WhatsApp atau cetak langsung melalui printer thermal Bluetooth ESC/POS (58mm / 80mm) di aplikasi Mobile.

## 3. Operasional Owner / Admin (Web & Mobile)
- **Live Monitor & Stock Request:** Pantau transaksi masuk, stok menipis, dan setujui/tolak permintaan restock kasir secara real-time dari Web maupun tab Monitor di aplikasi Mobile.
- **Pengaturan Toko Dinamis:** Ubah nama toko, alamat, telepon, footer struk, dan tarif PPN default pada menu **Pengaturan Toko**.
- **Laporan & Export CSV:** Filter rentang tanggal riwayat transaksi dan mutasi stok, lalu unduh laporan Excel-ready (UTF-8 BOM) via tombol Export CSV.
