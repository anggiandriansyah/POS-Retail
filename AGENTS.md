<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Struktur Organisasi Tim Proyek ALPHOS — PT AlphaGen

Seluruh divisi teknis dan bisnis dipimpin oleh para **Leader Divisi di PT AlphaGen** yang melapor dan berkolaborasi langsung di bawah komando **Team Leader Anggi Andriansyah (Gege)**.

### 👤 Head of Project / Team Leader
- **Nama:** Anggi Andriansyah (Gege)
- **Jabatan:** Team Leader (General Lead)
- **Wewenang:** Pengambil keputusan tertinggi, persetujuan sprint (*sign-off*), arsitektur strategis, dan komando operasional seluruh divisi di PT AlphaGen.

---

### 👥 Dewan Leader Divisi PT AlphaGen (15 Divisi):
1. **Business Lead:** Memimpin analisis kelayakan pasar, kesiapan operasional ritel, dan strategi bisnis ALPHOS.
2. **Product Owner (PO) Lead:** Memimpin manajemen backlog produk, prioritas sprint, dan penjaga *sprint goal*.
3. **System Architect (SA) Lead:** Memimpin desain arsitektur sistem, skalabilitas, dan integrasi antar subsistem.
4. **IT Solution Architect Lead:** Memimpin pemetaan solusi teknologi, pemilihan stack, dan efisiensi infrastruktur solusi.
5. **Frontend (FE) Lead:** Memimpin pengembangan Web Next.js 16, state management, dan implementasi Anti-UI-Slop.
6. **Backend (BE) Lead:** Memimpin logika bisnis serverless, skema RPC, dan keamanan Supabase PostgreSQL.
7. **Cyber Security Lead (Red & Blue Team):** Memimpin audit keamanan ofensif & defensif, proteksi data transaksi, dan sertifikasi kepatuhan POS.
8. **QA Manual Testing Lead:** Memimpin skenario verifikasi fungsional, exploratory testing, dan *user acceptance*.
9. **QA Automation Testing Lead:** Memimpin suite pengujian otomatis (E2E Playwright/test runner) dan CI testing pipeline.
10. **Performance Testing Lead:** Memimpin benchmark kecepatan aplikasi, efisiensi render DOM, dan uji beban database.
11. **Regression Testing Lead:** Memimpin pencegahan *breaking changes*, verifikasi *backward compatibility*, dan integritas rilis.
12. **DevOps Lead:** Memimpin otomatisasi CI/CD, deployment branch (`develop` & `main`), dan kestabilan Vercel/Supabase.
13. **Technical Writing (TW) Lead:** Memimpin dokumentasi teknis, penyusunan PDF resmi A4, user guide, dan dokumen rilis.
14. **UI/UX Design Lead:** Memimpin konsistensi design tokens, hierarki visual, kontras WCAG AA, dan identitas merek Konsep 2.
15. **Marcomm Lead:** Memimpin komunikasi rilis, materi pemasaran produk ritel, dan *release kit*.

---

### 📋 Kebijakan Open Hiring Staff PT AlphaGen (Approved by Team Leader Gege)
- **Total Kuota Approved:** **22 Orang Staff** (18 Divisi Inti + 2 IT Cyber Security + 2 Data Analyst)
- **Syarat Mutlak Kandidat:**
  1. Pengalaman kerja profesional relevan **minimal 2 tahun**.
  2. **Utamakan Skill & Portofolio Nyata** (problem solving, kemampuan teknis mendalam, sertifikasi praktis/bug bounty/SOC, dan kesiapan kolaborasi agile startup).
- **Distribusi Headcount Staff Approved (22 Staff):**
  - **Bisnis:** 1 Staff (Business Analyst)
  - **Product Owner (PO):** 1 Staff (Associate PO)
  - **System Architect (SA):** 1 Staff (Technical System Analyst)
  - **IT Solution Architect:** 1 Staff (Solutions Engineer)
  - **Frontend (FE):** 2 Staff (1 Core POS Logic + 1 UI/Design System)
  - **Backend (BE):** 2 Staff (1 API/RPC Supabase + 1 DB Optimization/Security)
  - **IT Cyber Security:** 2 Staff (1 Red Team Specialist + 1 Blue Team Specialist)
  - **Data Analyst:** 2 Staff (1 Business BI + 1 Retail Analytics)
  - **QA Tester Manual:** 2 Staff (Exploratory & Edge Cases Tester)
  - **QA Tester Automation:** 1 Staff (SDET / Automation Engineer)
  - **Performance Tester:** 1 Staff (Performance & Benchmark Engineer)
  - **Regression Tester:** 1 Staff (Release Verification Specialist)
  - **DevOps:** 1 Staff (Cloud & SRE Engineer)
  - **Technical Writer (TW):** 1 Staff (Technical Documentation Specialist)
  - **UI/UX:** 2 Staff (1 Product UI Designer + 1 UX Researcher)
  - **Marcomm:** 1 Staff (Product Marketing & Content Creator)

---

### 📜 Standar Prosedur Operasional (SOP) Approval Deployment PT AlphaGen (v2.0.0+)
Seluruh perubahan versi dan peluncuran kode wajib melalui tahapan verifikasi dokumen riwayat (Changelog, Versioning, User Guide, Sertifikasi Rilis) dan memperoleh pengesahan formal bertingkat:

#### 1. Gerbang Lingkungan DEV (Push ke `develop` / Supabase DEV):
Wajib disahkan dan disetujui (*Sign-Off*) oleh:
* 👤 **Team Leader:** Anggi Andriansyah (Gege)
* 💻 **Lead Developers:** FE Lead, BE Lead, Mobile Lead
* 🧪 **QA Lead:** QA Automation & Manual Lead
* 🎯 **PO Lead:** Product Owner Lead
* 📊 **Bisnis Lead:** Business Lead

#### 2. Gerbang Lingkungan PRODUCTION (Deploy ke `main` / Supabase PROD):
Wajib disahkan dan disetujui (*Production Sign-Off*) oleh:
* 👤 **Team Leader:** Anggi Andriansyah (Gege)
* ☁️ **DevOps Lead:** DevOps & Infrastructure Lead
* 🛡️ **IT Security Lead:** Cyber Security Lead (Red & Blue Team)
* *(Catatan Integritas: TW Lead wajib memastikan 5 Dokumen Rilis resmi PDF & Dokumen After-Deployment telah terarsip lengkap sebelum merge branch main dieksekusi).*

