import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CAPTURES_DIR = path.join(ROOT, 'docs', 'html', 'captures');
const PDF_DIR = path.join(ROOT, 'docs', 'pdf');
const ARTIFACT_DIR = 'C:\\Users\\2419\\.gemini\\antigravity\\brain\\9d4cc955-d500-4965-83aa-23fd054170e1';

fs.mkdirSync(CAPTURES_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

// Read QRIS image as base64
const qrisGammaPath = path.join(ROOT, 'public', 'qris-gen-gamma-30k.jpg');
const qrisBase64 = fs.existsSync(qrisGammaPath)
  ? `data:image/jpeg;base64,${fs.readFileSync(qrisGammaPath).toString('base64')}`
  : '';

const LOGO_SVG = `<svg width="180" height="44" viewBox="0 0 320 74" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(6, 6)"><path d="M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19" stroke="#059669" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g><text x="74" y="42" fill="#0F172A" font-size="28" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="2.5">ALPHOS</text><text x="76" y="58" fill="#059669" font-size="10" font-weight="700" font-family="system-ui, -apple-system, sans-serif" letter-spacing="3">by <tspan fill="#10B981">AlphaGen</tspan></text></svg>`;

const CSS_COMMON = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #0f172a;
    color: #f8fafc;
    font-size: 13px;
    line-height: 1.5;
  }
  .app-shell {
    max-width: 1200px;
    margin: 20px auto;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    background: #0f172a;
    border-bottom: 1px solid #334155;
  }
  .badge-root {
    background: #065f46;
    color: #6ee7b7;
    border: 1px solid #059669;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    margin-left: 10px;
  }
  .superadmin-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px 0;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }
  .tab-btn {
    padding: 10px 18px;
    border-radius: 8px 8px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .tab-btn.active {
    background: #0f172a;
    color: #10b981;
    border: 1px solid #334155;
    border-bottom: 1px solid #0f172a;
  }
  .counter-badge {
    background: #dc2626;
    color: #fff;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    margin-left: 6px;
  }
  .content-area {
    padding: 24px;
    background: #0f172a;
  }
  .filter-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;
  }
  .chips {
    display: flex;
    gap: 8px;
  }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid #334155;
    background: #1e293b;
    color: #94a3b8;
  }
  .chip.active {
    background: #065f46;
    border-color: #10b981;
    color: #6ee7b7;
  }
  .search-box {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 7px 14px;
    color: #f8fafc;
    width: 260px;
    font-size: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #1e293b;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #334155;
  }
  th {
    background: #151e2e;
    color: #94a3b8;
    text-align: left;
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #334155;
  }
  td {
    padding: 13px 14px;
    border-bottom: 1px solid #273549;
    font-size: 12.5px;
  }
  .badge-tier-gamma {
    background: rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.4);
    color: #f87171;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10.5px;
  }
  .badge-tier-beta {
    background: rgba(37, 99, 235, 0.2);
    border: 1px solid rgba(37, 99, 235, 0.4);
    color: #60a5fa;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10.5px;
  }
  .badge-tier-alpha {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10.5px;
  }
  .badge-status-pending {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
  }
  .badge-status-approved {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
  }
  .badge-status-rejected {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
  }
  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    border: none;
    cursor: pointer;
  }
  .btn-approve {
    background: #059669;
    color: #fff;
  }
  .btn-reject {
    background: #dc2626;
    color: #fff;
  }
  .btn-outline {
    background: transparent;
    border: 1px solid #475569;
    color: #cbd5e1;
  }
  .toast-banner {
    background: #064e3b;
    border: 1px solid #10b981;
    color: #a7f3d0;
    padding: 12px 18px;
    border-radius: 8px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
  }
  .email-card {
    background: #151e2e;
    border: 1px solid #334155;
    border-left: 4px solid #10b981;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 18px;
    font-size: 12px;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-box {
    background: #1e293b;
    border: 1px solid #475569;
    border-radius: 14px;
    width: 480px;
    padding: 22px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  }
`;

// 1. View: Antrean Approval Table
const htmlView1 = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS_COMMON}</style></head>
<body>
  <div class="app-shell">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:14px;">
        ${LOGO_SVG}
        <span style="color:#64748b;">|</span>
        <strong style="font-size:14px;">Portal Superadmin Internal</strong>
        <span class="badge-root">ROOT ACCESS</span>
      </div>
      <div style="font-size:12px;color:#94a3b8;">
        Operator: <strong style="color:#f8fafc;">Anggi Andriansyah</strong> • Sesi Terproteksi
      </div>
    </div>

    <div class="superadmin-tabs">
      <button class="tab-btn">🏪 Kelola Toko & Tenant (12)</button>
      <button class="tab-btn active">
        💳 Persetujuan Registrasi & QRIS
        <span class="counter-badge">3 PENDING</span>
      </button>
      <button class="tab-btn">📈 Audit Transaksi Global</button>
    </div>

    <div class="content-area">
      <div class="filter-strip">
        <div class="chips">
          <div class="chip">Semua Permohonan</div>
          <div class="chip active">⏳ Menunggu Verifikasi (3)</div>
          <div class="chip">✓ Sudah Disetujui</div>
          <div class="chip">✕ Ditolak</div>
        </div>
        <input type="text" class="search-box" value="Cari nama toko, nomor HP, email..." readonly />
      </div>

      <table>
        <thead>
          <tr>
            <th>Toko & Pemilik</th>
            <th>Kontak & Kredensial</th>
            <th>Paket SaaS</th>
            <th>Tagihan</th>
            <th>Bukti QRIS</th>
            <th>Status Verifikasi</th>
            <th style="text-align:center;">Tindakan Superadmin</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#1e293b;">
            <td>
              <strong style="font-size:13px;color:#f8fafc;">Toko Berkah Makmur</strong><br/>
              <span style="font-size:11px;color:#94a3b8;">Anggi Andriansyah • <code>REG-20261127-001</code></span>
            </td>
            <td>
              <div>anggi@berkahmakmur.com</div>
              <span style="font-size:11px;color:#94a3b8;">0812-3456-7890 • User: <code>anggitoko</code></span>
            </td>
            <td><span class="badge-tier-gamma">GEN GAMMA</span></td>
            <td><strong style="color:#f8fafc;">Rp 30.000</strong><span style="font-size:11px;color:#94a3b8;"> / bln</span></td>
            <td>
              <button class="btn-action btn-outline" style="border-color:#38bdf8;color:#38bdf8;">
                👁️ Lihat Bukti QRIS
              </button>
            </td>
            <td><span class="badge-status-pending">⏳ Menunggu Approval</span></td>
            <td style="text-align:center;">
              <button class="btn-action btn-approve">✓ Setujui</button>
              <button class="btn-action btn-reject">✕ Tolak</button>
            </td>
          </tr>

          <tr>
            <td>
              <strong style="font-size:13px;color:#f8fafc;">Kios Sinar Jaya</strong><br/>
              <span style="font-size:11px;color:#94a3b8;">Siti Rahmawati • <code>REG-20261127-002</code></span>
            </td>
            <td>
              <div>siti@sinarjaya.id</div>
              <span style="font-size:11px;color:#94a3b8;">0857-9876-5432 • User: <code>sitikasir</code></span>
            </td>
            <td><span class="badge-tier-beta">GEN BETA</span></td>
            <td><strong style="color:#f8fafc;">Rp 20.000</strong><span style="font-size:11px;color:#94a3b8;"> / bln</span></td>
            <td>
              <button class="btn-action btn-outline" style="border-color:#38bdf8;color:#38bdf8;">
                👁️ Lihat Bukti QRIS
              </button>
            </td>
            <td><span class="badge-status-pending">⏳ Menunggu Approval</span></td>
            <td style="text-align:center;">
              <button class="btn-action btn-approve">✓ Setujui</button>
              <button class="btn-action btn-reject">✕ Tolak</button>
            </td>
          </tr>

          <tr>
            <td>
              <strong style="font-size:13px;color:#f8fafc;">Warung Barokah 24 Jam</strong><br/>
              <span style="font-size:11px;color:#94a3b8;">Ahmad Fadillah • <code>REG-20261127-003</code></span>
            </td>
            <td>
              <div>ahmad@warungbarokah.id</div>
              <span style="font-size:11px;color:#94a3b8;">0813-1122-3344 • User: <code>ahmadkasir</code></span>
            </td>
            <td><span class="badge-tier-alpha">GEN ALPHA</span></td>
            <td><strong style="color:#34d399;">Gratis (Rp 0)</strong></td>
            <td><span style="color:#64748b;font-size:11px;">Tanpa Berkas (Free)</span></td>
            <td><span class="badge-status-approved">✓ Aktif Instan</span></td>
            <td style="text-align:center;">
              <button class="btn-action btn-outline" style="font-size:11px;">🔗 Tautan Login</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

// 2. View: Lightbox Modal Pratinjau Bukti QRIS
const htmlView2 = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS_COMMON}</style></head>
<body>
  <div class="app-shell" style="filter:blur(3px);">
    <div class="topbar">${LOGO_SVG}</div>
    <div class="content-area" style="height:550px;"></div>
  </div>

  <div class="modal-overlay">
    <div class="modal-box">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <strong style="font-size:14px;color:#f8fafc;">Pratinjau Bukti Transfer QRIS</strong>
          <span class="badge-tier-gamma">GEN GAMMA • Rp 30.000</span>
        </div>
        <button style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button>
      </div>

      <div style="background:#0f172a;padding:12px;border-radius:10px;border:1px solid #334155;text-align:center;margin-bottom:16px;">
        <img src="${qrisBase64}" style="max-height:280px;border-radius:8px;box-shadow:0 8px 16px rgba(0,0,0,0.5);" alt="Bukti Transfer QRIS Resmi" />
        <div style="margin-top:10px;font-size:11.5px;color:#94a3b8;">
          NMID: <code style="color:#6ee7b7;">ID1026649384090</code> • Merchant: <strong>AlphaGen Ecosystem</strong>
        </div>
      </div>

      <div style="background:#151e2e;padding:10px 14px;border-radius:8px;font-size:11.5px;margin-bottom:16px;border:1px solid #334155;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#94a3b8;">Toko:</span>
          <strong>Toko Berkah Makmur (Anggi Andriansyah)</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#94a3b8;">Waktu Upload:</span>
          <span>27 Nov 2026, 21:45 WIB</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#94a3b8;">Status Mutasi:</span>
          <span style="color:#34d399;font-weight:700;">✓ Rekening Masuk Sesuai Nominal</span>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn-action btn-outline">Tutup Pratinjau</button>
        <button class="btn-action btn-reject">Tolak Pembayaran</button>
        <button class="btn-action btn-approve" style="font-size:12.5px;padding:7px 14px;">✓ Setujui & Terbitkan Token</button>
      </div>
    </div>
  </div>
</body>
</html>`;

// 3. View: Approval Success Toast & Email Dispatch
const htmlView3 = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS_COMMON}</style></head>
<body>
  <div class="app-shell">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:14px;">
        ${LOGO_SVG}
        <span style="color:#64748b;">|</span>
        <strong style="font-size:14px;">Portal Superadmin Internal</strong>
        <span class="badge-root">ROOT ACCESS</span>
      </div>
      <div style="font-size:12px;color:#94a3b8;">Operator: <strong style="color:#f8fafc;">Anggi Andriansyah</strong></div>
    </div>

    <div class="superadmin-tabs">
      <button class="tab-btn">🏪 Kelola Toko & Tenant (12)</button>
      <button class="tab-btn active">💳 Persetujuan Registrasi & QRIS <span class="counter-badge" style="background:#059669;">2 PENDING</span></button>
    </div>

    <div class="content-area">
      <div class="toast-banner">
        <div>
          ✓ <strong>Pendaftaran Toko Berkah Makmur (GEN_GAMMA) Berhasil Disetujui!</strong><br/>
          <span style="font-size:11.5px;font-weight:normal;color:#d1fae5;">
            Token verifikasi diterbitkan dan notifikasi aktivasi dikirim otomatis via PT AlphaGen Info.
          </span>
        </div>
        <span style="background:#059669;padding:4px 8px;border-radius:6px;font-size:11px;">SUKSES DISIMPAN</span>
      </div>

      <div class="email-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <strong style="color:#6ee7b7;font-size:13px;">📧 Log Email Resmi Terkirim (SMTP PT AlphaGen)</strong>
            <div style="color:#94a3b8;font-size:11px;">Pengirim: <code>PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;</code></div>
          </div>
          <span style="background:#064e3b;color:#34d399;border:1px solid #059669;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:700;">TERKIRIM 200 OK</span>
        </div>
        <div style="color:#cbd5e1;line-height:1.6;font-size:12px;background:#0f172a;padding:12px;border-radius:6px;border:1px solid #334155;">
          <strong>Kepada:</strong> Anggi Andriansyah (<code>anggi@berkahmakmur.com</code>)<br/>
          <strong>Subjek:</strong> Pembayaran Terverifikasi: Selamat Datang di ALPHOS (Paket GEN GAMMA)<br/>
          <strong>Token Verifikasi:</strong> <code style="color:#38bdf8;">alphos_act_9f81a72d3e4b</code><br/>
          <strong>Tautan Aktivasi Instan:</strong> <a href="#" style="color:#34d399;">https://alphos-smartpos-dev.vercel.app/verify-account?token=alphos_act_9f81a72d3e4b</a>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Toko & Pemilik</th>
            <th>Paket Layanan</th>
            <th>Status Approval</th>
            <th>Status Verifikasi</th>
            <th style="text-align:center;">Tindakan Superadmin</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#064e3b22;">
            <td>
              <strong style="color:#f8fafc;">Toko Berkah Makmur</strong><br/>
              <span style="font-size:11px;color:#94a3b8;">Anggi Andriansyah • anggi@berkahmakmur.com</span>
            </td>
            <td><span class="badge-tier-gamma">GEN GAMMA</span></td>
            <td><span class="badge-status-approved">✓ Disetujui</span></td>
            <td><span style="color:#34d399;font-weight:700;font-size:11.5px;">✓ Token Terbit (Siap Verifikasi)</span></td>
            <td style="text-align:center;">
              <button class="btn-action btn-outline" style="border-color:#34d399;color:#34d399;">🔗 Buka Tautan Aktivasi</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

