import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
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
  getOptionalRoleCredentials,
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
  parseCsvRoundTrip,
  readWorkspaceFile,
  requireAuthSessions,
  requireDeliverableOrDryRunSkip,
  restoreStoreSettings,
  scanFilesForProdLeak,
  scanNextBuildForLeaks,
  snapshotStoreSettings,
  validateEscPosPayload,
  withBrowserPage,
  workspaceFileExists,
  workspacePath,
} from './sprint4_helpers.mjs';

loadDevEnv();

describe('Tier 4 — Sprint 4 (v1.4.0) End-to-End Retail & Release Pipeline Scenarios (10 scenarios)', () => {
  it('T4-01: Web responsive bilingual Dark/Light Login -> Checkout -> Public /receipt/[invoice] journey', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const srv = await ensureWebServer(t);
    if (!srv) return;
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const { owner, kasir } = sessions;
    const runTag = makeSprint4RunTag();
    const snap = await snapshotStoreSettings(owner.client);
    let prod = null;
    let shiftState = null;

    try {
      await owner.client.from('store_settings').update({ store_name: 'ALPHOS E2E Store', tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prod = await createTestProduct(owner.client, runTag, { name: `[E2E-S4] Espresso ${runTag}`, sell_price: 20000, stock: 10 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id, 100000);

      const inv = `INV-${runTag}-WEB1`;
      const { error: saleErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: prod.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null, saleErr?.message);

      await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[0] }, async (page, ctx) => {
        await assertPageAntiUiSlop(page);
        const logos = await extractLogoDescriptorsFromPage(page);
        assert.ok(logos.length >= 1);
        assertConcept2Svg(logos[0], { requireWordmark: true });

        await page.locator('button.swipe-lang').click();
        await page.locator('button.swipe-theme').click();
        await assertPageAntiUiSlop(page);

        await page.goto(`${srv.baseUrl}/receipt/${inv}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.receipt-paper', { timeout: 10000 });
        const receiptText = await page.locator('.receipt-paper').innerText();
        assert.ok(receiptText.includes(inv));
        assert.ok(receiptText.includes('ALPHOS'));

        await page.setViewportSize(ANTI_UI_VIEWPORTS[2]);
        await assertPageAntiUiSlop(page);
        assert.equal(ctx.pageErrors.length, 0);
        assert.equal(ctx.prodRequests.length, 0);
      });
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T4-02: Web Owner UI revamp journey (authenticated tabs, zero native confirm/prompt, zero overflow)', async (t) => {
    if (!requireDeliverableOrDryRunSkip(t, isWebRevampLanded(), 'Web revamp M2 not yet landed')) {
      return;
    }
    const ownerCreds = getOptionalRoleCredentials('owner');
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions || !ownerCreds) return;

    const srv = await ensureWebServer(t);
    if (!srv) return;

    await withBrowserPage({ baseUrl: srv.baseUrl, viewport: ANTI_UI_VIEWPORTS[1] }, async (page, ctx) => {
      await page.addInitScript(() => {
        window.__nativeDialogCalls = [];
        window.confirm = () => { window.__nativeDialogCalls.push('confirm'); return true; };
        window.prompt = () => { window.__nativeDialogCalls.push('prompt'); return ''; };
      });

      const inputs = page.locator('form input');
      await inputs.nth(0).fill(ownerCreds.identifier);
      await inputs.nth(1).fill(ownerCreds.password);
      await page.locator('form button[type="submit"]').click();
      await page.waitForSelector('.nav-tabs', { timeout: 20000 });

      const tabs = page.locator('.nav-tabs button, .nav-tabs .nav-tab');
      const count = await tabs.count();
      assert.ok(count >= 5, `Expected Owner tabs, got ${count}`);
      for (let i = 0; i < count; i += 1) {
        await tabs.nth(i).click();
        await page.waitForTimeout(250);
        await assertPageAntiUiSlop(page);
      }
      const dialogCalls = await page.evaluate(() => window.__nativeDialogCalls || []);
      assert.equal(dialogCalls.length, 0, `Native dialogs invoked: ${dialogCalls.join(', ')}`);
      assert.equal(ctx.pageErrors.length, 0);
    });
  });

  it('T4-03: Full Mobile Cashier shift day (Open Shift -> Discounts & 11% PPN Cash + QRIS -> Petty IN/OUT -> Close Shift)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;
    const { owner, kasir } = sessions;
    const { data: openExisting } = await kasir.client.from('shifts').select('id').eq('cashier_id', kasir.user.id).eq('status', 'OPEN').maybeSingle();
    if (openExisting) {
      t.skip('Kasir already has an OPEN shift on DEV');
      return;
    }

    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const snap = await snapshotStoreSettings(owner.client);
    const runTag = makeSprint4RunTag();
    let prodA = null;
    let prodB = null;
    let shift = null;
    let closed = false;

    try {
      await owner.client.from('store_settings').update({ tax_enabled: true, tax_rate: 11 }).eq('id', 1);
      prodA = await createTestProduct(owner.client, `${runTag}-A`, { sell_price: 20000, stock: 10 });
      prodB = await createTestProduct(owner.client, `${runTag}-B`, { sell_price: 15000, stock: 10 });

      const opened = await ensureOpenShift(kasir.client, kasir.user.id, 200000);
      shift = opened.shift;

      const expectedCashSale = invokePricingEngine(pricingMod, {
        items: [
          { sell_price: 20000, qty: 2, discount_type: 'percent', discount_value: 10 },
          { sell_price: 15000, qty: 1, discount_type: 'nominal', discount_value: 2000 },
        ],
        orderDiscountType: 'nominal',
        orderDiscountValue: 4000,
        taxEnabled: true,
        taxRate: 11,
        applyTax: true,
      });
      // (36000 + 13000) - 4000 = 45000 + 4950 = 49950
      assert.equal(expectedCashSale.totalAmount, 49950);

      const { data: cashSale, error: cErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-MC1`,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [
          { product_id: prodA.id, qty: 2, discount_type: 'percent', discount_value: 10 },
          { product_id: prodB.id, qty: 1, discount_type: 'nominal', discount_value: 2000 },
        ],
        p_discount_type: 'nominal',
        p_discount_value: 4000,
        p_apply_tax: true,
      });
      assert.equal(cErr, null, cErr?.message);
      assert.equal(Number(cashSale.transaction.total_amount), 49950);
      assert.equal(Number(cashSale.transaction.change_amount), 50);

      const { error: qErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-MQ1`,
        p_payment_method: 'qris',
        p_cash_received: 16650,
        p_items: [{ product_id: prodB.id, qty: 1 }],
        p_apply_tax: true,
      });
      assert.equal(qErr, null, qErr?.message);

      await kasir.client.from('petty_cash_logs').insert([
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'IN', amount: 15000, category: 'KEMBALIAN', description: '[E2E-S4] Topup' },
        { shift_id: shift.id, cashier_id: kasir.user.id, type: 'OUT', amount: 25000, category: 'OPERASIONAL', description: '[E2E-S4] Supplies' },
      ]);

      // Expected: 200000 + 49950 + 15000 - 25000 = 239950
      const rec = await closeShiftWithExpectedCash(kasir.client, shift);
      closed = true;
      assert.equal(Number(rec.expected_cash), 239950);
      assert.equal(Number(rec.discrepancy), 0);
    } finally {
      if (shift && !closed) await closeOpenedShiftSafely(kasir.client, { shift, openedByTest: true });
      await restoreStoreSettings(owner.client, snap);
      if (prodA) await cleanupTestProduct(owner.client, prodA.id);
      if (prodB) await cleanupTestProduct(owner.client, prodB.id);
    }
  });

  it('T4-04: Cross-client Kasir Stock Request -> Owner Live Monitor Approve & Restock -> Kasir Sale', async (t) => {
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
      prod = await createTestProduct(owner.client, runTag, { sell_price: 12000, stock: 0, min_stock: 3 });
      shiftState = await ensureOpenShift(kasir.client, kasir.user.id);

      const { data: req, error: reqErr } = await kasir.client
        .from('stock_requests')
        .insert({ product_id: prod.id, product_name: prod.name, requested_by: kasir.user.id, requested_qty: 10, note: 'Habis di rak depan', status: 'PENDING' })
        .select()
        .single();
      assert.equal(reqErr, null);
      reqId = req.id;

      await owner.client.from('stock_requests').update({ status: 'APPROVED', resolved_by: owner.user.id }).eq('id', reqId);
      await owner.client.from('products').update({ stock: 10 }).eq('id', prod.id);
      await owner.client.from('stock_requests').update({ status: 'RESTOCKED', resolved_by: owner.user.id }).eq('id', reqId);

      const { data: sale, error: saleErr } = await kasir.client.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-SR1`,
        p_payment_method: 'cash',
        p_cash_received: 24000,
        p_items: [{ product_id: prod.id, qty: 2 }],
      });
      assert.equal(saleErr, null, saleErr?.message);
      assert.equal(Number(sale.transaction.total_amount), 24000);
    } finally {
      await closeOpenedShiftSafely(kasir.client, shiftState);
      if (reqId) await owner.client.from('stock_requests').delete().eq('id', reqId);
      await restoreStoreSettings(owner.client, snap);
      if (prod) await cleanupTestProduct(owner.client, prod.id);
    }
  });

  it('T4-05: Mobile ESC/POS 58mm/80mm Thermal Receipt + WhatsApp DEV share parity', async (t) => {
    const printerModFile = listWorkspaceFiles('mobile/src').find((f) => /escpos/i.test(f) && !/react-native/.test(readWorkspaceFile(f)));
    if (!requireDeliverableOrDryRunSkip(t, Boolean(printerModFile), 'Mobile ESC/POS builder missing (M4)')) {
      return;
    }
    const mod = await importWorkspaceModule(printerModFile);
    const fn = Object.values(mod).find((v) => typeof v === 'function');
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const calc = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 25000, qty: 2 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 5000,
      taxEnabled: true,
      taxRate: 10,
      applyTax: true,
    });
    // 50000 - 5000 = 45000 + 4500 = 49500
    for (const w of ['58mm', '80mm']) {
      const bytes = fn({
        paperWidth: w,
        storeName: 'ALPHOS Flagship',
        invoiceNumber: 'INV-20261124-150000-777',
        items: [{ product_name: 'Kopi Tubruk Signature', qty: 2, price: 25000, subtotal: 50000 }],
        discountAmount: calc.discountAmount,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        cashReceived: 50000,
        changeAmount: 500,
        paymentMethod: 'cash',
      });
      const v = validateEscPosPayload(bytes, { paperWidth: w, requiredSnippets: ['49.500', 'INV-20261124-150000-777'] });
      assert.equal(v.ok, true, v.errors.join(' | '));
    }
  });

  it('T4-06: Mobile & Android hardware graceful degradation (manual barcode & thermal preview fallback)', (t) => {
    if (!requireDeliverableOrDryRunSkip(t, workspaceFileExists('mobile/src'), 'mobile/src missing (M3/M4)')) {
      return;
    }
    const mobSrc = listWorkspaceFiles('mobile/src').map((f) => readWorkspaceFile(f)).join('\n');
    assert.match(mobSrc, /manual|TextInput/i);
    assert.match(mobSrc, /preview|fallback/i);
    if (isAndroidRequired()) {
      const hasSdk = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
      assert.ok(hasSdk, 'ANDROID_HOME required when E2E_REQUIRE_ANDROID=1');
    }
  });

  it('T4-07: Multi-role (owner/admin vs kasir/user) & anon RLS security end-to-end audit on DEV', async () => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);

    const anon = createAnonClient();
    const { error: psErr } = await anon.rpc('process_sale', {
      p_invoice_number: 'INV-S4-ANON',
      p_payment_method: 'cash',
      p_cash_received: 10000,
      p_items: [],
    });
    assert.ok(psErr !== null);

    const { error: csErr } = await anon.rpc('close_shift', {
      p_shift_id: '00000000-0000-0000-0000-000000000000',
      p_actual_cash: 0,
      p_notes: 'anon audit',
    });
    assert.ok(csErr !== null);
  });

  it('T4-08: Shared Core dual-runtime zero-DOM parity & CSV export injection neutralization', async (t) => {
    const { APP_VERSION, STORE_INFO, formatDateTime } = await importWorkspaceModule('src/utils/format.ts');
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    if (!requireDeliverableOrDryRunSkip(t, APP_VERSION === '1.4.0', 'Shared Core M1 not yet at v1.4.0')) {
      return;
    }
    assert.ok(STORE_INFO.name.includes('ALPHOS'));
    assert.notEqual(formatDateTime('2026-11-24T10:00:00Z', 'id'), formatDateTime('2026-11-24T10:00:00Z', 'en'));
    const csv = buildCsvString(['Store', 'Payload'], [[STORE_INFO.name, '=HYPERLINK("http://evil")']]);
    const rows = parseCsvRoundTrip(csv);
    assert.equal(rows[1][1], '\'=HYPERLINK("http://evil")');
  });

  it('T4-09: DEV Build Guard -> .next DEV Verification -> Release SOP 5-PDF Build Pipeline', (t) => {
    const scriptRel = 'scripts/build-release-pdfs.mjs';
    const scan = scanNextBuildForLeaks();
    const ready =
      workspaceFileExists(scriptRel) &&
      scan.exists &&
      scan.prodHits === 0 &&
      scan.devHits > 0 &&
      listDocPdfFiles().length === 5;
    if (!requireDeliverableOrDryRunSkip(t, ready, 'DEV build or 5-PDF release pipeline not yet complete (M2/M5/M6)')) {
      return;
    }
    execFileSync(process.execPath, [workspacePath(scriptRel)], { cwd: workspacePath('.'), stdio: 'pipe' });
    const pdfs = listDocPdfFiles();
    assert.equal(pdfs.length, 5);
    for (const p of pdfs) {
      const buf = fs.readFileSync(workspacePath(p));
      assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
      assert.ok(buf.length > 10240);
    }
  });

  it('T4-10: Final Sprint 4 Quality Gate (Concept 2 purity + Anti-UI/AI-Slop Rubric + PO Readiness + Zero PROD leaks)', (t) => {
    const requiredDocs = [
      'docs/process/ANTI_UI_AI_SLOP_RUBRIC.md',
      'docs/process/MARKOM_RELEASE_KIT_v1.4.0.md',
      'docs/process/PO_BUSINESS_READINESS_v1.4.0.md',
    ];
    if (!requireDeliverableOrDryRunSkip(t, requiredDocs.every(workspaceFileExists), 'Final M6 process/audit docs missing')) {
      return;
    }
    const rubric = readWorkspaceFile('docs/process/ANTI_UI_AI_SLOP_RUBRIC.md');
    const po = readWorkspaceFile('docs/process/PO_BUSINESS_READINESS_v1.4.0.md');
    if (!requireDeliverableOrDryRunSkip(t, /\|\s*`?PASS`?\s*\|/i.test(rubric) && !/\|\s*`?PENDING`?\s*\|/i.test(rubric) && !/\|\s*`?PENDING`?\s*\|/i.test(po) && !/\bTBD\b/i.test(rubric) && !/\bTBD\b/i.test(po), 'M6 audits not yet signed off')) {
      return;
    }
    for (const d of requiredDocs) {
      assertAntiAiSlop(readWorkspaceFile(d), { kind: 'docs', requireBrandTerms: true });
    }
    const htmls = listDocHtmlFiles();
    const allTargets = [...getSharedCorePaths(), ...listWorkspaceFiles('src'), '.env.development', ...htmls];
    const prodLeaks = scanFilesForProdLeak(allTargets, { allowExclusionMentions: true });
    assert.equal(prodLeaks.length, 0, JSON.stringify(prodLeaks));
    assert.ok(readWorkspaceFile('docs/html/04_sertifikasi_deployment.html').includes(DEV_REF));
    assert.equal(readWorkspaceFile('.env.development').includes(PROD_REF), false);
  });
});
