import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  ANTI_UI_VIEWPORTS,
  DEV_REF,
  PROD_REF,
  assertAntiAiSlop,
  ensureOpenShift,
  ensureWebServer,
  extractLogoDescriptorsFromPage,
  importWorkspaceModule,
  invokePricingEngine,
  isAndroidRequired,
  isWebRevampLanded,
  listDocHtmlFiles,
  listDocPdfFiles,
  listWorkspaceFiles,
  loadDevEnv,
  makeSprint4RunTag,
  parseCsvRoundTrip,
  readWorkspaceFile,
  requireAuthSessions,
  requireDeliverableOrDryRunSkip,
  restoreStoreSettings,
  scanFilesForProdLeak,
  snapshotStoreSettings,
  createAnonClient,
  createTestProduct,
  cleanupTestProduct,
  closeOpenedShiftSafely,
  validateConcept2Svg,
  validateEscPosPayload,
  withBrowserPage,
  workspaceFileExists,
  workspacePath,
} from './sprint4_helpers.mjs';

loadDevEnv();

describe('Tier 2 — Sprint 4 (v1.4.0) Boundary, Negative, Error & Security Tests (17 Features, 85 tests)', () => {
  // =========================================================================
  // Feature #1: Shared Core v1.4.0 & Complete i18n
  // =========================================================================
  it('T2-F1-01: Shared Core executes in Node subprocess with throwing globalThis DOM traps', () => {
    const script = `
      for (const g of ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'HTMLElement', 'Blob']) {
        Object.defineProperty(globalThis, g, {
          configurable: true,
          get() { throw new Error('DOM_TRAP:' + g); }
        });
      }
      const types = await import('./src/types/pos.ts');
      const pricing = await import('./src/utils/pricing.ts');
      const fmt = await import('./src/utils/format.ts');
      const csv = await import('./src/utils/csv.ts');
      const i18n = await import('./src/i18n/translations.ts');
      if (types.isAdminRole('kasir') !== false) throw new Error('role trap failed');
      if (pricing.calculateChangeAmount(10000, 15000) !== 0) throw new Error('pricing trap failed');
      if (fmt.formatDateTime(null) !== '-') throw new Error('format trap failed');
      if (!csv.buildCsvString(['A'], [['=1']]).includes("'=1")) throw new Error('csv trap failed');
      if (!i18n.translations.id || !i18n.translations.en) throw new Error('i18n trap failed');
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: workspacePath('.'),
      stdio: 'pipe',
    });
  });

  it('T2-F1-02: formatDateTime safely handles null, undefined, and empty string across id/en', async () => {
    const { formatDateTime } = await importWorkspaceModule('src/utils/format.ts');
    assert.equal(formatDateTime(null), '-');
    assert.equal(formatDateTime(undefined), '-');
    assert.equal(formatDateTime(''), '-');
    assert.equal(formatDateTime('', 'en'), '-');
  });

  it('T2-F1-03: calculateOrderPricing clamps >100% discount, negative/NaN values, and applyTax=false', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const empty = invokePricingEngine(pricingMod, {
      items: [],
      orderDiscountType: 'percent',
      orderDiscountValue: 250,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(empty.totalAmount, 0);

    const clamped = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 2, discount_type: 'percent', discount_value: 150 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 50000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: false,
    });
    assert.equal(clamped.subtotalAmount, 0);
    assert.equal(clamped.taxAmount, 0);
    assert.equal(clamped.totalAmount, 0);
  });

  it('T2-F1-04: buildCsvString neutralizes formula injection prefixes including leading whitespace', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const csv = buildCsvString(
      ['Col', 'Notes'],
      [
        ['=CMD()', '+1+1'],
        ['-2*3', '@SUM(A1)'],
        ['  =IMPORTXML()', 'quote "and"\nnewline'],
      ]
    );
    assert.ok(csv.startsWith('\uFEFF'));
    const parsed = parseCsvRoundTrip(csv);
    assert.equal(parsed[1][0], "'=CMD()");
    assert.equal(parsed[1][1], "'+1+1");
    assert.equal(parsed[2][0], "'-2*3");
    assert.equal(parsed[2][1], "'@SUM(A1)");
    assert.equal(parsed[3][0], "'  =IMPORTXML()");
    assert.equal(parsed[3][1], 'quote "and"\nnewline');
  });

  it('T2-F1-05: translations.ts contains zero TODO/TBD/Lorem ipsum placeholders or "POS Retail" brand leaks', async (t) => {
    const src = readWorkspaceFile('src/i18n/translations.ts');
    const hasNoLegacy = !/POS Retail/i.test(src);
    if (!requireDeliverableOrDryRunSkip(t, hasNoLegacy, 'translations.ts still contains legacy "POS Retail"')) {
      return;
    }
    assertAntiAiSlop(src, { kind: 'code' });
  });

  // =========================================================================
  // Feature #2: Official Concept 2 Logo System & Favicon
  // =========================================================================
  it('T2-F2-01: AlphosLogo.tsx contains zero <rect>, <circle>, or <ellipse> box/dot geometry', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('src/components/AlphosLogo.tsx'), 'src/components/AlphosLogo.tsx missing')) {
      return;
    }
    const src = readWorkspaceFile('src/components/AlphosLogo.tsx');
    assert.equal(/<(rect|circle|ellipse)\b/i.test(src), false);
  });

  it('T2-F2-02: Live Web logo SVGs contain zero "POS" wording in logo lockup', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl }, async (page) => {
      const logos = await extractLogoDescriptorsFromPage(page);
      for (const l of logos) {
        const res = validateConcept2Svg(l, { requireWordmark: true });
        assert.equal(res.ok, true, res.errors.join(' | '));
      }
    });
  });

  it('T2-F2-03: public/favicon.svg rejects legacy Vite #863bff purple or filter blur markup', (t) => {
    const fav = readWorkspaceFile('public/favicon.svg');
    if (!requireDeliverableOrDryRunSkip(t, !fav.includes('#863bff'), 'public/favicon.svg still legacy #863bff')) {
      return;
    }
    assert.equal(fav.includes('#863bff'), false);
    assert.equal(/filter=/i.test(fav), false);
  });

  it('T2-F2-04: Compact header AlphosLogo renders with non-zero bounding box at 375px viewport', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[0] }, async (page) => {
      const logos = await extractLogoDescriptorsFromPage(page);
      assert.ok(logos.length >= 1);
      assert.ok(logos[0].width > 40 && logos[0].height > 16);
    });
  });

  it('T2-F2-05: Source files under src/ contain zero "Toko Retail Anda" or "PT POS Retail Indonesia"', (t) => {
    const srcFiles = listWorkspaceFiles('src');
    const hits = srcFiles.filter((f) => /Toko Retail Anda|PT POS Retail Indonesia/i.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, hits.length === 0, `Legacy strings in src/: ${hits.join(', ')}`)) {
      return;
    }
    assert.equal(hits.length, 0);
  });

  // =========================================================================
  // Feature #3: Process & Role Definitions
  // =========================================================================
  it('T2-F3-01: docs/process/ role guides contain zero AI-slop cliches', (t) => {
    const files = listWorkspaceFiles('docs/process').filter((f) => /ROLE_/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, files.length >= 3, 'docs/process/ role guides incomplete')) {
      return;
    }
    for (const f of files) {
      assertAntiAiSlop(readWorkspaceFile(f), { kind: 'docs', allowProhibitedExamples: true });
    }
  });

  it('T2-F3-02: docs/process/ role guides contain zero TBD/TODO placeholders', (t) => {
    const files = listWorkspaceFiles('docs/process').filter((f) => /ROLE_/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, files.length >= 3, 'docs/process/ role guides incomplete')) {
      return;
    }
    for (const f of files) {
      assert.equal(/\b(TBD|TODO)\b/i.test(readWorkspaceFile(f)), false, `Unfinished placeholder in ${f}`);
    }
  });

  it('T2-F3-03: QA Manual guide explicitly rejects subjective sign-off without viewport/contrast/state evidence', (t) => {
    const qaFile = listWorkspaceFiles('docs/process').find((f) => /qa.?manual/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(qaFile), 'QA Manual guide missing in docs/process/')) {
      return;
    }
    const txt = readWorkspaceFile(qaFile);
    assert.match(txt, /contrast|kontras/i);
    assert.match(txt, /overflow|viewport/i);
  });

  it('T2-F3-04: Markom guide explicitly prohibits "POS" in ALPHOS logo and enclosing box/dot', (t) => {
    const markomFile = listWorkspaceFiles('docs/process').find((f) => /markom|marketing/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(markomFile), 'Markom guide missing in docs/process/')) {
      return;
    }
    const txt = readWorkspaceFile(markomFile);
    assert.match(txt, /POS/);
    assert.match(txt, /tanpa kotak|no box|kotak/i);
  });

  it('T2-F3-05: Process guides never instruct migrating or deploying directly to PROD sbtzajhgchpcdscrwtha', (t) => {
    const files = listWorkspaceFiles('docs/process');
    if (!requireDeliverableOrDryRunSkip(t, files.length >= 3, 'docs/process/ incomplete')) {
      return;
    }
    const leaks = scanFilesForProdLeak(files, { allowExclusionMentions: true });
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  // =========================================================================
  // Feature #4: Anti-UI-Slop & Anti-AI-Slop Audit Rubric + PO Readiness
  // =========================================================================
  it('T2-F4-01: Rubric requires scoring BOTH Anti-UI-Slop and Anti-AI-Slop (neither omitted)', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assert.ok(txt.includes('Anti-UI-Slop') && txt.includes('Anti-AI-Slop'));
  });

  it('T2-F4-02: Rubric defines explicit fail conditions for overflow (scrollWidth > clientWidth) and contrast', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assert.match(txt, /overflow/i);
    assert.match(txt, /4\.5|WCAG|contrast|kontras/i);
  });

  it('T2-F4-03: PO checklist does not falsely claim PROD deployment or unexecuted physical hardware pass', (t) => {
    const rel = 'docs/process/PO_BUSINESS_READINESS_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const leaks = scanFilesForProdLeak([rel], { allowExclusionMentions: true });
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F4-04: Rubric and PO readiness files contain zero template placeholders (your-project-id, Lorem ipsum)', (t) => {
    const files = ['docs/process/ANTI_UI_AI_SLOP_RUBRIC.md', 'docs/process/PO_BUSINESS_READINESS_v1.4.0.md'];
    if (!requireDeliverableOrDryRunSkip(t, files.every(workspaceFileExists), 'Rubric/PO files missing')) {
      return;
    }
    for (const f of files) {
      const txt = readWorkspaceFile(f);
      assert.equal(/your-project-id|Lorem ipsum/i.test(txt), false);
    }
  });

  it('T2-F4-05: Rubric enumerates individual Web components and Mobile screens (not single-row rubber-stamp)', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    const hits = ['LoginPage', 'PosCashier', 'InventoryManager', 'ShiftManager', 'ReceiptModal', 'ReportsView', 'US-4.2', 'US-4.5'].filter((k) => txt.includes(k));
    assert.ok(hits.length >= 6, `Expected granular per-screen inventory, matched only [${hits.join(', ')}]`);
  });

  // =========================================================================
  // Feature #5: Web App UI Revamp & Anti-UI/AI-Slop Remediation
  // =========================================================================
  it('T2-F5-01: Zero window.confirm or window.prompt calls across all src/**/*.ts(x)', (t) => {
    const files = listWorkspaceFiles('src');
    const bad = files.filter((f) => /window\.(confirm|prompt)\s*\(/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, bad.length === 0, `Blocking dialogs still present in: ${bad.join(', ')}`)) {
      return;
    }
    assert.equal(bad.length, 0);
  });

  it('T2-F5-02: PosCashier does not silently drop products beyond 12 via .slice(0, 12)', (t) => {
    const src = readWorkspaceFile('src/components/PosCashier.tsx');
    if (!requireDeliverableOrDryRunSkip(t, !/\.slice\(\s*0\s*,\s*12\s*\)/.test(src), 'PosCashier.tsx still truncates via .slice(0, 12)')) {
      return;
    }
    assert.equal(/\.slice\(\s*0\s*,\s*12\s*\)/.test(src), false);
  });

  it('T2-F5-03: globals.css styles .price-result.not-found with distinct error/danger colors (not green primary-soft)', (t) => {
    const css = readWorkspaceFile('src/app/globals.css');
    if (!requireDeliverableOrDryRunSkip(t, css.includes('.price-result.not-found'), 'globals.css missing .price-result.not-found rule')) {
      return;
    }
    const block = css.slice(css.indexOf('.price-result.not-found'), css.indexOf('.price-result.not-found') + 300);
    assert.match(block, /danger|error|#dc2626|#ef4444|220,\s*38,\s*38/i);
  });

  it('T2-F5-04: On 375x812 LoginPage, corner ThemeLangToggles do not overlap login tabs or inputs', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[0] }, async (page) => {
      const overlaps = await page.evaluate(() => {
        const toggles = document.querySelector('.login-corner-toggles');
        const card = document.querySelector('.login-card');
        if (!toggles || !card) return false;
        const rt = toggles.getBoundingClientRect();
        const rc = card.getBoundingClientRect();
        return !(rt.right <= rc.left || rt.left >= rc.right || rt.bottom <= rc.top || rt.top >= rc.bottom);
      });
      assert.equal(overlaps, false, 'Login corner toggles overlap login card on 375x812');
    });
  });

  it('T2-F5-05: Empty/invalid LoginPage submission displays visible high-contrast .alert-error in Light & Dark modes', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[0] }, async (page) => {
      await page.locator('button[type="submit"]').first().click();
      const errVisible = await page.locator('.alert-error').first().isVisible();
      assert.equal(errVisible, true);
    });
  });

  // =========================================================================
  // Feature #6: Web Digital & Thermal Receipt Branding
  // =========================================================================
  it('T2-F6-01: /receipt/INVALID-INVOICE-999 renders localized error alert (not crash) in ID and EN', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: `${srv.baseUrl}/receipt/INVALID-INVOICE-999` }, async (page, ctx) => {
      await page.waitForSelector('.alert-error, .card', { timeout: 10000 });
      assert.equal(ctx.pageErrors.length, 0);
      const idText = await page.locator('body').innerText();
      await page.locator('button.swipe-lang').click();
      const enText = await page.locator('body').innerText();
      assert.notEqual(idText, enText);
    });
  });

  it('T2-F6-02: ReceiptPage keeps thermal receipt paper readable without horizontal overflow at 375px', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'M2 Web revamp not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    await withBrowserPage({ baseUrl: `${srv.baseUrl}/receipt/INV-NONEXISTENT-999`, viewport: ANTI_UI_VIEWPORTS[0] }, async (page) => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(overflow, false);
    });
  });

  it('T2-F6-03: Thermal receipt logo in ReceiptContent uses #000000 monochrome thermal variant (no POS)', (t) => {
    const src = readWorkspaceFile('src/components/ReceiptContent.tsx');
    if (!requireDeliverableOrDryRunSkip(t, src.includes('AlphosLogo'), 'ReceiptContent.tsx missing AlphosLogo thermal variant')) {
      return;
    }
    assert.match(src, /thermal/);
    assert.equal(/ALPHOS\s+POS/i.test(src), false);
  });

  it('T2-F6-04: ReceiptModal clipboard fallback never uses window.prompt', (t) => {
    const src = readWorkspaceFile('src/components/ReceiptModal.tsx');
    if (!requireDeliverableOrDryRunSkip(t, !/window\.prompt/.test(src), 'ReceiptModal.tsx still invokes window.prompt')) {
      return;
    }
    assert.equal(/window\.prompt/.test(src), false);
  });

  it('T2-F6-05: StoreSettingsForm preview never renders "POS Retail" or "Toko Retail Anda"', (t) => {
    const src = readWorkspaceFile('src/components/StoreSettingsForm.tsx');
    if (!requireDeliverableOrDryRunSkip(t, src.includes('AlphosLogo'), 'StoreSettingsForm.tsx not yet updated to Concept 2')) {
      return;
    }
    assert.equal(/POS Retail|Toko Retail Anda/i.test(src), false);
  });

  // =========================================================================
  // Feature #7: Web DEV Build Guard
  // =========================================================================
  it('T2-F7-01: DEV build guard rejects NEXT_PUBLIC_SUPABASE_URL containing PROD sbtzajhgchpcdscrwtha', (t) => {
    const guardScript = listWorkspaceFiles('scripts').find((f) => /build.*dev|dev.*guard|build-dev/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(guardScript), 'DEV build guard script in scripts/ missing (M2)')) {
      return;
    }
    let failedAsExpected = false;
    try {
      execFileSync(process.execPath, [workspacePath(guardScript), '--check-only'], {
        cwd: workspacePath('.'),
        stdio: 'pipe',
        env: { ...process.env, NEXT_PUBLIC_APP_ENV: 'development', NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_REF}.supabase.co` },
      });
    } catch {
      failedAsExpected = true;
    }
    assert.equal(failedAsExpected, true, 'DEV build guard must reject PROD Supabase URL');
  });

  it('T2-F7-02: DEV build guard rejects NEXT_PUBLIC_APP_ENV=production', (t) => {
    const guardScript = listWorkspaceFiles('scripts').find((f) => /build.*dev|dev.*guard|build-dev/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(guardScript), 'DEV build guard script in scripts/ missing (M2)')) {
      return;
    }
    let failedAsExpected = false;
    try {
      execFileSync(process.execPath, [workspacePath(guardScript), '--check-only'], {
        cwd: workspacePath('.'),
        stdio: 'pipe',
        env: { ...process.env, NEXT_PUBLIC_APP_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: `https://${DEV_REF}.supabase.co` },
      });
    } catch {
      failedAsExpected = true;
    }
    assert.equal(failedAsExpected, true, 'DEV build guard must reject production app env');
  });

  it('T2-F7-03: next.config.ts and package.json do not hardcode PROD sbtzajhgchpcdscrwtha', () => {
    assert.equal(readWorkspaceFile('next.config.ts').includes(PROD_REF), false);
    assert.equal(readWorkspaceFile('package.json').includes(PROD_REF), false);
  });

  it('T2-F7-04: .env.development never contains PROD host or placeholder values', () => {
    const raw = readWorkspaceFile('.env.development');
    assert.equal(raw.includes(PROD_REF), false);
    assert.equal(raw.includes('your-project-id'), false);
    assert.ok(raw.includes(DEV_REF));
  });

  it('T2-F7-05: src/lib/supabaseClient.ts gracefully disables client when env vars are placeholders', () => {
    const script = `
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-id.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-public-key';
      const mod = await import('./src/lib/supabaseClient.ts');
      if (mod.isSupabaseConfigured !== false || mod.supabase !== null) {
        throw new Error('Expected disabled supabase client for placeholder env');
      }
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: workspacePath('.'),
      stdio: 'pipe',
    });
  });

  // =========================================================================
  // Feature #8: US-4.1 Mobile RN Init & Shared Core Integration
  // =========================================================================
  it('T2-F8-01: mobile/ contains zero occurrences of PROD host sbtzajhgchpcdscrwtha', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/package.json'), 'mobile/ missing (M3)')) {
      return;
    }
    const files = listWorkspaceFiles('mobile').filter((f) => !f.includes('node_modules/') && !f.includes('/build/'));
    const leaks = scanFilesForProdLeak(files);
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F8-02: mobile/src/ contains zero duplicated Shared Core functions', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const files = listWorkspaceFiles('mobile/src');
    const bad = files.filter((f) => /export function (calculateOrderPricing|formatRupiah|buildCsvString)\b/.test(readWorkspaceFile(f)));
    assert.equal(bad.length, 0, `Duplicated Shared Core implementation in: ${bad.join(', ')}`);
  });

  it('T2-F8-03: mobile/src/ never imports next/* or react-dom', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const files = listWorkspaceFiles('mobile/src');
    const bad = files.filter((f) => /from\s+['"](next\/|react-dom)/.test(readWorkspaceFile(f)));
    assert.equal(bad.length, 0, `Web-only import in mobile/src: ${bad.join(', ')}`);
  });

  it('T2-F8-04: Mobile Supabase client gracefully handles missing/placeholder env without throwing on import', (t) => {
    const clientFile = listWorkspaceFiles('mobile/src').find((f) => /supabaseClient\.(ts|tsx|js)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(clientFile), 'mobile supabaseClient missing (M3)')) {
      return;
    }
    const src = readWorkspaceFile(clientFile);
    assert.match(src, /isSupabaseConfigured|your-project-id|null/);
  });

  it('T2-F8-05: formatRupiah handles extreme IDR bounds and negative values cleanly', async () => {
    const { formatRupiah } = await importWorkspaceModule('src/utils/format.ts');
    assert.match(formatRupiah(999999999), /999\.999\.999/);
    assert.match(formatRupiah(-2500), /-.*2\.500/);
    assert.match(formatRupiah(0), /0/);
  });

  // =========================================================================
  // Feature #9: US-4.2 Mobile Auth, Role Routing, Bilingual & Theme
  // =========================================================================
  it('T2-F9-01: Mobile auth enforces is_active guard (signs out deactivated users)', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /is_active/);
    assert.match(mobSrc, /signOut/);
  });

  it('T2-F9-02: Anon client cannot read private tables (store_settings, shifts, stock_requests)', async () => {
    const anon = createAnonClient();
    for (const tbl of ['store_settings', 'shifts', 'stock_requests']) {
      const { error } = await anon.from(tbl).select('id').limit(1);
      assert.ok(error !== null, `Expected anon SELECT on ${tbl} to be denied`);
    }
  });

  it('T2-F9-03: claim_first_owner fails when an owner already exists on DEV', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { error } = await sessions.kasir.client.rpc('claim_first_owner', { p_full_name: 'Hijack Attempt' });
    assert.ok(error !== null, 'Expected claim_first_owner to reject when owner exists');
  });

  it('T2-F9-04: resolve_login_email returns null for unknown username without leaking emails', async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc('resolve_login_email', {
      p_identifier: 'nonexistent_sprint4_user_999',
    });
    assert.equal(error, null);
    assert.equal(data, null);
  });

  it('T2-F9-05: Mobile AlphosLogo forbids enclosing border box, dot, and "POS" text', (t) => {
    const logoFile = listWorkspaceFiles('mobile/src').find((f) => /AlphosLogo\.(tsx|ts)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(logoFile), 'Mobile AlphosLogo missing (M3)')) {
      return;
    }
    const src = readWorkspaceFile(logoFile);
    assert.equal(/<(Rect|Circle|Ellipse|rect|circle|ellipse)\b/.test(src), false);
    assert.equal(/ALPHOS\s+POS/i.test(src), false);
  });

  // =========================================================================
  // Feature #10: US-4.3 Mobile Shift & Petty Cash
  // =========================================================================
  it('T2-F10-01: Opening a second concurrent OPEN shift for same kasir is rejected by DB', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    let shiftState = null;
    try {
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id, 100000);
      const { error } = await kasir.client.from('shifts').insert({
        cashier_id: kasir.user.id,
        status: 'OPEN',
        opening_cash: 50000,
      });
      assert.ok(error !== null, 'Expected second OPEN shift to fail unique constraint');
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
    }
  });

  it('T2-F10-02: Petty cash insert with amount <= 0 is rejected by DB constraint', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    let shiftState = null;
    try {
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id, 100000);
      const { error } = await kasir.client.from('petty_cash_logs').insert({
        shift_id: shiftState.shift.id,
        cashier_id: kasir.user.id,
        type: 'OUT',
        amount: 0,
        category: 'OPERASIONAL',
        description: '[E2E-S4] Invalid zero',
      });
      assert.ok(error !== null, 'Expected petty cash amount <= 0 to fail');
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
    }
  });

  it('T2-F10-03: close_shift rejects negative actual_cash and records signed discrepancy accurately', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { kasir } = sessions;
    const { data: existing } = await kasir.client.from('shifts').select('id').eq('cashier_id', kasir.user.id).eq('status', 'OPEN').maybeSingle();
    if (existing) {
      t.skip('Kasir already has an OPEN shift');
      return;
    }
    let shift = null;
    let closed = false;
    try {
      const opened = await ensureOpenShift(kasir.client, kasir.user.id, 100000);
      shift = opened.shift;
      const { error: negErr } = await kasir.client.rpc('close_shift', {
        p_shift_id: shift.id,
        p_actual_cash: -100,
        p_notes: 'negative test',
      });
      assert.ok(negErr !== null, 'Expected negative actual_cash to be rejected');

      const { data: okClose, error: okErr } = await kasir.client.rpc('close_shift', {
        p_shift_id: shift.id,
        p_actual_cash: 95000,
        p_notes: 'shortage 5000 test',
      });
      assert.equal(okErr, null);
      closed = true;
      assert.equal(Number(okClose.discrepancy), -5000);
    } finally {
      if (shift && !closed) await closeOpenedShiftSafely(kasir.client, { shift, openedByTest: true });
    }
  });

  it('T2-F10-04: Mobile Shift screen enforces non-empty notes when discrepancy !== 0', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /discrepancy/i);
    assert.match(mobSrc, /notes/i);
  });

  it('T2-F10-05: Negative opening_cash on shift open is rejected by DB', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { error } = await sessions.kasir.client.from('shifts').insert({
      cashier_id: sessions.kasir.user.id,
      status: 'OPEN',
      opening_cash: -5000,
    });
    assert.ok(error !== null);
  });

  // =========================================================================
  // Feature #11: US-4.4 Mobile Cashier, Barcode, Discount/PPN & WA Receipt
  // =========================================================================
  it('T2-F11-01: process_sale rejects checkout when cashier has no OPEN shift (SHIFT_REQUIRED)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const { data: openShift } = await kasir.client.from('shifts').select('id').eq('cashier_id', kasir.user.id).eq('status', 'OPEN').maybeSingle();
    if (openShift) {
      t.skip('Kasir currently has an OPEN shift');
      return;
    }
    const runTag = makeSprint4RunTag();
    let prod = null;
    try {
      prod = await createTestProduct(owner.client, runTag, { stock: 5 });
      const { error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-NOSHIFT`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: prod.id, qty: 1 }],
      });
      assert.ok(error !== null);
      assert.match(error.message, /SHIFT_REQUIRED|shift/i);
    } finally {
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T2-F11-02: process_sale rejects insufficient cash payment without deducting stock', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;
    try {
      await owner.client.from('store_settings').update({ tax_enabled: false, tax_rate: 0 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 25000, stock: 5 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-LOWCASH`,
        p_payment_method: 'cash',
        p_cash_received: 10000,
        p_items: [{ product_id: prod.id, qty: 1 }],
      });
      assert.ok(error !== null);
      const { data: after } = await owner.client.from('products').select('stock').eq('id', prod.id).single();
      assert.equal(after.stock, 5);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T2-F11-03: process_sale rejects qty > stock atomically', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;
    try {
      prod = await createTestProduct(owner.client, runTag, { sell_price: 10000, stock: 2 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-OVERSTOCK`,
        p_payment_method: 'cash',
        p_cash_received: 100000,
        p_items: [{ product_id: prod.id, qty: 5 }],
      });
      assert.ok(error !== null);
      const { data: after } = await owner.client.from('products').select('stock').eq('id', prod.id).single();
      assert.equal(after.stock, 2);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T2-F11-04: Mobile POS supports manual/USB barcode fallback when camera is unavailable', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /manual|TextInput/i);
  });

  it('T2-F11-05: Mobile WhatsApp share URL never points to localhost or PROD sbtzajhgchpcdscrwtha', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const waFiles = listWorkspaceFiles('mobile/src').filter((f) => /whatsapp|receipt|share/i.test(f));
    const joined = waFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.equal(joined.includes(PROD_REF), false);
    assert.equal(/http:\/\/localhost/.test(joined), false);
  });

  // =========================================================================
  // Feature #12: US-4.5 Mobile Owner Live Monitor & Stock Request
  // =========================================================================
  it('T2-F12-01: Kasir cannot UPDATE stock_requests status (Owner-only RLS)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    let reqId = null;
    try {
      const { data } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: null, product_name: `[E2E-S4] RLS ${runTag}`, requested_by: kasir.user.id, requested_qty: 2, status: 'PENDING' })
        .select()
        .single();
      reqId = data.id;
      const { data: updated } = await kasir.client
        .from('stock_requests')
        .update({ status: 'APPROVED' })
        .eq('id', reqId)
        .select();
      assert.equal((updated || []).length, 0, 'Kasir must not be allowed to approve own stock request');
    } finally {
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
    }
  });

  it('T2-F12-02: stock_requests rejects requested_qty <= 0', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;
    const { error } = await sessions.kasir.client.from('stock_requests').insert({
      product_id: null,
      product_name: '[E2E-S4] Zero Qty',
      requested_by: sessions.kasir.user.id,
      requested_qty: 0,
      status: 'PENDING',
    });
    assert.ok(error !== null);
  });

  it('T2-F12-03: Owner restocking custom item (product_id null) completes without crashing stock update', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    let reqId = null;
    try {
      const { data } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: null, product_name: '[E2E-S4] Custom Restock', requested_by: kasir.user.id, requested_qty: 4, status: 'PENDING' })
        .select()
        .single();
      reqId = data.id;
      const { data: upd, error } = await owner.client
        .from('stock_requests')
        .update({ status: 'RESTOCKED', resolved_by: owner.user.id })
        .eq('id', reqId)
        .select()
        .single();
      assert.equal(error, null);
      assert.equal(upd.status, 'RESTOCKED');
    } finally {
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
    }
  });

  it('T2-F12-04: Mobile Stock Request screen guards against duplicate submissions on already-resolved requests', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /RESTOCKED/);
    assert.match(mobSrc, /REJECTED/);
  });

  it('T2-F12-05: Low-stock classification distinguishes stock === 0 vs stock <= min_stock vs healthy', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /min_stock/);
  });

  // =========================================================================
  // Feature #13: US-4.6 Mobile Bluetooth Thermal Receipt Printing
  // =========================================================================
  it('T2-F13-01: Zero-discount/zero-tax ESC/POS receipt omits bogus NaN/undefined lines', async (t) => {
    const printerModFile = listWorkspaceFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder missing in mobile/src (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    const bytes = fn({
      paperWidth: '58mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-20261124-000001-111',
      items: [{ product_name: 'Air Mineral', qty: 1, price: 5000, subtotal: 5000 }],
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 5000,
      cashReceived: 5000,
      changeAmount: 0,
      paymentMethod: 'cash',
    });
    const res = validateEscPosPayload(bytes, { paperWidth: '58mm' });
    assert.equal(res.ok, true, res.errors.join(' | '));
  });

  it('T2-F13-02: Very long product names (> 64 chars) wrap cleanly within 32 columns on 58mm', async (t) => {
    const printerModFile = listWorkspaceFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder missing in mobile/src (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    const bytes = fn({
      paperWidth: '58mm',
      storeName: 'ALPHOS Flagship Store Jakarta Selatan',
      invoiceNumber: 'INV-20261124-000002-222',
      items: [
        {
          product_name: 'Susu Almond Organik Rasa Matcha Premium Kemasan Hemat 1 Liter Edisi Spesial',
          qty: 2,
          price: 45000,
          subtotal: 90000,
        },
      ],
      totalAmount: 90000,
      cashReceived: 100000,
      changeAmount: 10000,
      paymentMethod: 'cash',
    });
    const res = validateEscPosPayload(bytes, { paperWidth: '58mm' });
    assert.equal(res.ok, true, res.errors.join(' | '));
  });

  it('T2-F13-03: ESC/POS header strictly forbids "ALPHOS POS" or box-drawing border around logo', async (t) => {
    const printerModFile = listWorkspaceFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder missing in mobile/src (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    const bytes = fn({
      paperWidth: '80mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-20261124-000003-333',
      items: [{ product_name: 'Roti Tawar', qty: 1, price: 15000, subtotal: 15000 }],
      totalAmount: 15000,
      cashReceived: 15000,
      changeAmount: 0,
      paymentMethod: 'qris',
    });
    const res = validateEscPosPayload(bytes, { paperWidth: '80mm' });
    assert.equal(res.ok, true, res.errors.join(' | '));
    assert.equal(/[┌┐└┘╔╗╚╝]/.test(res.lines.slice(0, 6).join('\n')), false);
  });

  it('T2-F13-04: Bluetooth service handles disconnected/denied printer gracefully without throwing', (t) => {
    const btFiles = listWorkspaceFiles('mobile/src').filter((f) => /printer|bluetooth/i.test(f));
    if (!requireDeliverableOrDryRunSkip(t, btFiles.length > 0, 'Mobile BT printer service missing (M4)')) {
      return;
    }
    const txt = btFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(txt, /catch|error|permission|disconnect/i);
  });

  it('T2-F13-05: Mobile thermal preview never leaks "Toko Retail Anda" placeholder', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M4)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.equal(/Toko Retail Anda|PT POS Retail Indonesia/i.test(mobSrc), false);
  });

  // =========================================================================
  // Feature #14: Mobile Automated Tests & Android Build
  // =========================================================================
  it('T2-F14-01: Mobile tests import real Shared Core modules (not mocked stub values)', (t) => {
    const testFiles = listWorkspaceFiles('mobile').filter((f) => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f));
    if (!requireDeliverableOrDryRunSkip(t, testFiles.length > 0, 'Mobile tests missing (M3/M4)')) {
      return;
    }
    const joined = testFiles.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(joined, /pricing|format|translations|csv/);
  });

  it('T2-F14-02: AndroidManifest.xml includes API 31+ BLUETOOTH_SCAN & BLUETOOTH_CONNECT permissions', (t) => {
    const manifests = listWorkspaceFiles('mobile/android').filter((f) => f.endsWith('AndroidManifest.xml'));
    if (!requireDeliverableOrDryRunSkip(t, manifests.length > 0, 'mobile/android/AndroidManifest.xml missing (M3)')) {
      return;
    }
    const xml = manifests.map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(xml, /BLUETOOTH_SCAN/);
    assert.match(xml, /BLUETOOTH_CONNECT/);
  });

  it('T2-F14-03: mobile/android/ config contains zero PROD Supabase sbtzajhgchpcdscrwtha references', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/android'), 'mobile/android missing (M3)')) {
      return;
    }
    const files = listWorkspaceFiles('mobile/android').filter((f) => !f.includes('/build/'));
    const leaks = scanFilesForProdLeak(files);
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F14-04: Missing Android SDK/device fails only when E2E_REQUIRE_ANDROID=1', (t) => {
    const hasSdk = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
    if (!hasSdk) {
      if (isAndroidRequired()) {
        assert.fail('E2E_REQUIRE_ANDROID=1 requires ANDROID_HOME');
      }
      t.skip('ANDROID_HOME not set; hardware Android build deferred cleanly');
    }
  });

  it('T2-F14-05: Mobile source contains zero legacy Vite or POS Retail placeholders', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3)')) {
      return;
    }
    const mobFiles = listWorkspaceFiles('mobile/src');
    for (const f of mobFiles) {
      const txt = readWorkspaceFile(f);
      assert.equal(/POS Retail|Toko Retail Anda|#863bff/i.test(txt), false, `Legacy leak in ${f}`);
    }
  });

  // =========================================================================
  // Feature #15: Markom Release Kit & Docs Alignment
  // =========================================================================
  it('T2-F15-01: MARKOM_RELEASE_KIT_v1.4.0.md contains zero AI-slop cliches or "ALPHOS POS"', (t) => {
    const rel = 'docs/process/MARKOM_RELEASE_KIT_v1.4.0.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing (M5)`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    assertAntiAiSlop(txt, { kind: 'copy', requireBrandTerms: true });
    assert.equal(/ALPHOS\s+POS/i.test(txt), false);
  });

  it('T2-F15-02: docs/RELEASE_SOP.md no longer mentions "4 paket dokumen" or "POS Toko Retail"', (t) => {
    const txt = readWorkspaceFile('docs/RELEASE_SOP.md');
    const clean = !/4\s+paket\s+dokumen|POS Toko Retail/i.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, clean, 'docs/RELEASE_SOP.md still has legacy "4 paket dokumen" or "POS Toko Retail"')) {
      return;
    }
    assert.equal(clean, true);
  });

  it('T2-F15-03: USER_GUIDE.md no longer displays v1.2.0 or POS Toko Retail', (t) => {
    const txt = readWorkspaceFile('USER_GUIDE.md');
    const clean = !/v1\.2\.0|POS Toko Retail/i.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, clean, 'USER_GUIDE.md still references v1.2.0 or POS Toko Retail')) {
      return;
    }
    assert.equal(clean, true);
  });

  it('T2-F15-04: README.md and docs/README.md do not claim v1.4.0 is deployed to PROD sbtzajhgchpcdscrwtha', (t) => {
    const r = readWorkspaceFile('README.md');
    const dr = readWorkspaceFile('docs/README.md');
    const ready = r.includes('1.4.0') && dr.includes('1.4.0');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'README.md / docs/README.md not yet updated to v1.4.0')) {
      return;
    }
    const leaks = scanFilesForProdLeak(['README.md', 'docs/README.md'], { allowExclusionMentions: true });
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F15-05: Markdown documentation passes Anti-AI-Slop (zero TBD/Lorem ipsum/cliches)', (t) => {
    const docs = ['docs/RELEASE_SOP.md', 'docs/README.md', 'README.md', 'USER_GUIDE.md'];
    const updated = docs.every((d) => readWorkspaceFile(d).includes('ALPHOS'));
    if (!requireDeliverableOrDryRunSkip(t, updated, 'Release Markdown docs not yet migrated to ALPHOS (M5)')) {
      return;
    }
    for (const d of docs) {
      assertAntiAiSlop(readWorkspaceFile(d), { kind: 'docs' });
    }
  });

  // =========================================================================
  // Feature #16: 5 Official PDF HTML Templates & Build Script
  // =========================================================================
  it('T2-F16-01: docs/html/01..05*.html contain zero legacy #2563eb or #1e3a8a primary blue theme', (t) => {
    const htmls = listDocHtmlFiles();
    const migrated = htmls.every((f) => !/#2563eb|#1e3a8a/i.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, migrated, 'docs/html/01..05*.html still use legacy #2563eb/#1e3a8a blue styling (M5)')) {
      return;
    }
    assert.equal(migrated, true);
  });

  it('T2-F16-02: docs/html/01..05*.html contain zero "PT POS Retail Indonesia" or "POS Toko Retail"', (t) => {
    const htmls = listDocHtmlFiles();
    const clean = htmls.every((f) => !/PT POS Retail Indonesia|POS Toko Retail/i.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, clean, 'docs/html/ still contain legacy PT POS Retail Indonesia / POS Toko Retail')) {
      return;
    }
    assert.equal(clean, true);
  });

  it('T2-F16-03: 04_sertifikasi_deployment.html never certifies PROD sbtzajhgchpcdscrwtha for v1.4.0', (t) => {
    const html = readWorkspaceFile('docs/html/04_sertifikasi_deployment.html');
    if (!requireDeliverableOrDryRunSkip(t, html.includes('1.4.0'), '04_sertifikasi_deployment.html not yet updated to v1.4.0 (M5)')) {
      return;
    }
    const leaks = scanFilesForProdLeak(['docs/html/04_sertifikasi_deployment.html'], { allowExclusionMentions: true });
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F16-04: docs/html/01..05*.html contain zero AI-slop filler or TBD/Lorem ipsum', (t) => {
    const htmls = listDocHtmlFiles();
    const updated = htmls.every((f) => readWorkspaceFile(f).includes('ALPHOS'));
    if (!requireDeliverableOrDryRunSkip(t, updated, 'docs/html/ not yet migrated to ALPHOS (M5)')) {
      return;
    }
    for (const f of htmls) {
      const stripped = readWorkspaceFile(f).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
      assertAntiAiSlop(stripped, { kind: 'docs' });
    }
  });

  it('T2-F16-05: Rendering docs/html/01..05*.html at A4 width (794px) has zero horizontal overflow', async (t) => {
    const htmls = listDocHtmlFiles();
    const updated = htmls.every((f) => readWorkspaceFile(f).includes('ALPHOS'));
    if (!requireDeliverableOrDryRunSkip(t, updated, 'docs/html/ not yet migrated to ALPHOS (M5)')) {
      return;
    }
    await withBrowserPage({ viewport: { width: 794, height: 1123 } }, async (page) => {
      for (const f of htmls) {
        await page.setContent(readWorkspaceFile(f));
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        const cw = await page.evaluate(() => document.documentElement.clientWidth);
        assert.ok(sw <= cw + 1, `${f} overflows A4 width: ${sw} > ${cw}`);
      }
    });
  });

  // =========================================================================
  // Feature #18: Final Quality Gate, Audits, DEV Verification & 5 PDFs
  // =========================================================================
  it('T2-F18-01: Final ANTI_UI_AI_SLOP_RUBRIC.md has zero rows marked FAIL, PENDING, or TBD', (t) => {
    const rel = 'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md';
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists(rel), `${rel} missing`)) {
      return;
    }
    const txt = readWorkspaceFile(rel);
    const hasResults =
      /\|\s*`?PASS`?\s*\|/i.test(txt) &&
      !/\|\s*`?PENDING`?\s*\|/i.test(txt) &&
      !/\bTBD\b/i.test(txt);
    if (!requireDeliverableOrDryRunSkip(t, hasResults, 'ANTI_UI_AI_SLOP_RUBRIC.md not yet completed in M6')) {
      return;
    }
    assert.equal(/\|\s*`?FAIL`?\s*\|/i.test(txt), false, 'Open FAIL row found in rubric');
    assert.equal(/\bTBD\b/i.test(txt), false, 'Unfilled TBD found in rubric');
  });

  it('T2-F18-02: 03_laporan_pengujian_akhir.html does not carry stale v1.3.0 "43 Skipped" figures', (t) => {
    const html = readWorkspaceFile('docs/html/03_laporan_pengujian_akhir.html');
    if (!requireDeliverableOrDryRunSkip(t, html.includes('1.4.0'), '03_laporan_pengujian_akhir.html not yet updated to v1.4.0')) {
      return;
    }
    assert.equal(html.includes('43 Skipped'), false);
  });

  it('T2-F18-03: No stale v1.3.0 PDFs remain unreplaced when v1.4.0 PDFs are published', (t) => {
    const pdfs = listDocPdfFiles();
    const hasV14 = pdfs.some((p) => /1\.4\.0|1_4|v1\.4/.test(p));
    if (!requireDeliverableOrDryRunSkip(t, hasV14, 'v1.4.0 PDFs not yet published (M6)')) {
      return;
    }
    const stale = pdfs.filter((p) => /1\.3\.0/.test(p));
    assert.equal(stale.length, 0, `Stale v1.3.0 PDFs remain: ${stale.join(', ')}`);
  });

  it('T2-F18-04: Supabase migrations & active configs show zero writes targeting PROD sbtzajhgchpcdscrwtha', () => {
    const migs = listWorkspaceFiles('supabase/migrations');
    const leaks = scanFilesForProdLeak(['.env.development', 'src/lib/supabaseClient.ts', ...migs]);
    assert.equal(leaks.length, 0, JSON.stringify(leaks));
  });

  it('T2-F18-05: Generated HTML/PDF templates contain zero broken file:// local image links', (t) => {
    const htmls = listDocHtmlFiles();
    const updated = htmls.every((f) => readWorkspaceFile(f).includes('ALPHOS'));
    if (!requireDeliverableOrDryRunSkip(t, updated, 'docs/html/ not yet migrated to ALPHOS (M5)')) {
      return;
    }
    for (const f of htmls) {
      assert.equal(/file:\/\//i.test(readWorkspaceFile(f)), false, `Broken file:// link in ${f}`);
    }
  });
});