// 4. View: Rejection Reason & Audit Status
const htmlView4 = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS_COMMON}</style></head>
<body>
  <div class="app-shell">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:14px;">
        ${LOGO_SVG}
        <span style="color:#64748b;">|</span>
        <strong style="font-size:14px;">Portal Superadmin Internal</strong>
        <span class="badge-root">ROOT ACCESS</span>
      </div>
      <div style="font-size:12px;color:#94a3b8;">Operator: <strong style="color:#f8fafc;">Anggi Andriansyah</strong></div>
    </div>

    <div class="content-area">
      <div style="background:#7f1d1d;border:1px solid #ef4444;color:#fecaca;padding:12px 18px;border-radius:8px;margin-bottom:18px;font-size:13px;font-weight:700;">
        ✕ Pendaftaran Toko Mitra Abadi Telah Ditolak. Alasan tercatat ke audit trail pendaftaran.
      </div>

      <table>
        <thead>
          <tr>
            <th>Toko & Pemilik</th>
            <th>Paket</th>
            <th>Bukti QRIS</th>
            <th>Status</th>
            <th>Catatan Penolakan Superadmin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Toko Mitra Abadi</strong><br/>
              <span style="font-size:11px;color:#94a3b8;">Budi Santoso • budi@mitraabadi.id</span>
            </td>
            <td><span class="badge-tier-beta">GEN BETA</span></td>
            <td><span style="color:#f87171;font-size:11.5px;">Bukti Kurang Jelas</span></td>
            <td><span class="badge-status-rejected">✕ Ditolak</span></td>
            <td style="color:#fca5a5;font-size:11.5px;">
              <em>"Bukti pembayaran QRIS buram/nominal transfer tidak sesuai tarif Rp 20.000. Silakan daftar ulang."</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

