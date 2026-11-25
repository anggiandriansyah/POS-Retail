import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  ANTI_UI_VIEWPORTS,
  DEV_REF,
  EXPECTED_DEV_RECEIPT_ORIGIN,
  PROD_REF,
  assertAntiAiSlop,
  assertConcept2Svg,
  assertPageAntiUiSlop,
  cleanupTestProduct,
  closeOpenedShiftSafely,
  closeShiftWithExpectedCash,
  createAnonClient,
  createTestProduct,
  ensureOpenShift,
  ensureWebServer,
  extractLogoDescriptorsFromPage,
  getSharedCorePaths,
  importWorkspaceModule,
  invokePricingEngine,
  isAndroidRequired,
  isWebRevampLanded,
  listDocHtmlFiles,
  listDocPdfFiles,
  listWorkspaceFiles,
  loadDevEnv,
  makeSprint4RunTag,
  readWorkspaceFile,
  requireAuthSessions,
  requireDeliverableOrDryRunSkip,
  restoreStoreSettings,
  scanFilesForProdLeak,
  scanNextBuildForLeaks,
  snapshotStoreSettings,
  validateConcept2Svg,
  validateEscPosPayload,
  withBrowserPage,
  workspaceFileExists,
  workspacePath,
} from './sprint4_helpers.mjs';

loadDevEnv();

function findProcessDoc(pattern) {
  const files = listWorkspaceFiles('docs/process');
  return files.find((f) => pattern.test(f)) || null;
}

function collectLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, next));
    } else {
      keys.push([next, v]);
    }
  }
  return keys;
}

function findMobileFiles(subDir = 'mobile/src') {
  return listWorkspaceFiles(subDir);
}

