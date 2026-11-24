# Panduan Pengguna POS Toko Retail (`v1.2.0`)

Selamat datang di **POS Toko Retail** — sistem kasir dan manajemen toko berbasis web (Next.js 16 App Router + Supabase). Panduan ini disusun secara praktis untuk **Owner** dan **Kasir** agar operasional harian toko berjalan cepat, rapi, dan akurat.

---

## 1. Cara Login & Pendaftaran Akun

### A. Login (Owner & Kasir)
1. Buka halaman utama aplikasi.
2. Pada tab **Masuk (Sign In)**, masukkan:
   - **Username atau Email** (contoh: `budi` atau `budi@toko.com`)
   - **Password**
3. Klik tombol **Masuk**. Sistem akan otomatis mengenali role Anda (`Owner` atau `Kasir`) dan menampilkan menu yang sesuai.

> **Catatan:** Anda dapat login menggunakan **Username** tanpa harus mengetik alamat email lengkap berkat fitur resolusi akun otomatis.

### B. Daftar Owner Pertama (Sign Up)
Jika toko belum memiliki akun Owner:
1. Buka tab **Daftar (Sign Up)** di halaman login.
2. Pilih salah satu metode:
   - **Email & Password**: Isi Nama Lengkap, Email, Password, dan Konfirmasi Password, lalu klik **Daftar**.
   - **Google OAuth**: Klik tombol **Lanjutkan dengan Google** untuk masuk menggunakan akun Google Anda.

> **Penting:** Pendaftaran mandiri hanya untuk akun **Owner**. Akun **Kasir** tidak didaftarkan dari halaman ini, melainkan dibuat langsung oleh Owner melalui menu **Kelola Kasir**.

---

## 2. Pengaturan Tampilan (Bilingual & Tema)

Di pojok kanan atas aplikasi tersedia dua tombol **Swipe Toggle** yang preferensinya tersimpan otomatis di browser (`localStorage`):

- **Bahasa (`ID` / `EN`)**: Geser toggle bendera **ID** (Bahasa Indonesia) atau **EN** (Bahasa Inggris) untuk mengganti bahasa seluruh antarmuka secara instan.
- **Tema (Dark / Light Mode)**: Geser toggle ikon **Matahari** (Mode Terang) atau **Bulan** (Mode Gelap) sesuai kenyamanan mata saat bekerja di toko.

---

## 3. Panduan POV Kasir

Saat login sebagai **Kasir**, tampilan difokuskan pada kelancaran transaksi dan operasional shift.

### A. Buka Shift (Open Shift)
Sebelum melayani transaksi, kasir wajib membuka shift terlebih dahulu:
1. Buka menu **Shift Kasir**.
2. Perhatikan **Digital Clock (`HH:MM:SS`)** yang menampilkan waktu real-time pembukaan shift.
3. Masukkan **Modal Awal Kas** (uang tunai awal di laci kasir).
4. Klik **Buka Shift**.

### B. Kasir (POS) & Barcode Scanner
Pada menu **Kasir (POS)**, Anda dapat memindai barang dengan 3 cara fleksibel:
1. **Scanner USB / Bluetooth**: Arahkan kursor atau langsung scan barcode produk; produk otomatis masuk ke keranjang.
2. **Kamera Live**: Klik ikon kamera untuk membuka pemindai langsung (`BarcodeDetector` dengan *continuous autofocus* untuk pembacaan cepat).
3. **Tombol Foto (Photo Scan)**: Jika kamera live terkendala pencahayaan atau fokus, klik **Ambil Foto / Pilih Gambar** untuk memindai barcode dari foto kemasan produk.

**Langkah Checkout:**
1. Tambahkan produk ke keranjang (atur jumlah `+` / `-` atau hapus jika perlu).
2. Pilih metode pembayaran: **Cash**, **QRIS**, atau **Transfer**.
3. Untuk pembayaran **Cash**, gunakan tombol **Uang Pas** atau pilih **Nominal Cepat** (atau ketik nominal bayar) untuk menghitung kembalian otomatis.
4. Klik **Bayar / Selesaikan Transaksi**.

### C. Kirim Digital Receipt (Struk Digital)
Setelah transaksi berhasil, modal **Struk Digital** akan muncul:
- **Kirim WhatsApp**: Klik tombol WhatsApp untuk mengirim ringkasan & tautan struk langsung ke nomor pelanggan.
- **Salin Link**: Salin tautan publik `/receipt/:invoice` untuk dibagikan via chat lain.
- **Print / Simpan PDF**: Cetak struk thermal atau simpan sebagai dokumen PDF.

### D. Cek Harga Cepat
Gunakan menu **Cek Harga** saat pelanggan menanyakan harga barang tanpa memasukkannya ke keranjang:
- Pindai barcode (via USB, Kamera Live, atau Foto) atau ketik nama produk.
- Layar langsung menampilkan **Harga Jual** dan **Sisa Stok** terkini.