// Write HTML capture views
fs.writeFileSync(path.join(CAPTURES_DIR, '01_view_antrean.html'), htmlView1, 'utf-8');
fs.writeFileSync(path.join(CAPTURES_DIR, '02_view_lightbox.html'), htmlView2, 'utf-8');
fs.writeFileSync(path.join(CAPTURES_DIR, '03_view_success.html'), htmlView3, 'utf-8');
fs.writeFileSync(path.join(CAPTURES_DIR, '04_view_rejection.html'), htmlView4, 'utf-8');

console.log('HTML capture views created. Generating screenshots via Chrome Headless...');

const png1 = path.join(CAPTURES_DIR, '01_superadmin_antrean_approval.png');
const png2 = path.join(CAPTURES_DIR, '02_superadmin_pratinjau_qris.png');
const png3 = path.join(CAPTURES_DIR, '03_superadmin_approval_sukses_email.png');
const png4 = path.join(CAPTURES_DIR, '04_superadmin_penolakan_audit.png');

const views = [
  { html: path.join(CAPTURES_DIR, '01_view_antrean.html'), png: png1 },
  { html: path.join(CAPTURES_DIR, '02_view_lightbox.html'), png: png2 },
  { html: path.join(CAPTURES_DIR, '03_view_success.html'), png: png3 },
  { html: path.join(CAPTURES_DIR, '04_view_rejection.html'), png: png4 },
];