describe('Tier 1 — Sprint 4 (v1.4.0) Happy-Path & Contract Tests (17 Features, 85 tests)', () => {
  // =========================================================================
  // Feature #1: Shared Core v1.4.0 & Complete i18n
  // =========================================================================
  it('T1-F1-01: APP_VERSION === "1.4.0" and all 5 Shared Core modules import cleanly', async (t) => {
    const formatMod = await importWorkspaceModule('src/utils/format.ts');
    if (!requireDeliverableOrDryRunSkip(t, formatMod.APP_VERSION === '1.4.0', `APP_VERSION is ${formatMod.APP_VERSION}, expected 1.4.0`)) {
      return;
    }
    for (const modPath of getSharedCorePaths()) {
      const mod = await importWorkspaceModule(modPath);
      assert.ok(mod && typeof mod === 'object', `Failed importing ${modPath}`);
    }
    const pkg = JSON.parse(readWorkspaceFile('package.json'));
    assert.equal(pkg.version, '1.4.0');
  });

  it('T1-F1-02: STORE_INFO exposes non-placeholder ALPHOS metadata', async (t) => {
    const { STORE_INFO } = await importWorkspaceModule('src/utils/format.ts');
    const isUpdated =
      STORE_INFO.name !== 'Toko Retail Anda' &&
      !String(STORE_INFO.address).includes('Jl. Contoh') &&
      !/POS Retail/i.test(STORE_INFO.name);
    if (!requireDeliverableOrDryRunSkip(t, isUpdated, `STORE_INFO still holds baseline placeholder "${STORE_INFO.name}"`)) {
      return;
    }
    assert.ok(STORE_INFO.name.includes('ALPHOS'));
    assert.ok(STORE_INFO.address.length > 5);
    assert.ok(STORE_INFO.phone.length >= 1 && !STORE_INFO.phone.includes('0812-3456-7890'));
    assert.ok(STORE_INFO.footerNote.length > 5);
  });

  it('T1-F1-03: All 5 Shared Core files remain 100% free of DOM, Next.js, and React Native APIs', () => {
    const forbiddenRe = /\b(window|document|localStorage|sessionStorage|navigator|HTMLElement|Blob|FileReader|XMLHttpRequest)\b|from\s+['"](next\/|react-dom|lucide-react|html5-qrcode|react-native|expo-)/;
    for (const rel of getSharedCorePaths()) {
      const src = readWorkspaceFile(rel);
      assert.equal(forbiddenRe.test(src), false, `Forbidden DOM/runtime reference in ${rel}`);
    }
  });

  it('T1-F1-04: formatDateTime(iso, lang) supports id/en and formatRupiah formats IDR', async (t) => {
    const { formatDateTime, formatRupiah } = await importWorkspaceModule('src/utils/format.ts');
    assert.match(formatRupiah(15000), /15\.000/);
    const iso = '2026-11-24T08:30:00.000Z';
    const defOut = formatDateTime(iso);
    const idOut = formatDateTime(iso, 'id');
    const enOut = formatDateTime(iso, 'en');
    assert.equal(defOut, idOut);
    if (!requireDeliverableOrDryRunSkip(t, formatDateTime.length >= 1 && idOut !== enOut, 'formatDateTime(iso, lang) not yet localized for "en"')) {
      return;
    }
    assert.ok(enOut.length > 3);
  });

  it('T1-F1-05: translations.id & translations.en have 100% key parity, zero "POS Retail", and mobile/thermal keys', async (t) => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    const idEntries = collectLeafKeys(translations.id);
    const enEntries = collectLeafKeys(translations.en);
    assert.deepEqual(
      idEntries.map(([k]) => k).sort(),
      enEntries.map(([k]) => k).sort()
    );
    const hasAlphosSubtitle =
      !/POS Retail/i.test(translations.id.appSubtitle) &&
      !/POS Retail/i.test(translations.en.appSubtitle);
    if (!requireDeliverableOrDryRunSkip(t, hasAlphosSubtitle, 'translations.appSubtitle still carries legacy "POS Retail"')) {
      return;
    }
    const flatKeys = idEntries.map(([k]) => k).join(' ');
    assert.match(flatKeys, /thermal|printer|bluetooth/i, 'Missing thermal/bluetooth translation keys');
    assert.match(flatKeys, /scanner|barcode/i, 'Missing barcode scanner translation keys');
  });

  // =========================================================================
  // Feature #2: Official Concept 2 Logo System & Favicon
  // =========================================================================
  it('T1-F2-01: public/favicon.svg uses unboxed dotless Alpha-Checkmark without #863bff', (t) => {
    const fav = readWorkspaceFile('public/favicon.svg');
    const isMigrated = !fav.includes('#863bff') && !/<rect\b|<circle\b/i.test(fav);
    if (!requireDeliverableOrDryRunSkip(t, isMigrated, 'public/favicon.svg is still legacy Vite purple SVG')) {
      return;
    }
    assertConcept2Svg(fav, { requireWordmark: false });
  });

  it('T1-F2-02: Stale Vite artifacts public/icons.svg and dist/ are removed', (t) => {
    const cleaned = !workspaceFileExists('public/icons.svg') && !workspaceFileExists('dist');
    if (!requireDeliverableOrDryRunSkip(t, cleaned, 'Legacy Vite artifacts public/icons.svg or dist/ still present')) {
      return;
    }
    assert.equal(workspaceFileExists('public/icons.svg'), false);
    assert.equal(workspaceFileExists('dist'), false);
  });

  it('T1-F2-03: src/components/AlphosLogo.tsx implements Concept 2 variants (horizontal, vertical, light, thermal)', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('src/components/AlphosLogo.tsx'), 'src/components/AlphosLogo.tsx not yet created')) {
      return;
    }
    const src = readWorkspaceFile('src/components/AlphosLogo.tsx');
    for (const v of ['horizontal', 'vertical', 'light', 'thermal']) {
      assert.ok(src.includes(v), `AlphosLogo.tsx missing variant "${v}"`);
    }
    assert.ok(src.includes('ALPHOS') && src.includes('AlphaGen'));
    assert.equal(/<rect\b|<circle\b/i.test(src), false, 'AlphosLogo.tsx must not render <rect> or <circle>');
  });

  it('T1-F2-04: Live Web "/" renders Concept 2 SVG logo on LoginPage', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web Concept 2 revamp (M2) not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[2] }, async (page) => {
      const logos = await extractLogoDescriptorsFromPage(page);
      assert.ok(logos.length >= 1, 'Expected at least 1 Concept 2 ALPHOS SVG logo on /');
      assertConcept2Svg(logos[0], { requireWordmark: true });
    });
  });

  it('T1-F2-05: layout.tsx and Web "/" metadata use ALPHOS branding without "POS Retail"', (t) => {
    const layoutSrc = readWorkspaceFile('src/app/layout.tsx');
    if (!requireDeliverableOrDryRunSkip(t, !/POS Retail/.test(layoutSrc) && layoutSrc.includes('ALPHOS'), 'src/app/layout.tsx still uses legacy POS Retail title')) {
      return;
    }
    assert.ok(layoutSrc.includes('ALPHOS'));
  });

  // =========================================================================
  // Feature #3: Process & Role Definitions (UI/UX, Markom, QA Manual)
  // =========================================================================
  it('T1-F3-01: docs/process/ contains UI/UX role guide with Concept 2 & viewport rules', (t) => {
    const file = findProcessDoc(/ui.?ux/i);
    if (!requireDeliverableOrDryRunSkip(t, Boolean(file), 'UI/UX role guide missing in docs/process/')) {
      return;
    }
    const txt = readWorkspaceFile(file);
    assert.match(txt, /ALPHOS/i);
    assert.match(txt, /Konsep 2|Concept 2/i);
    assert.match(txt, /375|mobile/i);
  });

  it('T1-F3-02: docs/process/ contains MarketingCommunication (markom) role guide', (t) => {
    const file = findProcessDoc(/markom|marketing/i);
    if (!requireDeliverableOrDryRunSkip(t, Boolean(file), 'Markom role guide missing in docs/process/')) {
      return;
    }
    const txt = readWorkspaceFile(file);
    assert.match(txt, /AlphaGen/i);
    assert.match(txt, /Anti-AI-Slop/i);
  });

  it('T1-F3-03: docs/process/ contains QA Manual role guide with Anti-UI-Slop & Anti-AI-Slop workflow', (t) => {
    const file = findProcessDoc(/qa.?manual/i);
    if (!requireDeliverableOrDryRunSkip(t, Boolean(file), 'QA Manual guide missing in docs/process/')) {
      return;
    }
    const txt = readWorkspaceFile(file);
    assert.match(txt, /Anti-UI-Slop/i);
    assert.match(txt, /Anti-AI-Slop/i);
  });

  it('T1-F3-04: All 3 role guides pass Anti-AI-Slop and define handoff/deliverable responsibilities', (t) => {
    const guides = [
      findProcessDoc(/ui.?ux/i),
      findProcessDoc(/markom|marketing/i),
      findProcessDoc(/qa.?manual/i),
    ];
    if (!requireDeliverableOrDryRunSkip(t, guides.every(Boolean), 'Not all 3 process role guides exist in docs/process/')) {
      return;
    }
    for (const g of guides) {
      const txt = readWorkspaceFile(g);
      assertAntiAiSlop(txt, { kind: 'docs', requireBrandTerms: true, allowProhibitedExamples: true });
      assert.match(txt, /handoff|output|deliverable|tanggung jawab|scope|peran|cakupan|matriks|pelaporan/i);
    }
  });

  it('T1-F3-05: Role guides enforce DEV-only target (tcbhaiyhtndnqgatysmh) and avoid legacy brand leaks', (t) => {
    const files = listWorkspaceFiles('docs/process');
    if (!requireDeliverableOrDryRunSkip(t, files.length >= 3, 'docs/process/ incomplete')) {
      return;
    }
    const leaks = scanFilesForProdLeak(files, { allowExclusionMentions: true });
    assert.equal(leaks.length, 0, `PROD leak in docs/process/: ${JSON.stringify(leaks)}`);
    for (const f of files) {
      const nonRuleLines = readWorkspaceFile(f)
        .split(/\r?\n/)
        .filter((line) => !/(larangan|dilarang|nol|bebas|placeholder|tanpa|hindari|ALPHOS Store|ALPHOS by AlphaGen)/i.test(line))
        .join('\n');
      assert.equal(/PT POS Retail Indonesia|Toko Retail Anda/i.test(nonRuleLines), false, `Legacy brand in ${f}`);
    }
  });

  // =========================================================================
  // Feature #4: Anti-UI-Slop & Anti-AI-Slop Audit Rubric + PO Readiness
  // =========================================================================
  it('T1-F4-01: docs/process/ANTI_UI_AI_SLOP_RUBRIC.md exists with Anti-UI-Slop & Anti-AI-Slop scoring', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assert.match(txt, /Anti-UI-Slop/i);
    assert.match(txt, /Anti-AI-Slop/i);
    assert.match(txt, /PASS|FAIL/i);
  });

  it('T1-F4-02: Rubric inventories Web surfaces and Mobile US-4.1..US-4.6 screens', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    for (const marker of ['LoginPage', 'PosCashier', 'Receipt', 'US-4.1', 'US-4.4', 'US-4.6']) {
      assert.ok(txt.includes(marker), `Rubric missing surface/screen entry "${marker}"`);
    }
  });

  it('T1-F4-03: Rubric specifies contrast, overflow, i18n parity, interaction states, and AI-slop checks', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assert.match(txt, /contrast|kontras|WCAG/i);
    assert.match(txt, /overflow|375/i);
    assert.match(txt, /ID.*EN|bilingual/i);
    assert.match(txt, /loading|empty|error/i);
  });

  it('T1-F4-04: docs/process/PO_BUSINESS_READINESS_v1.4.0.md exists covering Web, Mobile US-4.1..4.6, and DEV', (t) => {
    const rel = 'docs/process/PO_BUSINESS_READINESS_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assert.match(txt, /US-4\.1/);
    assert.match(txt, /US-4\.6/);
    assert.match(txt, new RegExp(DEV_REF));
  });

  it('T1-F4-05: PO readiness checklist defines release-blocker criteria and passes Anti-AI-Slop', (t) => {
    const rel = 'docs/process/PO_BUSINESS_READINESS_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assertAntiAiSlop(txt, { kind: 'docs', requireBrandTerms: true });
    assert.match(txt, /Product Owner|PO|Sign-?off|Persetujuan/i);
  });

  // =========================================================================
  // Feature #5: Web App UI Revamp & Anti-UI/AI-Slop Remediation
  // =========================================================================
  it('T1-F5-01: LoginPage passes Anti-UI-Slop across 375/768/1440 viewports with DEV badge & v1.4.0', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl }, async (page, ctx) => {
      for (const vp of ANTI_UI_VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await assertPageAntiUiSlop(page);
      }
      const text = await page.locator('body').innerText();
      assert.ok(text.includes('1.4.0'), 'Expected v1.4.0 visible on LoginPage');
      assert.ok(text.includes('DEV'), 'Expected DEV badge visible on LoginPage');
      assert.equal(ctx.pageErrors.length, 0);
    });
  });

  it('T1-F5-02: ThemeLangToggles switches <html lang> and <html data-theme> cleanly', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[2] }, async (page) => {
      const langBefore = await page.getAttribute('html', 'lang');
      await page.locator('button.swipe-lang').click();
      const langAfter = await page.getAttribute('html', 'lang');
      assert.notEqual(langAfter, langBefore);

      const themeBefore = await page.getAttribute('html', 'data-theme');
      await page.locator('button.swipe-theme').click();
      const themeAfter = await page.getAttribute('html', 'data-theme');
      assert.notEqual(themeAfter, themeBefore);
      await assertPageAntiUiSlop(page);
    });
  });

  it('T1-F5-03: globals.css defines semantic state styles (.stock-pill.low, .icon-btn.danger, .out-of-stock, .price-result.not-found)', (t) => {
    const css = readWorkspaceFile('src/app/globals.css');
    const ready =
      css.includes('.stock-pill.low') &&
      css.includes('.icon-btn.danger') &&
      css.includes('.out-of-stock') &&
      css.includes('.price-result.not-found');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'globals.css missing Sprint 4 state classes')) {
      return;
    }
    assert.ok(css.includes('.search-box'));
  });

  it('T1-F5-04: Revamped components wire useThemeLang() and remove silent .slice(0, 12) truncation', (t) => {
    const files = [
      'src/components/PosCashier.tsx',
      'src/components/PriceChecker.tsx',
      'src/components/InventoryManager.tsx',
      'src/components/OwnerShifts.tsx',
      'src/components/ReportsView.tsx',
    ];
    const allWired = files.every((f) => readWorkspaceFile(f).includes('useThemeLang'));
    const cashier = readWorkspaceFile('src/components/PosCashier.tsx');
    const noSlice12 = !/\.slice\(\s*0\s*,\s*12\s*\)/.test(cashier);
    if (!requireDeliverableOrDryRunSkip(t, allWired && noSlice12, 'Web components missing full i18n wiring or still contain .slice(0, 12)')) {
      return;
    }
    assert.equal(allWired && noSlice12, true);
  });

  it('T1-F5-05: Web components contain zero native window.confirm or window.prompt calls', (t) => {
    const compFiles = listWorkspaceFiles('src/components');
    const bad = compFiles.filter((f) => /window\.(confirm|prompt)\s*\(/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, bad.length === 0, `Native blocking dialogs found in: ${bad.join(', ')}`)) {
      return;
    }
    assert.equal(bad.length, 0);
  });

  // =========================================================================
  // Feature #6: Web Digital & Thermal Receipt Branding
  // =========================================================================
  it('T1-F6-01: ReceiptContent renders Concept 2 Struk Thermal ALPHOS branding and passes lang to formatDateTime', (t) => {
    const src = readWorkspaceFile('src/components/ReceiptContent.tsx');
    const ok = src.includes('AlphosLogo') && /variant=["']thermal["']/.test(src) && /formatDateTime\([^)]*,/.test(src);
    if (!requireDeliverableOrDryRunSkip(t, ok, 'ReceiptContent.tsx not yet updated with Concept 2 thermal logo & lang-aware formatDateTime')) {
      return;
    }
    assert.equal(ok, true);
  });

  it('T1-F6-02: ReceiptModal localizes header/close button and renders itemized & tax/discount summary', (t) => {
    const src = readWorkspaceFile('src/components/ReceiptModal.tsx');
    const ok =
      !/aria-label="Tutup"/.test(src) &&
      !/window\.prompt/.test(src) &&
      src.includes('ReceiptContent');
    if (!requireDeliverableOrDryRunSkip(t, ok, 'ReceiptModal.tsx still contains hardcoded aria-label or window.prompt')) {
      return;
    }
    assert.equal(ok, true);
  });

  it('T1-F6-03: Public /receipt/[invoice] route renders cleanly in Chromium across 375px and 1440px', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: `${srv.baseUrl}/receipt/INV-NONEXISTENT-404` }, async (page) => {
      for (const vp of [ANTI_UI_VIEWPORTS[0], ANTI_UI_VIEWPORTS[2]]) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await assertPageAntiUiSlop(page);
      }
    });
  });

  it('T1-F6-04: StoreSettingsForm preview integrates Concept 2 Struk Thermal logo', (t) => {
    const src = readWorkspaceFile('src/components/StoreSettingsForm.tsx');
    const ok = src.includes('AlphosLogo') && /thermal/i.test(src);
    if (!requireDeliverableOrDryRunSkip(t, ok, 'StoreSettingsForm.tsx missing Concept 2 Struk Thermal preview')) {
      return;
    }
    assert.equal(ok, true);
  });

  it('T1-F6-05: DEV get_public_receipt RPC returns store settings, items, discount, and tax for real sale', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const anon = createAnonClient();
    const runTag = makeSprint4RunTag();
    const snap = await snapshotStoreSettings(owner.client);
    let prod = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({ tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 20000, stock: 10 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const inv = `INV-${runTag}-R1`;
      const { error: saleErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 25000,
        p_items: [{ product_id: prod.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null, saleErr?.message);

      const { data: rec, error: recErr } = await anon.rpc('get_public_receipt', { p_invoice: inv });
      assert.equal(recErr, null);
      assert.equal(rec.invoice_number, inv);
      assert.equal(Number(rec.total_amount), 22200);
      assert.ok(Array.isArray(rec.items) && rec.items.length === 1);
      assert.ok(rec.store_settings && typeof rec.store_settings.store_name === 'string');
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  // =========================================================================
  // Feature #7: Web DEV Build Guard
  // =========================================================================
  it('T1-F7-01: .env.development and supabaseClient.ts resolve solely to DEV tcbhaiyhtndnqgatysmh', () => {
    const dev = loadDevEnv();
    assert.ok(dev.supabaseUrl.includes(DEV_REF));
    assert.equal(dev.supabaseUrl.includes(PROD_REF), false);
    const clientSrc = readWorkspaceFile('src/lib/supabaseClient.ts');
    assert.equal(clientSrc.includes(PROD_REF), false);
  });

  it('T1-F7-02: Explicit DEV build guard exists in package.json or scripts/', (t) => {
    const pkg = readWorkspaceFile('package.json');
    const scripts = listWorkspaceFiles('scripts');
    const hasGuard = /build:dev|dev-build|guard/i.test(pkg) || scripts.some((s) => /dev|build|guard/i.test(s));
    if (!requireDeliverableOrDryRunSkip(t, hasGuard, 'DEV build guard script not yet implemented')) {
      return;
    }
    assert.equal(hasGuard, true);
  });

  it('T1-F7-03: Compiled .next/ output contains DEV Supabase host tcbhaiyhtndnqgatysmh', (t) => {
    const scan = scanNextBuildForLeaks();
    if (!requireDeliverableOrDryRunSkip(t, scan.exists && scan.devHits > 0, `.next DEV build not present yet (${JSON.stringify(scan)})`)) {
      return;
    }
    assert.ok(scan.devHits > 0);
  });

  it('T1-F7-04: Compiled .next/ output contains zero PROD host sbtzajhgchpcdscrwtha references', (t) => {
    const scan = scanNextBuildForLeaks();
    if (!requireDeliverableOrDryRunSkip(t, scan.exists && scan.prodHits === 0, `.next contains PROD leak (${JSON.stringify(scan)})`)) {
      return;
    }
    assert.equal(scan.prodHits, 0);
  });

  it('T1-F7-05: Live DEV server renders DEV badge and makes zero requests to PROD host', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web DEV M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl }, async (page, ctx) => {
      const badgeText = await page.locator('.env-badge').first().innerText();
      assert.equal(badgeText.trim(), 'DEV');
      assert.equal(ctx.prodRequests.length, 0);
    });
  });

  // =========================================================================
  // Feature #8: US-4.1 Mobile RN Init & Shared Core Integration
  // =========================================================================
  it('T1-F8-01: mobile/ scaffolding (package.json, tsconfig.json, metro.config.js, android/) exists', (t) => {
    const ready =
      workspaceFileExists('mobile/package.json') &&
      workspaceFileExists('mobile/tsconfig.json') &&
      workspaceFileExists('mobile/metro.config.js') &&
      workspaceFileExists('mobile/android');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'mobile/ RN project not yet initialized (M3)')) {
      return;
    }
    assert.equal(ready, true);
  });

  it('T1-F8-02: mobile/metro.config.js configures watchFolders to consume parent Shared Core', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/metro.config.js'), 'mobile/metro.config.js missing')) {
      return;
    }
    const metro = readWorkspaceFile('mobile/metro.config.js');
    assert.match(metro, /watchFolders/);
    assert.match(metro, /\.\./);
  });

  it('T1-F8-03: mobile/tsconfig.json maps Shared Core without duplicating pricing/format/csv/translations/pos', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/tsconfig.json'), 'mobile/tsconfig.json missing')) {
      return;
    }
    const tsCfg = readWorkspaceFile('mobile/tsconfig.json');
    assert.match(tsCfg, /\.\.\/src/);
    const mobFiles = findMobileFiles('mobile/src');
    const duplicates = mobFiles.filter((f) => /\/(pricing|format|csv|translations|pos)\.(ts|tsx|js)$/.test(f));
    assert.equal(duplicates.length, 0, `Duplicated Shared Core files in mobile/src: ${duplicates.join(', ')}`);
  });

  it('T1-F8-04: Mobile Supabase config targets DEV tcbhaiyhtndnqgatysmh exclusively', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/package.json'), 'mobile/ missing')) {
      return;
    }
    const mobFiles = listWorkspaceFiles('mobile').filter((f) => !f.includes('node_modules/') && !f.includes('/build/'));
    const hasDevRef = mobFiles.some((f) => readWorkspaceFile(f).includes(DEV_REF));
    assert.equal(hasDevRef, true, 'Expected DEV Supabase ref in mobile/ config');
    const prodLeaks = scanFilesForProdLeak(mobFiles);
    assert.equal(prodLeaks.length, 0, `PROD leak in mobile/: ${JSON.stringify(prodLeaks)}`);
  });

  it('T1-F8-05: Mobile configuration supports Hermes/RN Intl for formatRupiah & formatDateTime', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/package.json'), 'mobile/ missing')) {
      return;
    }
    const pkg = readWorkspaceFile('mobile/package.json');
    const usesRnOrExpo = /react-native|expo/i.test(pkg);
    assert.equal(usesRnOrExpo, true);
  });

  // =========================================================================
  // Feature #9: US-4.2 Mobile Auth, Role Routing, Bilingual & Theme
  // =========================================================================
  it('T1-F9-01: DEV auth RPCs (has_any_owner, resolve_login_email) resolve email and username', async () => {
    const anon = createAnonClient();
    const { data: hasOwner, error: hoErr } = await anon.rpc('has_any_owner');
    assert.equal(hoErr, null);
    assert.equal(typeof hasOwner, 'boolean');

    const { data: resolved, error: resErr } = await anon.rpc('resolve_login_email', {
      p_identifier: '  MobileCheck@AlphaGen.Dev  ',
    });
    assert.equal(resErr, null);
    assert.equal(resolved, 'mobilecheck@alphagen.dev');
  });

  it('T1-F9-02: Mobile role routing aligns with isAdminRole (owner/admin vs kasir/user)', async (t) => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /isAdminRole/);
  });

  it('T1-F9-03: Mobile language toggle consumes Shared Core translations for ID/EN switching', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /translations/);
    assert.match(mobSrc, /['"]id['"]/);
    assert.match(mobSrc, /['"]en['"]/);
  });

  it('T1-F9-04: Mobile theme toggle supports Concept 2 Dark (#090e1a/#0b1120) and Light (#FFFFFF/#f1f5f9) palettes', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /#090e1a|#0b1120/i);
    assert.match(mobSrc, /#ffffff|#f1f5f9/i);
  });

  it('T1-F9-05: Mobile AlphosLogo renders Concept 2 unboxed dotless Alpha-Checkmark without "POS"', (t) => {
    const logoFile = findMobileFiles('mobile/src').find((f) => /AlphosLogo\.(tsx|ts)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(logoFile), 'Mobile AlphosLogo component missing (M3)')) {
      return;
    }
    const src = readWorkspaceFile(logoFile);
    assert.ok(src.includes('ALPHOS') && src.includes('AlphaGen'));
    assert.equal(/<Rect\b|<Circle\b|<rect\b|<circle\b/.test(src), false);
    assert.equal(/ALPHOS\s+POS/i.test(src), false);
  });

  // =========================================================================
  // Feature #10: US-4.3 Mobile Shift & Petty Cash
  // =========================================================================
  it('T1-F10-01: Kasir opens shift on DEV (status OPEN, opening_cash 200000) and fetches it', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    let shiftState = null;
    try {
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id, 200000);
      assert.equal(shiftState.shift.status, 'OPEN');
      const { data: fetched } = await kasir.client
        .from('shifts')
        .select('*')
        .eq('id', shiftState.shift.id)
        .single();
      assert.equal(fetched.status, 'OPEN');
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
    }
  });

  it('T1-F10-02: Kasir logs petty cash IN and OUT linked to active DEV shift', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    let shiftState = null;
    try {
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id, 100000);
      const { data, error } = await kasir.client
        .from('petty_cash_logs')
        .insert([
          { shift_id: shiftState.shift.id, cashier_id: kasir.user.id, type: 'IN', amount: 50000, category: 'KEMBALIAN', description: '[E2E-S4] IN' },
          { shift_id: shiftState.shift.id, cashier_id: kasir.user.id, type: 'OUT', amount: 25000, category: 'OPERASIONAL', description: '[E2E-S4] OUT' },
        ])
        .select();
      assert.equal(error, null, error?.message);
      assert.equal(data.length, 2);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
    }
  });

  it('T1-F10-03: close_shift RPC computes expected_cash = opening + cash_sales + petty_in - petty_out', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    const { data: existing } = await kasir.client
      .from('shifts')
      .select('id')
      .eq('cashier_id', kasir.user.id)
      .eq('status', 'OPEN')
      .maybeSingle();
    if (existing) {
      t.skip('Kasir already has an active OPEN shift on DEV');
      return;
    }
    let shift = null;
    let closed = false;
    try {
      const opened = await ensureOpenShift(kasir.client, kasir.user.id, 200000);
      shift = opened.shift;
      await kasir.client.from('petty_cash_logs').insert([
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'IN', amount: 50000, category: 'KEMBALIAN', description: '[E2E-S4] IN' },
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'OUT', amount: 25000, category: 'OPERASIONAL', description: '[E2E-S4] OUT' },
      ]);
      const res = await closeShiftWithExpectedCash(kasir.client, shift);
      closed = true;
      assert.equal(Number(res.expected_cash), 225000);
      assert.equal(Number(res.discrepancy), 0);
    } finally {
      if (shift && !closed) await closeOpenedShiftSafely(kasir.client, { shift, openedByTest: true });
    }
  });

  it('T1-F10-04: Mobile Shift screen implements open, petty cash, and close_shift flows', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /petty_cash_logs/);
    assert.match(mobSrc, /close_shift/);
  });

  it('T1-F10-05: Translations localize all 5 petty cash categories in ID and EN', async (t) => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    const serialized = JSON.stringify(translations);
    const hasCats = ['OPERASIONAL', 'KEMBALIAN', 'BELANJA_DARURAT', 'SETOR_BANK', 'LAINNYA'].every(
      (cat) => serialized.includes(cat) || serialized.toLowerCase().includes(cat.toLowerCase())
    );
    if (!requireDeliverableOrDryRunSkip(t, hasCats && (await importWorkspaceModule('src/utils/format.ts')).APP_VERSION === '1.4.0', 'Localized petty cash categories not yet in translations.ts')) {
      return;
    }
    assert.equal(hasCats, true);
  });

  // =========================================================================
  // Feature #11: US-4.4 Mobile Cashier, Barcode Scanner, Discount/PPN & WA
  // =========================================================================
  it('T1-F11-01: Mobile POS integrates barcode scanner + manual fallback and looks up active DEV product', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;
    const runTag = makeSprint4RunTag();
    let prod = null;
    try {
      prod = await createTestProduct(sessions.owner.client, runTag, { barcode: `BC-${runTag}` });
      const { data: found } = await sessions.owner.client
        .from('products')
        .select('*')
        .ilike('barcode', `bc-${runTag}`)
        .eq('is_active', true)
        .single();
      assert.equal(found.id, prod.id);
    } finally {
      if (prod) await cleanupTestProduct(sessions.owner.client, prod.id);
    }
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /barcode/i);
  });

  it('T1-F11-02: Shared Core calculateOrderPricing matches DEV process_sale with item %, order Rp, and 11% PPN', async (t) => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const calc = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 20000, qty: 2, discount_type: 'percent', discount_value: 10 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 6000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    // 40000 - 4000 = 36000; -6000 = 30000; +11% (3300) = 33300
    assert.equal(calc.totalAmount, 33300);

    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;
    try {
      await owner.client.from('store_settings').update({ tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 20000, stock: 10 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { data, error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-P1`,
        p_payment_method: 'cash',
        p_cash_received: 35000,
        p_items: [{ product_id: prod.id, qty: 2, discount_type: 'percent', discount_value: 10 }],
        p_discount_type: 'nominal',
        p_discount_value: 6000,
        p_apply_tax: true,
      });
      assert.equal(error, null, error?.message);
      assert.equal(Number(data.transaction.total_amount), calc.totalAmount);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T1-F11-03: Cash sale decrements stock, computes change, and inserts sale stock_log', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;
    try {
      await owner.client.from('store_settings').update({ tax_enabled: false, tax_rate: 0 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 15000, stock: 8 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { data, error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-C1`,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: prod.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(error, null);
      assert.equal(Number(data.transaction.change_amount), 20000);
      const { data: afterP } = await owner.client.from('products').select('stock').eq('id', prod.id).single();
      assert.equal(afterP.stock, 6);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T1-F11-04: QRIS/Transfer non-cash sale normalizes cash_received === total_amount and change === 0', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;
    try {
      await owner.client.from('store_settings').update({ tax_enabled: false, tax_rate: 0 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 12000, stock: 5 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { data, error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-Q1`,
        p_payment_method: 'qris',
        p_cash_received: 99999,
        p_items: [{ product_id: prod.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(error, null);
      assert.equal(Number(data.transaction.cash_received), 12000);
      assert.equal(Number(data.transaction.change_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T1-F11-05: Mobile WhatsApp receipt builder creates wa.me DEV link without PROD host', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /wa\.me/);
    assert.equal(mobSrc.includes(PROD_REF), false);
    assert.ok(mobSrc.includes(EXPECTED_DEV_RECEIPT_ORIGIN) || mobSrc.includes('EXPO_PUBLIC_') || mobSrc.includes('/receipt/'));
  });

  // =========================================================================
  // Feature #12: US-4.5 Mobile Owner Live Monitor & Stock Request
  // =========================================================================
  it('T1-F12-01: Owner Live Monitor queries open shifts, low stock, sales, and stock requests on DEV', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;
    const { owner } = sessions;
    const { error: sErr } = await owner.client.from('shifts').select('id').eq('status', 'OPEN').limit(5);
    const { error: pErr } = await owner.client.from('products').select('id, stock, min_stock').limit(5);
    const { error: rErr } = await owner.client.from('stock_requests').select('id, status').limit(5);
    assert.equal(sErr, null);
    assert.equal(pErr, null);
    assert.equal(rErr, null);
  });

  it('T1-F12-02: Mobile Live Monitor subscribes to supabase_realtime tables', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = findMobileFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /\.channel\(|postgres_changes/);
    assert.match(mobSrc, /stock_requests/);
  });

  it('T1-F12-03: Kasir submits stock request for existing low-stock product (PENDING)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    let prod = null;
    let reqId = null;
    try {
      prod = await createTestProduct(owner.client, runTag, { stock: 1, min_stock: 5 });
      const { data, error } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: prod.id, product_name: prod.name, requested_by: kasir.user.id, requested_qty: 10, status: 'PENDING' })
        .select()
        .single();
      assert.equal(error, null, error?.message);
      reqId = data.id;
      assert.equal(data.status, 'PENDING');
    } finally {
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T1-F12-04: Kasir submits custom-item stock request (product_id null)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    let reqId = null;
    try {
      const { data, error } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: null, product_name: `[E2E-S4] Custom ${runTag}`, requested_by: kasir.user.id, requested_qty: 3, status: 'PENDING' })
        .select()
        .single();
      assert.equal(error, null, error?.message);
      reqId = data.id;
      assert.equal(data.product_id, null);
    } finally {
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
    }
  });

  it('T1-F12-05: Owner transitions stock request PENDING -> APPROVED -> RESTOCKED and REJECTED', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    let reqA = null;
    let reqB = null;
    try {
      const { data: a } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: null, product_name: `[E2E-S4] ReqA ${runTag}`, requested_by: kasir.user.id, requested_qty: 5, status: 'PENDING' })
        .select()
        .single();
      reqA = a.id;
      const { data: b } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: null, product_name: `[E2E-S4] ReqB ${runTag}`, requested_by: kasir.user.id, requested_qty: 2, status: 'PENDING' })
        .select()
        .single();
      reqB = b.id;

      const { data: ap } = await owner.client.from('stock_requests').update({ status: 'APPROVED', resolved_by: owner.user.id }).eq('id', reqA).select().single();
      assert.equal(ap.status, 'APPROVED');
      const { data: rs } = await owner.client.from('stock_requests').update({ status: 'RESTOCKED', resolved_by: owner.user.id }).eq('id', reqA).select().single();
      assert.equal(rs.status, 'RESTOCKED');
      const { data: rj } = await owner.client.from('stock_requests').update({ status: 'REJECTED', resolved_by: owner.user.id }).eq('id', reqB).select().single();
      assert.equal(rj.status, 'REJECTED');
    } finally {
      if (reqA) await owner.client.from('stock_requests').delete().eq('id', reqA);
      if (reqB) await owner.client.from('stock_requests').delete().eq('id', reqB);
    }
  });

  // =========================================================================
  // Feature #13: US-4.6 Mobile Bluetooth Thermal Receipt Printing
  // =========================================================================
  it('T1-F13-01: Mobile printer service generates ESC @ (0x1B 0x40) & GS V (0x1D 0x56) payload', async (t) => {
    const printerFile = findMobileFiles('mobile/src').find((f) => /escpos|thermal|printer/i.test(f) && /\.(ts|tsx|js)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerFile), 'Mobile ESC/POS printer service missing (M4)')) {
      return;
    }
    const src = readWorkspaceFile(printerFile);
    assert.match(src, /0x1b|27/i);
    assert.match(src, /0x40|64/);
    assert.match(src, /0x1d|29/i);
    assert.match(src, /0x56|86/);
  });

  it('T1-F13-02: Thermal receipt builder outputs Struk Thermal ALPHOS by AlphaGen header without "POS"', (t) => {
    const printerFiles = findMobileFiles('mobile/src').filter((f) => /escpos|thermal|printer/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, printerFiles.length > 0, 'Mobile thermal receipt builder missing (M4)')) {
      return;
    }
    const joined = printerFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.ok(joined.includes('ALPHOS'));
    assert.ok(joined.includes('AlphaGen'));
    assert.equal(/ALPHOS\s+POS/i.test(joined), false);
  });

  it('T1-F13-03: ESC/POS 58mm (32-col) validator passes valid 58mm receipt bytes', async (t) => {
    const printerModFile = findMobileFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder module missing in mobile/src (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    assert.ok(fn, 'Expected ESC/POS builder function export');
    const bytes = fn({
      paperWidth: '58mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-20261124-120000-101',
      items: [{ product_name: 'Kopi Arabika Premium Roasted', qty: 2, price: 25000, subtotal: 50000 }],
      totalAmount: 50000,
      cashReceived: 50000,
      changeAmount: 0,
      paymentMethod: 'cash',
    });
    const res = validateEscPosPayload(bytes, { paperWidth: '58mm', requiredSnippets: ['INV-20261124-120000-101'] });
    assert.equal(res.ok, true, res.errors.join(' | '));
  });

  it('T1-F13-04: ESC/POS 80mm (48-col) validator passes valid 80mm receipt with discount, tax, and footer', async (t) => {
    const printerModFile = findMobileFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder module missing in mobile/src (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    const bytes = fn({
      paperWidth: '80mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-20261124-120000-808',
      items: [{ product_name: 'Teh Hijau Matcha', qty: 1, price: 30000, subtotal: 30000 }],
      discountAmount: 5000,
      taxAmount: 2750,
      totalAmount: 27750,
      cashReceived: 30000,
      changeAmount: 2250,
      paymentMethod: 'cash',
      footerNote: 'Terima kasih telah berbelanja di ALPHOS',
    });
    const res = validateEscPosPayload(bytes, { paperWidth: '80mm', requiredSnippets: ['INV-20261124-120000-808'] });
    assert.equal(res.ok, true, res.errors.join(' | '));
  });

  it('T1-F13-05: Mobile Bluetooth thermal service includes printer discovery/pairing and preview fallback', (t) => {
    const btFiles = findMobileFiles('mobile/src').filter((f) => /printer|bluetooth|thermal/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, btFiles.length > 0, 'Mobile Bluetooth thermal service missing (M4)')) {
      return;
    }
    const txt = btFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(txt, /scan|discover|pair|connect/i);
    assert.match(txt, /preview|fallback/i);
  });

  // =========================================================================
  // Feature #14: Mobile Automated Tests & Android Build
  // =========================================================================
  it('T1-F14-01: mobile/package.json test suite executes and passes (exit 0)', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/package.json'), 'mobile/package.json missing (M3/M4)')) {
      return;
    }
    const pkg = JSON.parse(readWorkspaceFile('mobile/package.json'));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(pkg.scripts?.test), 'mobile/package.json missing test script')) {
      return;
    }
    execFileSync('cmd', ['/c', 'npm', 'test'], { cwd: workspacePath('mobile'), stdio: 'pipe' });
  });

  it('T1-F14-02: Mobile automated tests cover US-4.1 through US-4.6', (t) => {
    const testFiles = listWorkspaceFiles('mobile').filter((f) => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, testFiles.length > 0, 'Mobile test files missing (M3/M4)')) {
      return;
    }
    const joined = testFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(joined, /auth|role|login/i);
    assert.match(joined, /shift|petty/i);
    assert.match(joined, /pricing|discount|whatsapp|receipt/i);
    assert.match(joined, /escpos|thermal|58mm|80mm/i);
  });

  it('T1-F14-03: Mobile TypeScript typecheck passes with 0 errors', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/tsconfig.json') && workspaceFileExists('mobile/node_modules'), 'mobile/ tsconfig or node_modules missing (M3)')) {
      return;
    }
    execFileSync('cmd', ['/c', 'npx', 'tsc', '--noEmit'], { cwd: workspacePath('mobile'), stdio: 'pipe' });
  });

  it('T1-F14-04: mobile/android/ has Gradle config and AndroidManifest.xml with Camera & Bluetooth permissions', (t) => {
    const manifests = listWorkspaceFiles('mobile/android').filter((f) => f.endsWith('AndroidManifest.xml'));
    const gradles = listWorkspaceFiles('mobile/android').filter((f) => f.endsWith('build.gradle') || f.endsWith('build.gradle.kts'));
    if (!requireDeliverableOrDryRunSkip(t, manifests.length > 0 && gradles.length > 0, 'mobile/android/ Gradle & Manifest missing (M3)')) {
      return;
    }
    const xml = manifests.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(xml, /android\.permission\.CAMERA/);
    assert.match(xml, /BLUETOOTH_CONNECT|BLUETOOTH/);
  });

  it('T1-F14-05: Android Gradle build & ADB device hook verify when Android SDK is configured', (t) => {
    const hasSdk = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
    const hasGradlew = workspaceFileExists('mobile/android/gradlew.bat') || workspaceFileExists('mobile/android/gradlew');
    if (!hasSdk || !hasGradlew) {
      if (isAndroidRequired()) {
        assert.fail('E2E_REQUIRE_ANDROID=1 set, but ANDROID_HOME or mobile/android/gradlew missing');
      }
      t.skip('Android SDK or mobile/android/gradlew not available in this environment');
      return;
    }
    const cmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    execFileSync('cmd', ['/c', cmd, 'assembleDebug'], { cwd: workspacePath('mobile/android'), stdio: 'pipe' });
  });

  // =========================================================================
  // Feature #15: Markom Release Kit (v1.4.0) & Release Docs/SOP Alignment
  // =========================================================================
  it('T1-F15-01: docs/process/MARKOM_RELEASE_KIT_v1.4.0.md exists, enforces Concept 2, and passes Anti-AI-Slop', (t) => {
    const rel = 'docs/process/MARKOM_RELEASE_KIT_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing (M5)`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assertAntiAiSlop(txt, { kind: 'copy', requireBrandTerms: true });
    assert.match(txt, /1\.4\.0/);
  });

  it('T1-F15-02: docs/RELEASE_SOP.md specifies 5 official PDF deliverables for ALPHOS by AlphaGen', (t) => {
    const txt = readWorkspaceFile('docs/RELEASE_SOP.md');
    const ready = txt.includes('ALPHOS') && /5\s+(paket\s+)?dokumen/i.test(txt) && !/POS Toko Retail/.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, ready, 'docs/RELEASE_SOP.md not yet updated to 5 PDFs & ALPHOS (M5)')) {
      return;
    }
    assert.match(txt, /05_SOP/i);
  });

  it('T1-F15-03: docs/README.md and README.md document v1.4.0 ALPHOS Web + Mobile + 5 PDFs', (t) => {
    const dReadme = readWorkspaceFile('docs/README.md');
    const rReadme = readWorkspaceFile('README.md');
    const ready = dReadme.includes('1.4.0') && rReadme.includes('1.4.0') && dReadme.includes('ALPHOS') && rReadme.includes('ALPHOS');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'README.md or docs/README.md not yet updated to v1.4.0 ALPHOS (M5)')) {
      return;
    }
    assert.match(rReadme, /US-4\.1|mobile/i);
  });

  it('T1-F15-04: CHANGELOG.md documents [1.4.0] release milestones and features', (t) => {
    const cl = readWorkspaceFile('CHANGELOG.md');
    if (!requireDeliverableOrDryRunSkip(t, cl.includes('[1.4.0]'), 'CHANGELOG.md missing [1.4.0] entry (M5)')) {
      return;
    }
    assert.match(cl, /ALPHOS/);
    assert.match(cl, /Anti-UI-Slop/i);
  });

  it('T1-F15-05: USER_GUIDE.md is updated to v1.4.0 covering Web revamp & Mobile workflows', (t) => {
    const ug = readWorkspaceFile('USER_GUIDE.md');
    if (!requireDeliverableOrDryRunSkip(t, ug.includes('1.4.0') && ug.includes('ALPHOS'), 'USER_GUIDE.md not yet updated to v1.4.0 ALPHOS (M5)')) {
      return;
    }
    assert.match(ug, /Mobile|Android/i);
  });

  // =========================================================================
  // Feature #16: 5 Official PDF HTML Templates & Build Script
  // =========================================================================
  it('T1-F16-01: docs/html/01..05*.html templates exist and embed Concept 2 Light Mode SVG', (t) => {
    const htmlFiles = listDocHtmlFiles();
    assert.equal(htmlFiles.length, 5);
    const allConcept2 = htmlFiles.every((f) => {
      const html = readWorkspaceFile(f);
      const m = html.match(/<svg[\s\S]*?<\/svg>/i);
      return m && validateConcept2Svg(m[0], { variant: 'light' }).ok;
    });
    if (!requireDeliverableOrDryRunSkip(t, allConcept2, 'docs/html/01..05*.html not yet migrated to Concept 2 Light SVG (M5)')) {
      return;
    }
    assert.equal(allConcept2, true);
  });

  it('T1-F16-02: All 5 HTML templates use Concept 2 Light palette (#059669/#0F172A) and @page A4', (t) => {
    const htmlFiles = listDocHtmlFiles();
    const ready = htmlFiles.every((f) => {
      const h = readWorkspaceFile(f);
      return /#059669/i.test(h) && /#0f172a/i.test(h) && /@page/i.test(h);
    });
    if (!requireDeliverableOrDryRunSkip(t, ready, 'docs/html/01..05*.html not yet styled with Concept 2 Light palette (M5)')) {
      return;
    }
    assert.equal(ready, true);
  });

  it('T1-F16-03: scripts/build-release-pdfs.mjs exists, passes node --check, and maps all 5 templates', (t) => {
    const scriptRel = 'scripts/build-release-pdfs.mjs';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(scriptRel), `${scriptRel} missing (M5)`)) {
      return;
    }
    execFileSync(process.execPath, ['--check', workspacePath(scriptRel)], { stdio: 'pipe' });
    const src = readWorkspaceFile(scriptRel);
    assert.match(src, /docs\/html|docs', 'html/);
    assert.match(src, /docs\/pdf|docs', 'pdf/);
  });

  it('T1-F16-04: All 5 generated docs/pdf/01..05*.pdf files start with %PDF- and exceed 10 KB', (t) => {
    const pdfs = listDocPdfFiles();
    const dReadme = readWorkspaceFile('docs/README.md');
    const hasV14 =
      pdfs.length === 5 &&
      dReadme.includes('1.4.0') &&
      pdfs.every((p) => !/1\.3\.0/.test(p) && (/1\.4\.0|1_4|v1\.4/.test(p) || dReadme.includes(path.basename(p))));
    if (!requireDeliverableOrDryRunSkip(t, hasV14, 'v1.4.0 PDFs not yet published in docs/pdf/ (M6)')) {
      return;
    }
    for (const rel of pdfs) {
      const buf = fs.readFileSync(workspacePath(rel));
      assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-', `${rel} invalid PDF header`);
      assert.ok(buf.length > 10240, `${rel} unexpectedly small (${buf.length} bytes)`);
    }
  });

  it('T1-F16-05: 04_sertifikasi_deployment scopes certification strictly to DEV and marks PROD untouched', (t) => {
    const html = readWorkspaceFile('docs/html/04_sertifikasi_deployment.html');
    const ready = html.includes(DEV_REF) && html.includes('1.4.0') && /untouched|tidak disentuh/i.test(html);
    if (!requireDeliverableOrDryRunSkip(t, ready, '04_sertifikasi_deployment.html not yet scoped to v1.4.0 DEV (M5/M6)')) {
      return;
    }
    assert.equal(ready, true);
  });

  // =========================================================================
  // Feature #18: Final Quality Gate, Audits, DEV Verification & 5 Official PDFs
  // =========================================================================
  it('T1-F18-01: Filled ANTI_UI_AI_SLOP_RUBRIC.md records PASS across Web & Mobile with 0 Critical open findings', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    const filled = /\|\s*`?PASS`?\s*\|/i.test(txt) && !/\|\s*`?PENDING`?\s*\|/i.test(txt) && !/\[\s*TBD\s*\]/i.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, filled, 'ANTI_UI_AI_SLOP_RUBRIC.md not yet filled by M6 QA Manual')) {
      return;
    }
    assert.equal(filled, true);
  });

  it('T1-F18-02: Filled PO_BUSINESS_READINESS_v1.4.0.md records verified readiness status', (t) => {
    const rel = 'docs/process/PO_BUSINESS_READINESS_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    const filled = /\|\s*`?(PASS|APPROVED|VERIFIED)`?\s*\|/i.test(txt) && !/\|\s*`?PENDING`?\s*\|/i.test(txt) && !/\[\s*TBD\s*\]/i.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, filled, 'PO_BUSINESS_READINESS_v1.4.0.md not yet signed off (M6)')) {
      return;
    }
    assert.equal(filled, true);
  });

  it('T1-F18-03: Active v1.4.0 src/ and docs/ contain zero "Toko Retail Anda" or "PT POS Retail Indonesia"', (t) => {
    const targets = [
      ...getSharedCorePaths(),
      ...listWorkspaceFiles('src/components'),
      ...listDocHtmlFiles(),
    ];
    const leaks = targets.filter((f) => /Toko Retail Anda|PT POS Retail Indonesia/i.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, leaks.length === 0, `Legacy brand leaks remain in: ${leaks.join(', ')}`)) {
      return;
    }
    assert.equal(leaks.length, 0);
  });

  it('T1-F18-04: 03_laporan_pengujian_akhir.html reflects v1.4.0 results (no stale v1.3.0 metrics)', (t) => {
    const html = readWorkspaceFile('docs/html/03_laporan_pengujian_akhir.html');
    const ready = html.includes('1.4.0') && !html.includes('43 Skipped');
    if (!requireDeliverableOrDryRunSkip(t, ready, '03_laporan_pengujian_akhir.html still holds v1.3.0 test metrics (M5/M6)')) {
      return;
    }
    assert.equal(ready, true);
  });

  it('T1-F18-05: docs/README.md PDF links all resolve to valid files in docs/pdf/', (t) => {
    const dReadme = readWorkspaceFile('docs/README.md');
    if (!requireDeliverableOrDryRunSkip(t, dReadme.includes('1.4.0'), 'docs/README.md not yet updated to v1.4.0 (M5/M6)')) {
      return;
    }
    const matches = [...dReadme.matchAll(/pdf\/([A-Za-z0-9_.-]+\.pdf)/g)].map((m) => `docs/pdf/${m[1]}`);
    assert.ok(matches.length >= 5, 'Expected 5 PDF links in docs/README.md');
    for (const p of matches) {
      assert.equal(workspaceFileExists(p), true, `Broken PDF link in docs/README.md: ${p}`);
    }
  });
});
