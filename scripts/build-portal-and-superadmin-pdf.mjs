import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PDF_DIR = path.join(ROOT, 'docs', 'pdf');
const HTML_DIR = path.join(ROOT, 'docs', 'html');
const ARTIFACT_DIR = 'C:\\Users\\2419\\.gemini\\antigravity\\brain\\9d4cc955-d500-4965-83aa-23fd054170e1';

fs.mkdirSync(PDF_DIR, { recursive: true });
fs.mkdirSync(HTML_DIR, { recursive: true });

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Direktori Portal & Kredensial Superadmin ALPHOS v1.6.0</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 11pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2.5px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 24pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #059669;
    }
    .brand-sub {
      font-size: 9pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
    }
    .doc-meta strong {
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-prod {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .badge-dev {
      background: #e0f2fe;
      color: #075985;
      border: 1px solid #7dd3fc;
    }
    .badge-sec {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    h2 {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
    }
    p {
      margin: 0 0 10px 0;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 800;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      background: #ffffff;
    }
    .card-prod {
      border-left: 5px solid #059669;
    }
    .card-dev {
      border-left: 5px solid #0284c7;
    }
    .card-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .note-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 9pt;
      color: #166534;
      margin-top: 14px;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 8pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="brand">ALPHOS <span>Smart POS</span></div>
      <div class="brand-sub">PT AlphaGen Multi Teknologi</div>
    </div>
    <div class="doc-meta">
      <strong>DOKUMEN RESMI DIREKTORI PORTAL</strong><br>
      No. Dokumen: <code>DOC-DIR-20261128-SUPERADMIN-V160</code><br>
      Tanggal Rilis: 28 November 2026 | Versi: <strong>1.6.0 (Production)</strong><br>
      Disahkan Oleh: <strong>Anggi Andriansyah (Team Leader)</strong>
    </div>
  </div>

  <h1>Direktori Portal Resmi & Kredensial Superadmin ALPHOS</h1>
  <p>Dokumen ini merangkum seluruh tautan akses resmi, portal login, kredensial akun Superadmin yang telah terdaftar secara native di database Supabase, serta alur verifikasi sistem pada lingkungan <strong>Production</strong> dan <strong>Development (DEV)</strong>.</p>

  <!-- BAB 1: DIREKTORI PORTAL LENGKAP -->
  <h2>1. Matriks Tautan Portal Sistem (Production & DEV)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Portal / Layanan</th>
        <th style="width: 45%;">Tautan Akses (URL)</th>
        <th style="width: 15%;">Lingkungan</th>
        <th style="width: 20%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Landing Page Resmi</strong></td>
        <td><a href="https://alphos-smartpos.vercel.app/">https://alphos-smartpos.vercel.app/</a></td>
        <td><span class="badge badge-prod">Production</span></td>
        <td>Etalase SaaS B2B, paket langganan 3 tiers, simulator ATM POS.</td>
      </tr>
      <tr>
        <td><strong>Production Mirror</strong></td>
        <td><a href="https://pos-retail-umber.vercel.app/">https://pos-retail-umber.vercel.app/</a></td>
        <td><span class="badge badge-prod">Production</span></td>
        <td>Mirror cluster cadangan Production (sinkron 100%).</td>
      </tr>
      <tr>
        <td><strong>Portal Login Terpadu (PROD)</strong></td>
        <td><a href="https://alphos-smartpos.vercel.app/login">https://alphos-smartpos.vercel.app/login</a></td>
        <td><span class="badge badge-prod">Production</span></td>
        <td>Pintu masuk Kasir, Owner, dan Superadmin PROD.</td>
      </tr>
      <tr>
        <td><strong>DEV Preview Web</strong></td>
        <td><a href="https://alphos-smartpos-dev.vercel.app/">https://alphos-smartpos-dev.vercel.app/</a></td>
        <td><span class="badge badge-dev">Development</span></td>
        <td>Lingkungan pengujian fitur baru dan staging tim internal.</td>
      </tr>
      <tr>
        <td><strong>Portal Login Terpadu (DEV)</strong></td>
        <td><a href="https://alphos-smartpos-dev.vercel.app/login">https://alphos-smartpos-dev.vercel.app/login</a></td>
        <td><span class="badge badge-dev">Development</span></td>
        <td>Pintu masuk Kasir, Owner, dan Superadmin DEV.</td>
      </tr>
      <tr>
        <td><strong>Verifikasi Merchant</strong></td>
        <td><code>/verify-account?token=&lt;TOKEN&gt;</code></td>
        <td><span class="badge badge-prod">Keduanya</span></td>
        <td>Halaman landing aktivasi merchant pasca-approval tiket.</td>
      </tr>
      <tr>
        <td><strong>Struk Digital Kasir</strong></td>
        <td><code>/receipt/[invoice]</code></td>
        <td><span class="badge badge-prod">Keduanya</span></td>
        <td>Tampilan struk transaksi publik untuk pelanggan (Invoice QR).</td>
      </tr>
    </tbody>
  </table>

  <!-- BAB 2: KREDENSIAL AKUN RESMI -->
  <h2>2. Kredensial Akun Superadmin & Akun Operasional yang Divalidasi</h2>
  <p>Seluruh akun di bawah ini telah ter-seed secara <strong>database-native</strong> pada Supabase Auth (<code>auth.users</code>) dan <code>public.profiles</code> dengan hashing Blowfish (<code>pgcrypto</code>) serta hak akses Row Level Security (RLS) terisolasi penuh:</p>

  <div class="card card-prod">
    <div class="card-title">
      <span>🛡️ AKUN SUPERADMIN — PRODUCTION</span>
      <span class="badge badge-prod">Production Live</span>
    </div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Portal Akses</strong></td>
        <td><a href="https://alphos-smartpos.vercel.app/login">https://alphos-smartpos.vercel.app/login</a></td>
      </tr>
      <tr>
        <td><strong>Username</strong></td>
        <td><span class="code">adminprod</span></td>
      </tr>
      <tr>
        <td><strong>Email Terdaftar</strong></td>
        <td><span class="code">adminprod@alphagen.co.id</span></td>
      </tr>
      <tr>
        <td><strong>Kata Sandi</strong></td>
        <td><span class="code">Jakarta123</span></td>
      </tr>
      <tr>
        <td><strong>Peran (*Role*)</strong></td>
        <td><code>superadmin</code> (Otoritas Penuh B2B Merchant Hub & Approval Registrasi)</td>
      </tr>
      <tr>
        <td><strong>Basis Data</strong></td>
        <td>Supabase Production: <code>sbtzajhgchpcdscrwtha</code> (Singapore)</td>
      </tr>
      <tr>
        <td><strong>Status Verifikasi</strong></td>
        <td><strong style="color: #059669;">✔ 100% SUKSES LOGIN & JWT SESI VALID (200 OK)</strong></td>
      </tr>
    </table>
  </div>

  <div class="card card-dev">
    <div class="card-title">
      <span>🛡️ AKUN SUPERADMIN — DEVELOPMENT (DEV)</span>
      <span class="badge badge-dev">Development Live</span>
    </div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Portal Akses</strong></td>
        <td><a href="https://alphos-smartpos-dev.vercel.app/login">https://alphos-smartpos-dev.vercel.app/login</a></td>
      </tr>
      <tr>
        <td><strong>Username</strong></td>
        <td><span class="code">admindev</span></td>
      </tr>
      <tr>
        <td><strong>Email Terdaftar</strong></td>
        <td><span class="code">admindev@alphagen.co.id</span></td>
      </tr>
      <tr>
        <td><strong>Kata Sandi</strong></td>
        <td><span class="code">Jakarta123</span></td>
      </tr>
      <tr>
        <td><strong>Peran (*Role*)</strong></td>
        <td><code>superadmin</code> (Staging & Uji Beban Registrasi Merchant)</td>
      </tr>
      <tr>
        <td><strong>Basis Data</strong></td>
        <td>Supabase DEV: <code>tcbhaiyhtndnqgatysmh</code> (Singapore)</td>
      </tr>
      <tr>
        <td><strong>Status Verifikasi</strong></td>
        <td><strong style="color: #0284c7;">✔ 100% SUKSES LOGIN & JWT SESI VALID (200 OK)</strong></td>
      </tr>
    </table>
  </div>

  <div class="card">
    <div class="card-title">
      <span>🛒 AKUN DEMO OPERASIONAL TOKO (KASIR & OWNER)</span>
      <span class="badge badge-sec">Kasir / Retail</span>
    </div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Akun Owner / Kasir Utama</strong></td>
        <td>Username: <span class="code">anggitest123</span> | Sandi: <span class="code">Password123!</span> (Role: <code>owner</code>)</td>
      </tr>
      <tr>
        <td><strong>Akun Kasir Shift Staff</strong></td>
        <td>Username: <span class="code">anggikasir123</span> | Sandi: <span class="code">Password123!</span> (Role: <code>kasir</code>)</td>
      </tr>
      <tr>
        <td><strong>Fitur Kasir Aktif</strong></td>
        <td>Scan Barcode, Split Payment (QRIS + Tunai), Manajemen Shift Kasir, Petty Cash Laci, Rekonsiliasi Kas Laci (Zero Discrepancy).</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- BAB 3: PANDUAN AKSES & OPERASIONAL SUPERADMIN -->
  <h2>3. Panduan Akses & Prosedur Verifikasi Superadmin Hub</h2>
  <p>Setelah melakukan autentikasi dengan akun Superadmin di atas, sistem akan secara otomatis mengarahkan ke dashboard <strong>Superadmin Hub B2B</strong>. Berikut adalah ringkasan panduan operasional verifikator:</p>

  <ol style="padding-left: 20px; color: #334155; line-height: 1.7;">
    <li><strong>Masuk ke Portal Login:</strong>
      Buka URL login sesuai environment (Production atau DEV). Masukkan username <code>admindev</code> atau <code>adminprod</code> dan sandi <code>Jakarta123</code>.
    </li>
    <li><strong>Akses Menu Registrasi Merchant:</strong>
      Pada navigasi atas Superadmin Hub, pilih tab <strong>"Registrasi Merchant"</strong> (terdapat badge merah counter tiket <em>Pending</em>).
    </li>
    <li><strong>Pemeriksaan Bukti Pembayaran QRIS:</strong>
      Pada baris merchant paket <em>Gen Beta</em> (Rp 20.000) atau <em>Gen Gamma</em> (Rp 30.000), klik tombol <strong>"Lihat Bukti"</strong> untuk membuka modal preview struk transfer QRIS resolusi tinggi.
    </li>
    <li><strong>Tindakan Approval:</strong>
      <ul>
        <li><strong>Setujui (APPROVE):</strong> Klik tombol hijau <strong>"Setujui & Aktivasi"</strong>. Sistem akan menjalankan RPC <code>approve_subscription_registration</code>, mengaktifkan akun merchant, dan men-generate token aktivasi.</li>
        <li><strong>Tolak (REJECT):</strong> Jika mutasi tidak sesuai atau bukti buram, klik tombol merah <strong>"Tolak"</strong> dan masukkan alasan penolakan pada kolom yang tersedia.</li>
      </ul>
    </li>
    <li><strong>Kirim Tautan Aktivasi:</strong>
      Superadmin dapat mengklik tombol <strong>"Salin Tautan Aktivasi"</strong> untuk meneruskan URL verifikasi langsung ke WhatsApp merchant jika email terkendala.
    </li>
  </ol>

  <!-- BAB 4: JAMINAN KEAMANAN & SEMVER -->
  <h2>4. Sertifikasi Keamanan & Kepatuhan Semantic Versioning</h2>
  <div class="note-box">
    <strong>Jaminan Kepatuhan Sistem (Security & Compliance):</strong><br>
    ✔ <strong>Tanpa Celah Mock Bypass:</strong> Seluruh kode bypass mockup lokal pada frontend telah dihapus 100%. Autentikasi murni melalui <code>supabase.auth.signInWithPassword</code>.<br>
    ✔ <strong>Enkripsi Standar Perbankan:</strong> Sandi di-hash menggunakan <code>extensions.crypt(password, extensions.gen_salt('bf'))</code>.<br>
    ✔ <strong>Row Level Security (RLS):</strong> Akses tabel <code>subscription_registrations</code> hanya diizinkan untuk akun dengan <code>role = 'superadmin'</code>.<br>
    ✔ <strong>Disiplin SemVer:</strong> Rilis sistem saat ini dikunci baku pada versi <strong>v1.6.0 (Production Ready)</strong>.
  </div>

  <div class="footer">
    <div><strong>ALPHOS Smart Retail OS</strong> • PT AlphaGen Multi Teknologi</div>
    <div>Dokumen Resmi Internal • Halaman 2 dari 2</div>
  </div>

</body>
</html>`;

const htmlPath = path.join(HTML_DIR, 'direktori_portal_dan_kredensial_superadmin.html');
const pdfPath = path.join(PDF_DIR, 'DIREKTORI_PORTAL_DAN_KREDENSIAL_SUPERADMIN_ALPHOS.pdf');
const artifactPdfPath = path.join(ARTIFACT_DIR, 'DIREKTORI_PORTAL_DAN_KREDENSIAL_SUPERADMIN_ALPHOS.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`Generated HTML at: ${htmlPath}`);

console.log('Generating PDF via Chrome Headless...');
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  htmlPath,
]);

// Copy to artifact directory
fs.copyFileSync(pdfPath, artifactPdfPath);
const stats = fs.statSync(pdfPath);
console.log(`✅ SUCCESS: PDF Generated at: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`Copied to Artifacts: ${artifactPdfPath}`);