for (const v of views) {
  execFileSync(CHROME, [
    '--headless',
    '--disable-gpu',
    '--window-size=1200,680',
    `--screenshot=${v.png}`,
    v.html,
  ]);
  console.log(`Captured: ${path.basename(v.png)}`);
}

// Convert captures to base64 for PDF embedding
const b64_1 = `data:image/png;base64,${fs.readFileSync(png1).toString('base64')}`;
const b64_2 = `data:image/png;base64,${fs.readFileSync(png2).toString('base64')}`;
const b64_3 = `data:image/png;base64,${fs.readFileSync(png3).toString('base64')}`;
const b64_4 = `data:image/png;base64,${fs.readFileSync(png4).toString('base64')}`;

// Build Document Guide HTML
const userGuideHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Panduan Operasional Superadmin — Verifikasi & Persetujuan Registrasi QRIS ALPHOS</title>
<style>
  @page {
    size: A4;
    margin: 16mm 18mm 18mm 18mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 9.8pt;
    line-height: 1.55;
    margin: 0;
  }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #059669;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .doc-title-box {
    margin-bottom: 22px;
  }
  .doc-title {
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 6px 0;
    letter-spacing: -0.02em;
  }
  .doc-subtitle {
    font-size: 10.5pt;
    color: #475569;
    margin: 0 0 12px 0;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 8.5pt;
    margin-bottom: 24px;
    gap: 10px;
  }
  .meta-item strong {
    display: block;
    color: #64748b;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .meta-item span {
    color: #0f172a;
    font-weight: 700;
  }
  h2 {
    font-size: 12.5pt;
    font-weight: 800;
    color: #059669;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin: 22px 0 10px 0;
    page-break-after: avoid;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 800;
    color: #1e293b;
    margin: 14px 0 6px 0;
    page-break-after: avoid;
  }
  p, ul, ol {
    margin: 0 0 10px 0;
  }
  ul, ol {
    padding-left: 20px;
  }
  li {
    margin-bottom: 4px;
  }
  .callout {
    background: #ecfdf5;
    border-left: 4px solid #059669;
    border-radius: 0 8px 8px 0;
    padding: 10px 14px;
    font-size: 9pt;
    color: #065f46;
    margin: 14px 0;
  }
  .callout-warning {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }
  .callout-danger {
    background: #fef2f2;
    border-left: 4px solid #dc2626;
    color: #991b1b;
  }
  .capture-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    margin: 14px 0 18px 0;
    background: #f8fafc;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    page-break-inside: avoid;
  }
  .capture-img {
    width: 100%;
    display: block;
    border-bottom: 1px solid #e2e8f0;
  }
  .capture-caption {
    padding: 7px 12px;
    font-size: 8.5pt;
    color: #475569;
    background: #f1f5f9;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin: 12px 0 16px 0;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
  }
  table.data-table th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }
  code {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 1px 4px;
    border-radius: 4px;
    font-family: Consolas, monospace;
    font-size: 8.5pt;
    color: #0f172a;
  }
  .page-break {
    page-break-before: always;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    margin-top: 24px;
    font-size: 8pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
</head>
<body>

  <!-- Page 1: Cover & Pendahuluan -->
  <div class="doc-header">
    <div>${LOGO_SVG}</div>
    <div style="text-align:right;">
      <span style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;padding:3px 10px;border-radius:999px;font-size:8.5pt;font-weight:800;">SOP-ADM-02 • EDISI RESMI</span>
      <div style="font-size:8pt;color:#64748b;margin-top:4px;">Klasifikasi: Dokumen Operasional Internal</div>
    </div>
  </div>

  <div class="doc-title-box">
    <h1 class="doc-title">Buku Panduan Operasional Superadmin:<br/>Verifikasi & Persetujuan Registrasi QRIS</h1>
    <p class="doc-subtitle">Standar Operasional Prosedur (SOP) audit pembayaran, validasi bukti transfer merchant, aktivasi lisensi SaaS, dan notifikasi email resmi PT AlphaGen Info.</p>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Sistem & Platform</strong>
      <span>ALPHOS Smart Retail OS</span>
    </div>
    <div class="meta-item">
      <strong>Versi Rilis Dokumen</strong>
      <span>v1.5.1 (Sprint 7 SaaS)</span>
    </div>
    <div class="meta-item">
      <strong>Otoritas Pelaksana</strong>
      <span>Superadmin Internal AlphaGen</span>
    </div>
    <div class="meta-item">
      <strong>Service Level Agreement (SLA)</strong>
      <span>Maksimal 15 Menit / Tiket</span>
    </div>
  </div>

  <h2>Bab 1: Gambaran Umum & Alur Registrasi Multi-Tier</h2>
  <p>ALPHOS menyediakan 3 pilihan paket langganan bagi para pelaku usaha ritel di Indonesia. Untuk memastikan integritas pendapatan dan validasi legalitas toko, seluruh permohonan berbayar wajib diverifikasi oleh tim Superadmin sebelum akun kasir dapat diakses:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Paket Layanan</th>
        <th>Biaya Langganan</th>
        <th>Metode Pembayaran</th>
        <th>Mekanisme Verifikasi Superadmin</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>GEN ALPHA</strong></td>
        <td>Gratis (Rp 0 / Selamanya)</td>
        <td>Tanpa Biaya</td>
        <td><strong>Aktivasi Instan Otomatis:</strong> Token terbit langsung tanpa audit bukti transfer manual.</td>
      </tr>
      <tr>
        <td><strong>GEN BETA</strong></td>
        <td>Rp 20.000 / Bulan</td>
        <td>QRIS Resmi AlphaGen</td>
        <td><strong>Audit Manual Superadmin:</strong> Verifikasi bukti transfer senilai Rp 20.000 ke rekening penampung.</td>
      </tr>
      <tr>
        <td><strong>GEN GAMMA</strong></td>
        <td>Rp 30.000 / Bulan</td>
        <td>QRIS Resmi AlphaGen</td>
        <td><strong>Audit Prioritas Superadmin:</strong> Verifikasi bukti transfer senilai Rp 30.000 & pembukaan fitur Enterprise.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout">
    <strong>Tujuan Utama SOP Ini:</strong> Memberikan panduan baku bagi operator internal dalam meninjau bukti transfer QRIS, menghindari kesalahan aktivasi toko, dan memastikan merchant menerima email aktivasi resmi bersertifikat token dalam batas waktu SLA (15 menit).
  </div>

  <h2>Bab 2: Akses Portal Superadmin Internal</h2>
  <ol>
    <li>Superadmin masuk ke portal melalui URL resmi: <code>https://alphos-smartpos-dev.vercel.app/login</code>.</li>
    <li>Masukkan email dan kata sandi akun ber-role <code>superadmin</code> (tercatat di tabel <code>profiles</code> dengan <code>role = 'superadmin'</code>).</li>
    <li>Setelah login berhasil, sistem secara otomatis mengarahkan ke halaman <strong>Portal Superadmin Internal</strong> (komponen <code>SuperadminHub.tsx</code>).</li>
    <li>Pastikan badge <code>ROOT ACCESS</code> aktif pada bilah navigasi atas di samping nama akun Anda.</li>
  </ol>

  <!-- Page 2: Antrean & Lightbox -->
  <div class="page-break"></div>

  <h2>Bab 3: Menavigasi Antrean Permohonan Toko</h2>
  <p>Pada bilah menu navigasi Superadmin Hub, pilih tab <strong>"💳 Persetujuan Registrasi & QRIS"</strong>. Angka indikator merah (*counter badge*) menunjukkan jumlah toko yang sedang menunggu tindakan persetujuan Anda.</p>

  <div class="capture-card">
    <img src="${b64_1}" class="capture-img" alt="Antrean Approval Superadmin" />
    <div class="capture-caption">
      <span>Gambar 1: Halaman Antrean Persetujuan Registrasi & Filter Status Permohonan Toko</span>
      <span>Antarmuka SuperadminHub.tsx</span>
    </div>
  </div>

  <h3>Langkah Kerja Peninjauan Antrean:</h3>
  <ul>
    <li><strong>Filter Status:</strong> Gunakan tombol chip <code>⏳ Menunggu Verifikasi</code> untuk memfokuskan daftar hanya pada permohonan yang membutuhkan tindakan segera.</li>
    <li><strong>Pencarian Data:</strong> Manfaatkan kotak pencarian (*search box*) untuk mencari toko berdasarkan Nama Toko, Nama Lengkap Pemilik, Email, atau Nomor WhatsApp.</li>
    <li><strong>Informasi Baris Tabel:</strong> Setiap baris menampilkan rincian toko, paket SaaS yang dipilih (GEN BETA / GEN GAMMA), nominal yang wajib dibayar, berkas bukti transfer, dan status approval saat ini.</li>
  </ul>

  <h2>Bab 4: Memeriksa Keaslian Bukti Transfer QRIS</h2>
  <p>Sebelum menyetujui pendaftaran, Superadmin wajib memeriksa berkas bukti pembayaran dengan menekan tombol biru <strong>"👁️ Lihat Bukti QRIS"</strong>. Jendela pop-up pratinjau (*Lightbox Modal*) akan muncul menampilkan struk transfer.</p>

  <div class="capture-card">
    <img src="${b64_2}" class="capture-img" alt="Lightbox Modal Pratinjau QRIS" />
    <div class="capture-caption">
      <span>Gambar 2: Jendela Pratinjau Bukti Pembayaran QRIS & Informasi Merchant NMID</span>
      <span>Komponen Lightbox Modal</span>
    </div>
  </div>

  <div class="callout callout-warning">
    <strong>Checklist Verifikasi Wajib (3 Poin Validasi):</strong>
    <ol style="margin:6px 0 0 0;padding-left:18px;">
      <li><strong>NMID & Nama Merchant:</strong> Pastikan transfer ditujukan ke <code>AlphaGen Ecosystem</code> dengan NMID <code>ID1026649384090</code>.</li>
      <li><strong>Kesesuaian Nominal:</strong> Pastikan nominal transfer tepat (Rp 20.000 untuk Gen Beta, atau Rp 30.000 untuk Gen Gamma) tanpa kekurangan.</li>
      <li><strong>Waktu Transaksi:</strong> Pastikan tanggal dan jam struk mutasi wajar (maksimal 1x24 jam sebelum pendaftaran diajukan).</li>
    </ol>
  </div>

  <!-- Page 3: Eksekusi Approval & Rejection -->
  <div class="page-break"></div>

  <h2>Bab 5: Prosedur Persetujuan (Approve) & Penerbitan Token</h2>
  <p>Setelah bukti transfer divalidasi dan dinyatakan absah, Superadmin melakukan persetujuan dengan menekan tombol hijau <strong>"✓ Setujui"</strong> pada baris toko atau pada jendela pratinjau.</p>

  <div class="capture-card">
    <img src="${b64_3}" class="capture-img" alt="Approval Sukses & Log Email" />
    <div class="capture-caption">
      <span>Gambar 3: Notifikasi Keberhasilan Approval dan Log Pengiriman Email Aktivasi Resmi</span>
      <span>Dispatch Otomatis PT AlphaGen Info</span>
    </div>
  </div>

  <h3>Otomasi yang Dijalankan oleh Sistem:</h3>
  <ol>
    <li>Status pendaftaran diubah dari <code>PENDING_APPROVAL</code> menjadi <code>APPROVED</code>.</li>
    <li>Sistem secara otomatis mengenerate <strong>Token Aktivasi Unik</strong> (contoh: <code>alphos_act_9f81a72d3e4b</code>) dengan masa berlaku deterministik.</li>
    <li>Sistem memicu pengiriman email aktivasi resmi atas nama <code>PT AlphaGen Info &lt;no-reply@alphagen.co.id&gt;</code> ke alamat email pemilik toko yang terdaftar.</li>
    <li>Superadmin dapat menekan tombol <strong>"🔗 Tautan"</strong> jika merchant meminta link verifikasi dikirimkan ulang secara langsung via WhatsApp.</li>
  </ol>

  <h2>Bab 6: Prosedur Penolakan (Reject) Pendaftaran</h2>
  <p>Apabila bukti transfer palsu, tidak terbaca, nominal kurang, atau ditujukan ke rekening yang keliru, Superadmin wajib menolak permohonan:</p>

  <div class="capture-card">
    <img src="${b64_4}" class="capture-img" alt="Penolakan Registrasi & Audit Status" />
    <div class="capture-caption">
      <span>Gambar 4: Status Penolakan dan Pencatatan Alasan Transparan pada Audit Trail</span>
      <span>Status Audit Superadmin</span>
    </div>
  </div>

  <ol>
    <li>Tekan tombol merah <strong>"✕ Tolak"</strong> pada baris permohonan yang bermasalah.</li>
    <li>Kotak dialog prompt akan muncul meminta alasan penolakan. Masukkan alasan yang jelas dan sopan, misalnya:
      <br/><code>"Bukti transfer QRIS buram/nominal tidak sesuai tarif paket Rp 30.000. Silakan unggah struk mutasi yang valid."</code>
    </li>
    <li>Status permohonan akan berubah menjadi <code>REJECTED</code> dan alasan tercatat permanen pada riwayat pendaftaran.</li>
  </ol>

  <!-- Page 4: Onboarding & Eskalasi -->
  <div class="page-break"></div>

  <h2>Bab 7: Alur Onboarding Merchant Pasca-Aktivasi</h2>
  <p>Setelah email diterima oleh pemilik toko, berikut adalah alur yang dilalui oleh merchant untuk memulai operasional tokonya:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Tahap</th>
        <th>Aktivitas Merchant</th>
        <th>Hasil Sistem</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Klik Tautan Email</strong></td>
        <td>Merchant membuka tautan <code>/verify-account?token=...</code> dari email aktivasi.</td>
        <td>Sistem memvalidasi tanda tangan token dan paket langganan.</td>
      </tr>
      <tr>
        <td><strong>2. Inisialisasi Akun</strong></td>
        <td>Akun kasir dan tenant toko otomatis terkonfigurasi pada Supabase DEV.</td>
        <td>Status verifikasi toko berubah menjadi <code>Terverifikasi (Active)</code>.</td>
      </tr>
      <tr>
        <td><strong>3. Siap Transaksi</strong></td>
        <td>Merchant langsung login ke POS Kasir dan mulai memindai barcode produk.</td>
        <td>Toko aktif penuh sesuai limit paket (Gen Beta / Gen Gamma).</td>
      </tr>
    </tbody>
  </table>

  <h2>Bab 8: Matriks Eskalasi Masalah & Kontak Tim Teknis</h2>
  <p>Apabila Superadmin mengalami kendala teknis saat melakukan verifikasi pembayaran atau pengiriman email aktivasi, gunakan matriks eskalasi berikut:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Jenis Kendala</th>
        <th>Tindakan Pertama Operator</th>
        <th>Eskalasi Lanjutan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Bukti QRIS Tidak Terbuka</strong></td>
        <td>Periksa koneksi jaringan dan segarkan peramban (Ctrl+F5).</td>
        <td>Hubungi Frontend Lead (Mas Gege) untuk cek storage URL.</td>
      </tr>
      <tr>
        <td><strong>Merchant Mengaku Belum Terima Email</strong></td>
        <td>Gunakan tombol <code>🔗 Tautan</code> di baris tabel, lalu kirim link manual via WA toko.</td>
        <td>Hubungi DevOps / Backend Lead untuk audit log SMTP.</td>
      </tr>
      <tr>
        <td><strong>Selisih Mutasi Bank vs Struk</strong></td>
        <td>Jangan setujui tiket. Tahan status di PENDING_APPROVAL.</td>
        <td>Konfirmasi ke Divisi Keuangan / Finance AlphaGen.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout">
    <strong>Kontak Resmi Tim AlphaGen:</strong><br/>
    • <strong>Email Dukungan:</strong> <code>support@alphagen.co.id</code> / <code>no-reply@alphagen.co.id</code><br/>
    • <strong>Hotline WhatsApp Superadmin:</strong> <code>+62 812-8000-4276</code> (Dukungan Operasional 24 Jam)<br/>
    • <strong>Alamat Kantor:</strong> PT AlphaGen Info Nusantara, Jakarta, Indonesia.
  </div>

  <div class="footer">
    <div><strong>ALPHOS Smart Retail OS</strong> • Dokumentasi Resmi PT AlphaGen Info</div>
    <div>SOP-ADM-02 • Halaman Terakhir</div>
  </div>

</body>
</html>`;

const guideHtmlPath = path.join(ROOT, 'docs', 'html', 'panduan_user_verifikasi_superadmin.html');
const guidePdfPath = path.join(PDF_DIR, 'PANDUAN_USER_VERIFIKASI_REGISTRASI_SUPERADMIN.pdf');
const artifactPdfPath = path.join(ARTIFACT_DIR, 'PANDUAN_USER_VERIFIKASI_REGISTRASI_SUPERADMIN.pdf');

fs.writeFileSync(guideHtmlPath, userGuideHtml, 'utf-8');
console.log('User Guide HTML assembled. Generating final publication-quality PDF via Chrome Headless...');

execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${guidePdfPath}`,
  guideHtmlPath,
]);

// Copy to artifact directory for instant user download
fs.copyFileSync(guidePdfPath, artifactPdfPath);

const stats = fs.statSync(guidePdfPath);
console.log(`SUCCESS: PDF Generated at: ${guidePdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`Copied to Artifacts: ${artifactPdfPath}`);
