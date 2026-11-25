import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  ANTI_UI_VIEWPORTS,
  DEV_REF,
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
  importWorkspaceModule,
  invokePricingEngine,
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
  scanNextBuildForLeaks,
  snapshotStoreSettings,
  validateConcept2Svg,
  validateEscPosPayload,
  withBrowserPage,
  workspaceFileExists,
  workspacePath,
} from './sprint4_helpers.mjs';

loadDevEnv();

describe('Tier 3 — Sprint 4 (v1.4.0) Pairwise Cross-Feature Combinatorial Matrix (18 scenarios)', () => {
  it('T3-01: Web LoginPage x Theme (light/dark) x Lang (id/en) x Viewport (375/768/1440) x Concept 2 Logo', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;

    await withBrowserPage({ baseUrl: srv.baseUrl }, async (page) => {
      for (const theme of ['light', 'dark']) {
        const curTheme = await page.getAttribute('html', 'data-theme');
        if (curTheme !== theme) {
          await page.locator('button.swipe-theme').click();
        }
        for (const lang of ['id', 'en']) {
          const curLang = await page.getAttribute('html', 'lang');
          if (curLang !== lang) {
            await page.locator('button.swipe-lang').click();
          }
          for (const vp of ANTI_UI_VIEWPORTS) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await assertPageAntiUiSlop(page);
            const logos = await extractLogoDescriptorsFromPage(page);
            assert.ok(logos.length >= 1, `Missing Concept 2 logo in ${theme}/${lang} at ${vp.width}`);
            assertConcept2Svg(logos[0], { requireWordmark: true });
          }
        }
      }
    });
  });

  it('T3-02: Public /receipt/[invoice] x Theme (light/dark) x Lang (id/en) x Viewport (375/1440)', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;

    await withBrowserPage({ baseUrl: `${srv.baseUrl}/receipt/INV-S4-COMBO-404` }, async (page) => {
      for (const theme of ['light', 'dark']) {
        if ((await page.getAttribute('html', 'data-theme')) !== theme) {
          await page.locator('button.swipe-theme').click();
        }
        for (const lang of ['id', 'en']) {
          if ((await page.getAttribute('html', 'lang')) !== lang) {
            await page.locator('button.swipe-lang').click();
          }
          for (const vp of [ANTI_UI_VIEWPORTS[0], ANTI_UI_VIEWPORTS[2]]) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await assertPageAntiUiSlop(page);
          }
        }
      }
    });
  });

  it('T3-03: Web CSS semantic states (low-stock, out-of-stock, not-found, danger-action) x Light/Dark themes', (t) => {
    const css = readWorkspaceFile('src/app/globals.css');
    const ready =
      css.includes('.stock-pill.low') &&
      css.includes('.icon-btn.danger') &&
      css.includes('.out-of-stock') &&
      css.includes('.price-result.not-found');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'globals.css semantic state classes not yet implemented (M2)')) {
      return;
    }
    assert.match(css, /\[data-theme=['"]dark['"]\]/);
    assert.match(css, /--danger/);
  });

  it('T3-04: Shared Core formatDateTime(iso, lang) x translations (id/en) x formatRupiah', async (t) => {
    const { formatDateTime, formatRupiah, APP_VERSION } = await importWorkspaceModule('src/utils/format.ts');
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    if (!requireDeliverableOrDryRunSkip(t, APP_VERSION === '1.4.0', 'Shared Core M1 not yet at v1.4.0')) {
      return;
    }
    const iso = '2026-11-24T14:15:00.000Z';
    const dtId = formatDateTime(iso, 'id');
    const dtEn = formatDateTime(iso, 'en');
    assert.notEqual(dtId, dtEn);
    assert.ok(translations.id.logout && translations.en.logout);
    assert.match(formatRupiah(125000), /125\.000/);
  });

  it('T3-05: Shared Core calculateOrderPricing (item % + order Rp + 11% PPN) x DEV process_sale x get_public_receipt (Cash)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const expected = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 25000, qty: 2, discount_type: 'percent', discount_value: 20 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 5000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    // 50000 - 20% = 40000; -5000 = 35000; +11% (3850) = 38850
    assert.equal(expected.totalAmount, 38850);

    const { owner, kasir } = sessions;
    const anon = createAnonClient();
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({ tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 25000, stock: 10 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const inv = `INV-${runTag}-T305`;
      const { data: sale, error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: prod.id, qty: 2, discount_type: 'percent', discount_value: 20 }],
        p_discount_type: 'nominal',
        p_discount_value: 5000,
        p_apply_tax: true,
      });
      assert.equal(error, null, error?.message);
      assert.equal(Number(sale.transaction.total_amount), expected.totalAmount);
      assert.equal(Number(sale.transaction.change_amount), 11150);

      const { data: pub } = await anon.rpc('get_public_receipt', { p_invoice: inv });
      assert.equal(Number(pub.total_amount), expected.totalAmount);
      assert.equal(Number(pub.tax_amount), expected.taxAmount);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T3-06: Shared Core calculateOrderPricing (item Rp + order % + applyTax=false) x DEV process_sale (QRIS)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const expected = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 30000, qty: 1, discount_type: 'nominal', discount_value: 5000 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 10,
      taxEnabled: true,
      taxRate: 11,
      applyTax: false,
    });
    // 30000 - 5000 = 25000; -10% (2500) = 22500; tax 0
    assert.equal(expected.totalAmount, 22500);

    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({ tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 30000, stock: 10 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const { data: sale, error } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-T306`,
        p_payment_method: 'qris',
        p_cash_received: expected.totalAmount,
        p_items: [{ product_id: prod.id, qty: 1, discount_type: 'nominal', discount_value: 5000 }],
        p_discount_type: 'percent',
        p_discount_value: 10,
        p_apply_tax: false,
      });
      assert.equal(error, null, error?.message);
      assert.equal(Number(sale.transaction.tax_amount), 0);
      assert.equal(Number(sale.transaction.total_amount), expected.totalAmount);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T3-07: Shared Core buildCsvString x pricing output x formula-injection sanitization', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 3 }],
      taxEnabled: true,
      taxRate: 10,
      applyTax: true,
    });
    const csv = buildCsvString(
      ['Invoice', 'Cashier', 'Total'],
      [['INV-S4-001', '=MALICIOUS()', res.totalAmount]]
    );
    const rows = parseCsvRoundTrip(csv);
    assert.equal(rows[1][1], "'=MALICIOUS()");
    assert.equal(rows[1][2], '33000');
  });

  it('T3-08: Shared Core (#1) x Mobile RN Integration (#8: Metro watchFolders + TS paths + DEV supabaseClient)', (t) => {
    const ready =
      workspaceFileExists('mobile/metro.config.js') &&
      workspaceFileExists('mobile/tsconfig.json') &&
      workspaceFileExists('mobile/src');
    if (!requireDeliverableOrDryRunSkip(t, ready, 'mobile/ RN scaffolding missing (M3)')) {
      return;
    }
    const metro = readWorkspaceFile('mobile/metro.config.js');
    const tsCfg = readWorkspaceFile('mobile/tsconfig.json');
    assert.match(metro, /watchFolders/);
    assert.match(tsCfg, /\.\.\/src/);
    const mobFiles = listWorkspaceFiles('mobile/src');
    const importsCore = mobFiles.some((f) => /src\/(utils|types|i18n)|@(shared|core)\//.test(readWorkspaceFile(f)));
    assert.equal(importsCore, true, 'Expected mobile/src to import Shared Core');
  });

  it('T3-09: Auth/Role Routing (#9: owner/admin vs kasir/user) x Shift & Petty Cash (#10)', async (t) => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);

    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    let shiftState = null;
    try {
      shiftState = await ensureOpenShift(sessions.kasir.client, sessions.kasir.user.id, 75000);
      const { data: ownerView } = await sessions.owner.client
        .from('shifts')
        .select('id, status')
        .eq('id', shiftState.shift.id)
        .single();
      assert.equal(ownerView.status, 'OPEN');
    } finally {
      await closeOpenedShiftSafely(sessions.kasir.client, shiftState);
    }
  });

  it('T3-10: Shift & Petty Cash (#10) x Cashier Checkout (#11: Cash + QRIS + Petty IN/OUT -> close_shift)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const { data: openExisting } = await kasir.client.from('shifts').select('id').eq('cashier_id', kasir.user.id).eq('status', 'OPEN').maybeSingle();
    if (openExisting) {
      t.skip('Kasir already has an OPEN shift');
      return;
    }

    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shift = null;
    let closed = false;
    try {
      await owner.client.from('store_settings').update({ tax_enabled: false, tax_rate: 0 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 10000, stock: 10 });
      const opened = await ensureOpenShift(kasir.client, kasir.user.id, 100000);
      shift = opened.shift;

      await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-CSH`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: prod.id, qty: 2 }],
      });
      await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-QRS`,
        p_payment_method: 'qris',
        p_cash_received: 10000,
        p_items: [{ product_id: prod.id, qty: 1 }],
      });
      await kasir.client.from('petty_cash_logs').insert([
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'IN', amount: 20000, category: 'KEMBALIAN', description: '[E2E-S4] IN' },
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'OUT', amount: 5000, category: 'OPERASIONAL', description: '[E2E-S4] OUT' },
      ]);
      // Expected cash excludes QRIS: 100000 + 20000 + 20000 - 5000 = 135000
      const res = await closeShiftWithExpectedCash(kasir.client, shift);
      closed = true;
      assert.equal(Number(res.expected_cash), 135000);
      assert.equal(Number(res.discrepancy), 0);
    } finally {
      if (shift && !closed) await closeOpenedShiftSafely(kasir.client, { shift, openedByTest: true });
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T3-11: StoreSettings (#6) x Cashier (#11) x Digital/WhatsApp Receipt DEV URL', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const anon = createAnonClient();
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({
        store_name: 'ALPHOS Combo Store',
        footer_note: 'Terima kasih — ALPHOS by AlphaGen',
        tax_enabled: true,
        tax_rate: 10,
      }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 20000, stock: 5 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);
      const inv = `INV-${runTag}-WA`;
      await kasir.client.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'transfer',
        p_cash_received: 22000,
        p_items: [{ product_id: prod.id, qty: 1 }],
        p_apply_tax: true,
      });
      const { data: rec } = await anon.rpc('get_public_receipt', { p_invoice: inv });
      assert.equal(rec.store_settings.store_name, 'ALPHOS Combo Store');
      assert.equal(Number(rec.total_amount), 22000);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T3-12: Cashier Pricing (#11) x ESC/POS Thermal Builder (#13: 58mm & 80mm parity)', async (t) => {
    const printerModFile = listWorkspaceFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Pure ESC/POS builder missing in mobile/src (M4)')) {
      return;
    }
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const calc = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 20000, qty: 2, discount_type: 'percent', discount_value: 10 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 1000,
      taxEnabled: true,
      taxRate: 10,
      applyTax: true,
    });
    // 40000 - 4000 = 36000; -1000 = 35000; +10% (3500) = 38500
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');

    for (const width of ['58mm', '80mm']) {
      const bytes = fn({
        paperWidth: width,
        storeName: 'ALPHOS Store',
        invoiceNumber: 'INV-20261124-112233-900',
        items: [{ product_name: 'Kopi Susu Gula Aren', qty: 2, price: 20000, subtotal: 36000 }],
        discountAmount: calc.discountAmount,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        cashReceived: 50000,
        changeAmount: 11500,
        paymentMethod: 'cash',
      });
      const res = validateEscPosPayload(bytes, { paperWidth: width, requiredSnippets: ['38.500'] });
      assert.equal(res.ok, true, `${width} failed: ${res.errors.join(' | ')}`);
    }
  });

  it('T3-13: Bilingual ID/EN (#9) x Petty Cash Categories (#10) x Receipt/Thermal Labels (#11/#13)', async (t) => {
    const { APP_VERSION } = await importWorkspaceModule('src/utils/format.ts');
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    if (!requireDeliverableOrDryRunSkip(t, APP_VERSION === '1.4.0', 'Shared Core i18n M1 not yet at v1.4.0')) {
      return;
    }
    assert.ok(translations.id.tabs && translations.en.tabs);
    assert.notEqual(JSON.stringify(translations.id), JSON.stringify(translations.en));
  });

  it('T3-14: Kasir Stock Request (#12) x Owner Restock (#12) x Cashier Stock Availability (#11)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prod = null;
    let reqId = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({ tax_enabled: false, tax_rate: 0 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { sell_price: 10000, stock: 0, min_stock: 2 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);

      const { error: oosErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-OOS`,
        p_payment_method: 'cash',
        p_cash_received: 10000,
        p_items: [{ product_id: prod.id, qty: 1 }],
      });
      assert.ok(oosErr !== null, 'Expected out-of-stock sale to fail');

      const { data: req } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: prod.id, product_name: prod.name, requested_by: kasir.user.id, requested_qty: 5, status: 'PENDING' })
        .select()
        .single();
      reqId = req.id;

      await owner.client.from('products').update({ stock: 5 }).eq('id', prod.id);
      await owner.client.from('stock_requests').update({ status: 'RESTOCKED', resolved_by: owner.user.id }).eq('id', reqId);

      const { data: sale, error: okErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-RST`,
        p_payment_method: 'cash',
        p_cash_received: 10000,
        p_items: [{ product_id: prod.id, qty: 1 }],
      });
      assert.equal(okErr, null, okErr?.message);
      assert.equal(Number(sale.transaction.total_amount), 10000);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T3-15: Mobile Build & Tests (#14) x DEV Isolation (#8)', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/package.json') && workspaceFileExists('mobile/node_modules'), 'mobile/ dependencies not yet installed (M3/M4)')) {
      return;
    }
    const mobFiles = listWorkspaceFiles('mobile').filter((f) => !f.includes('node_modules/') && !f.includes('/build/'));
    assert.equal(scanFilesForProdLeak(mobFiles).length, 0);
    execFileSync('cmd', ['/c', 'npm', 'test'], { cwd: workspacePath('mobile'), stdio: 'pipe' });
  });

  it('T3-16: Web DEV Build Guard (#7) x Live Next.js Server (#5) x PROD Network Interceptor', async (t) => {
    const scan = scanNextBuildForLeaks();
    if (!requireDeliverableOrDryRunSkip(t, scan.exists && scan.prodHits === 0 && scan.devHits > 0, `DEV .next build not yet ready (${JSON.stringify(scan)})`)) {
      return;
    }
    const srv = await ensureWebServer(t, { mode: 'start' });
    if (!srv) return;
    await withBrowserPage({ baseUrl: srv.baseUrl }, async (page, ctx) => {
      await assertPageAntiUiSlop(page);
      assert.equal(ctx.prodRequests.length, 0);
      assert.equal(ctx.pageErrors.length, 0);
    });
  });

  it('T3-17: Process Role Guides (#3) x Rubric/PO Readiness (#4) x Markom Kit (#15)', (t) => {
    const files = [
      'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md',
      'docs/process/MARKOM_RELEASE_KIT_v1.4.0.md',
      'docs/process/PO_BUSINESS_READINESS_v1.4.0.md',
    ];
    if (!requireDeliverableOrDryRunSkip(t, files.every(workspaceFileExists), 'docs/process/ M1/M5 deliverables missing')) {
      return;
    }
    for (const f of files) {
      const txt = readWorkspaceFile(f);
      assertAntiAiSlop(txt, { kind: 'docs', requireBrandTerms: true });
      assert.equal(/ALPHOS\s+POS/i.test(txt), false);
    }
  });

  it('T3-18: 5 Release HTML Templates (#16) x Concept 2 Light SVG (#2) x Release SOP/PDFs (#15/#18)', (t) => {
    const htmls = listDocHtmlFiles();
    const pdfs = listDocPdfFiles();
    const allMigrated =
      htmls.length === 5 &&
      pdfs.length === 5 &&
      htmls.every((f) => {
        const h = readWorkspaceFile(f);
        const m = h.match(/<svg[\s\S]*?<\/svg>/i);
        return m && validateConcept2Svg(m[0], { variant: 'light' }).ok;
      }) &&
      readWorkspaceFile('docs/RELEASE_SOP.md').includes('ALPHOS');
    if (!requireDeliverableOrDryRunSkip(t, allMigrated, '5 Release HTML/PDF & SOP v1.4.0 pipeline not yet complete (M5/M6)')) {
      return;
    }
    assert.equal(scanFilesForProdLeak(htmls, { allowExclusionMentions: true }).length, 0);
    assert.ok(readWorkspaceFile('docs/html/04_sertifikasi_deployment.html').includes(DEV_REF));
    assert.equal(readWorkspaceFile('package.json').includes(PROD_REF), false);
  });
});