### E. Catat Petty Cash (`IN` / `OUT`)
Untuk mencatat uang kas di luar transaksi penjualan selama shift berjalan:
1. Buka menu **Shift Kasir** > bagian **Petty Cash**.
2. Pilih tipe:
   - **`IN` (Kas Masuk)**: misalnya penambahan uang kembalian dari Owner.
   - **`OUT` (Kas Keluar)**: misalnya beli plastik, air minum, atau biaya operasional kecil.
3. Isi nominal dan keterangan singkat, lalu simpan.

### F. Request Barang Habis ke Owner
Jika stok barang di rak menipis atau habis saat melayani pelanggan:
1. Buka panel **Request Stok** (atau dari menu terkait).
2. Pilih produk, masukkan jumlah yang dibutuhkan serta catatan (opsional).
3. Klik **Kirim Request**. Permintaan akan langsung muncul secara real-time di **Live Monitor** milik Owner.

### G. Tutup Shift (Close Shift)
Di akhir jam kerja:
1. Buka menu **Shift Kasir**, perhatikan **Digital Clock (`HH:MM:SS`)** waktu penutupan.
2. Hitung uang tunai fisik di laci kasir dan masukkan pada kolom **Kas Akhir Aktual**.
3. Sistem akan otomatis menghitung **Kas Seharusnya** (Modal Awal + Penjualan Cash + Petty Cash `IN` - Petty Cash `OUT`) dan menampilkan **Selisih Kas** (jika ada).
4. Tambahkan catatan penutupan bila diperlukan, lalu klik **Tutup Shift**.

---

## 4. Panduan POV Owner

Saat login sebagai **Owner**, Anda memiliki kendali penuh atas pemantauan toko, stok, kasir, dan laporan keuangan.

### A. Live Monitor (Pemantauan Real-Time)
Menu **Live Monitor** menampilkan kondisi toko secara langsung tanpa perlu refresh halaman:
- **Penjualan Realtime**: Daftar transaksi terbaru yang baru saja diselesaikan kasir.
- **Kasir Aktif**: Daftar kasir yang sedang membuka shift beserta waktu mulai dan modal awalnya.
- **Peringatan Low Stock**: Daftar produk dengan stok menipis atau habis.
- **Request Barang dari Kasir (1-Klik Aksi)**:
  - **Restock / Approve**: Menyetujui permintaan kasir dan langsung menambah stok produk dalam 1 klik.
  - **Reject**: Menolak permintaan jika pengadaan ditunda.

### B. Produk & Scan Mutasi Stok
Di menu **Produk & Stok**:
- **Tambah / Edit Produk**: Isi nama, barcode, harga beli, harga jual, dan stok awal. Pada form **Tambah Produk**, Anda juga dapat langsung menggunakan **Scan Kamera Live**, **Foto**, atau **Scanner USB** untuk mengisi kolom barcode secara otomatis.
- **Scan Mutasi Stok**:
  - **Barang Masuk (Restock)**: Scan barcode produk dan tambahkan jumlah stok baru.
  - **Pengurangan Stok**: Catat barang *rusak*, *kedaluwarsa*, atau *pemakaian toko* agar histori di `stock_logs` tetap akurat.

### C. Rekap Semua Shift & Force Close
Di menu **Rekap Shift**:
- Pantau seluruh riwayat shift dari semua kasir (modal awal, total penjualan per metode bayar, petty cash, kas aktual, dan selisih kas).
- **Force Close**: Jika ada kasir yang lupa menutup shift hingga berganti hari, Owner dapat menekan tombol **Force Close** untuk menutup paksa shift tersebut agar kasir bisa membuka shift baru.

### D. Kelola Akun Kasir (`@username`)
Di menu **Kelola Kasir**:
1. Klik **Tambah Kasir**.
2. Masukkan Nama Lengkap, **Username** (ditampilkan dengan format `@username`), Email, dan Password awal.
3. Simpan akun agar kasir dapat langsung login menggunakan `@username` (atau email) tersebut.
4. Owner juga dapat menonaktifkan atau mengelola akses kasir dari halaman ini.

### E. Laporan Omzet & Laba Kotor
Di menu **Laporan**:
- Lihat ringkasan **Omzet Harian / Periode**, **Jumlah Nota**, dan **Estimasi Laba Kotor** (berdasarkan selisih harga jual dan harga beli).
- Tinjau rincian riwayat transaksi serta riwayat mutasi stok untuk keperluan audit toko.

### F. Mode Kasir (Owner Ikut Melayani)
Jika toko sedang ramai, Owner dapat mengaktifkan **Mode Kasir** untuk membuka antarmuka Kasir (POS) lengkap dan melayani checkout pelanggan secara langsung tanpa perlu membuat akun kasir terpisah.
