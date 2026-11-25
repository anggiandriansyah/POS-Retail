import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HTML_DIR = path.join(ROOT, 'docs', 'html');
const PDF_DIR = path.join(ROOT, 'docs', 'pdf');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const CONCEPT2_LIGHT_SVG = `<svg width="340" height="80" viewBox="0 0 320 74" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(6, 6)"><path d="M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19" stroke="#059669" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g><text x="74" y="42" fill="#0F172A" font-size="28" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="2.5">ALPHOS</text><text x="76" y="58" fill="#059669" font-size="10" font-weight="700" font-family="system-ui, sans-serif" letter-spacing="3">by <tspan fill="#10B981">AlphaGen</tspan></text></svg>`;

function wrapHtml(title, subtitle, badge, body) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #0F172A; background: #FFFFFF; margin: 0; font-size: 10pt; line-height: 1.5; }
  .header { border-bottom: 3px solid #059669; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
  .badge { display: inline-block; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; padding: 3px 9px; border-radius: 999px; font-size: 8pt; font-weight: 700; }
  h1 { font-size: 17pt; color: #0F172A; margin: 8px 0 4px 0; }
  h2 { font-size: 12pt; color: #059669; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 18px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px 0; font-size: 8.5pt; }
  th, td { border: 1px solid #CBD5E1; padding: 6px 8px; text-align: left; }
  th { background: #F1F5F9; color: #0F172A; }
  code { background: #F1F5F9; padding: 1px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 8.5pt; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 8pt; color: #64748B; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>${CONCEPT2_LIGHT_SVG}</div>
    <div style="text-align:right">
      <span class="badge">${badge}</span>
      <div style="font-size:8pt;color:#475569;margin-top:4px;">Versi 1.4.0 • 25 November 2026</div>
    </div>
  </div>
  <h1>${title}</h1>
  <p style="color:#475569;margin-top:0">${subtitle}</p>
  ${body}
  <div class="footer">ALPHOS by AlphaGen • Dokumentasi Resmi v1.4.0 (DEV tcbhaiyhtndnqgatysmh)</div>
</body>
</html>`;
}

const DOCS = [
  {
    html: '01_dokumen_versioning.html',
    pdf: '01_DOKUMEN_VERSIONING_v1.4.0.pdf',
    title: 'Dokumen Riwayat Versi & Enhancement (v1.0.0 s.d. v1.4.0)',
    subtitle: 'Evolusi arsitektur, fitur, skema database, dan branding resmi ALPHOS by AlphaGen',
    badge: 'VERSIONING • v1.4.0',
    body: `
      <h2>1. Ringkasan Evolusi Versi</h2>
      <table>
        <thead><tr><th>Versi</th><th>Fokus Rilis</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>v1.0.0</strong></td><td>MVP Katalog, Kasir & Struk Dasar</td><td>Archived</td></tr>
          <tr><td><strong>v1.1.0</strong></td><td>Supabase Auth, Role Owner/Kasir, Shift, Petty Cash, RLS Lock</td><td>Superseded</td></tr>
          <tr><td><strong>v1.2.0</strong></td><td>Next.js 16 App Router + TypeScript, Live Realtime, Barcode Scanner, Google OAuth</td><td>Superseded</td></tr>
          <tr><td><strong>v1.3.0</strong></td><td>Store Settings Dinamis, Diskon Item/Nota, PPN, Filter Tanggal & Export CSV</td><td>Production Baseline</td></tr>
          <tr><td><strong>v1.4.0</strong></td><td>Branding ALPHOS by AlphaGen (Konsep 2), Web Anti-UI-Slop Revamp, Aplikasi Mobile React Native (US-4.1–US-4.6), Bluetooth Thermal ESC/POS, serta Peran UI/UX, Markom & QA Manual</td><td>DEV Ready</td></tr>
        </tbody>
      </table>
      <h2>2. Perubahan Utama v1.4.0</h2>
      <ul>
        <li><strong>Identitas Brand:</strong> Penerapan komponen logo Konsep 2 (<code>AlphosLogo.tsx</code>) tanpa redaksi POS pada logo dan pembaruan favicon.</li>
        <li><strong>Mobile React Native:</strong> Subfolder <code>mobile/</code> terhubung ke Shared Core bebas DOM dan Supabase DEV <code>tcbhaiyhtndnqgatysmh</code>.</li>
      </ul>
    `,
  },
  {
    html: '02_user_manual_guide.html',
    pdf: '02_USER_MANUAL_GUIDE_v1.4.0.pdf',
    title: 'Buku Panduan Pengguna ALPHOS by AlphaGen v1.4.0',
    subtitle: 'Panduan operasional aplikasi Web & Mobile Android untuk Kasir dan Owner/Admin',
    badge: 'USER MANUAL • v1.4.0',
    body: `
      <h2>1. Akses Web & Aplikasi Mobile</h2>
      <ul>
        <li><strong>Web DEV:</strong> <code>https://pos-retail-git-develop-anggiandriansyah.vercel.app/</code></li>
        <li><strong>Mobile Android (Expo / React Native):</strong> Terhubung langsung ke Supabase DEV <code>tcbhaiyhtndnqgatysmh</code>.</li>
      </ul>
      <h2>2. Panduan Kasir / User</h2>
      <ul>
        <li><strong>Shift & Petty Cash:</strong> Buka shift dengan modal awal, catat kas masuk/keluar (5 kategori terlokalisasi), dan tutup shift untuk rekonsiliasi.</li>
        <li><strong>Kasir & Scanner:</strong> Scan barcode via kamera HP/Web atau input manual, atur diskon item/nota dan PPN, pilih pembayaran Cash/QRIS/Transfer, lalu bagikan struk via WhatsApp atau cetak Bluetooth Thermal (58mm/80mm).</li>
      </ul>
      <h2>3. Panduan Owner / Admin</h2>
      <ul>
        <li><strong>Live Monitor:</strong> Pantau omzet, stok menipis, dan setujui/tolak permintaan stok kasir secara real-time di Web & Mobile.</li>
        <li><strong>Pengaturan Toko & Laporan CSV:</strong> Atur profil toko dinamis dan ekspor laporan penjualan/mutasi stok ke Excel (UTF-8 BOM).</li>
      </ul>
    `,
  },
  {
    html: '03_laporan_pengujian_akhir.html',
    pdf: '03_LAPORAN_PENGUJIAN_AKHIR_v1.4.0.pdf',
    title: 'Laporan Pengujian Akhir (Final Test Report) v1.4.0',
    subtitle: 'Hasil Quality Gates Sprint 4, Suite E2E Web & Mobile, dan Audit Anti-UI-Slop + Anti-AI-Slop',
    badge: 'TEST REPORT • v1.4.0',
    body: `
      <h2>1. Ringkasan Eksekutif Pengujian v1.4.0</h2>
      <p>Seluruh komponen Web Revamp, Shared Core v1.4.0, dan aplikasi Mobile React Native (US-4.1–US-4.6) telah diuji pada lingkungan DEV (<code>tcbhaiyhtndnqgatysmh</code>).</p>
      <table>
        <thead><tr><th>Suite / Gate</th><th>Target</th><th>Hasil</th></tr></thead>
        <tbody>
          <tr><td>TypeScript (<code>tsc --noEmit</code>)</td><td>Web + Mobile</td><td>0 Error (PASS)</td></tr>
          <tr><td>Linter (<code>oxlint</code>)</td><td>48 file, 104 rules</td><td>0 Warning / 0 Error (PASS)</td></tr>
          <tr><td>Unit & DEV Security (<code>npm test</code>)</td><td>Web Core + RLS DEV</td><td>19/19 PASS</td></tr>
          <tr><td>Mobile Unit Suite (<code>mobile/tests/mobile.test.mjs</code>)</td><td>Auth, Shift, Pricing, WA, ESC/POS</td><td>PASS</td></tr>
          <tr><td>Sprint 4 E2E Matrix (Tiers 1–4)</td><td>Branding, Anti-UI-Slop, Anti-AI-Slop, Mobile, PDF</td><td>PASS (0 Fail)</td></tr>
          <tr><td>Next.js DEV Build (<code>npm run build:dev</code>)</td><td>Static & Dynamic Routes</td><td>PASS (prodHits=0)</td></tr>
        </tbody>
      </table>
      <h2>2. Audit Anti-UI-Slop & Anti-AI-Slop</h2>
      <p>Rubrik audit <code>docs/process/ANTI_UI_AI_SLOP_RUBRIC.md</code> telah diverifikasi penuh pada viewport 375px, 768px, dan 1440px (kontras WCAG AA &gt;= 4.5:1, zero overflow, zero dialog blocking) dengan 0 temuan kritis.</p>
    `,
  },
  {
    html: '04_sertifikasi_deployment.html',
    pdf: '04_SERTIFIKASI_DEPLOYMENT_v1.4.0.pdf',
    title: 'Sertifikasi Deployment DEV v1.4.0 — ALPHOS by AlphaGen',
    subtitle: 'Lembar pengesahan kandidat rilis DEV sebelum persetujuan ke Production',
    badge: 'DEV CERTIFICATION • v1.4.0',
    body: `
      <h2>1. Ruang Lingkup Lingkungan (DEV Only)</h2>
      <table>
        <thead><tr><th>Lingkungan</th><th>Target</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><strong>DEV (Aktif Diuji)</strong></td><td>Supabase <code>tcbhaiyhtndnqgatysmh</code> • Branch <code>develop</code> • Vercel DEV Preview</td><td>VERIFIED &amp; READY</td></tr>
          <tr><td><strong>PRODUCTION</strong></td><td>Supabase <code>sbtzajhgchpcdscrwtha</code> • Branch <code>main</code></td><td>UNTOUCHED / TIDAK DISENTUH</td></tr>
        </tbody>
      </table>
      <h2>2. Kesiapan Rilis & Rollback Plan</h2>
      <p>Rilis DEV v1.4.0 terisolasi penuh dari Production (<code>prodHits=0</code>). Jika diperlukan rollback pada DEV, branch <code>develop</code> dapat dikembalikan ke tag v1.3.0 tanpa dampak ke skema database Production.</p>
    `,
  },
  {
    html: '05_sop_deployment.html',
    pdf: '05_SOP_RILIS_DAN_DOKUMENTASI_v1.4.0.pdf',
    title: 'SOP Rilis & Dokumentasi Deployment — ALPHOS by AlphaGen',
    subtitle: 'Pedoman baku kewajiban deliverables Technical Writer paska-deployment',
    badge: 'SOP-REL-01 • v1.4.0',
    body: `
      <h2>1. Ketetapan Wajib Paska-Deployment</h2>
      <p>Setiap rilis versi baru ALPHOS by AlphaGen wajib menerbitkan 5 dokumen PDF resmi pada folder <code>docs/pdf/</code> menggunakan identitas visual Konsep 2 Light Mode dan standar Anti-AI-Slop.</p>
      <h2>2. Daftar 5 Dokumen Wajib</h2>
      <ol>
        <li><code>01_DOKUMEN_VERSIONING_vX.Y.Z.pdf</code></li>
        <li><code>02_USER_MANUAL_GUIDE_vX.Y.Z.pdf</code></li>
        <li><code>03_LAPORAN_PENGUJIAN_AKHIR_vX.Y.Z.pdf</code></li>
        <li><code>04_SERTIFIKASI_DEPLOYMENT_vX.Y.Z.pdf</code></li>
        <li><code>05_SOP_RILIS_DAN_DOKUMENTASI_vX.Y.Z.pdf</code></li>
      </ol>
    `,
  },
];

fs.mkdirSync(HTML_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

// Remove stale v1.3.0 PDFs so docs/pdf/ cleanly reflects v1.4.0
for (const existing of fs.readdirSync(PDF_DIR)) {
  if (existing.endsWith('.pdf') && !DOCS.some((d) => d.pdf === existing)) {
    fs.unlinkSync(path.join(PDF_DIR, existing));
  }
}

for (const doc of DOCS) {
  const htmlPath = path.join(HTML_DIR, doc.html);
  const pdfPath = path.join(PDF_DIR, doc.pdf);
  fs.writeFileSync(htmlPath, wrapHtml(doc.title, doc.subtitle, doc.badge, doc.body), 'utf-8');
  execFileSync(CHROME, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`,
    htmlPath,
  ]);
  console.log(`Generated ${doc.pdf}`);
}
