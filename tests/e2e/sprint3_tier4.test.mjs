import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  cleanupTestProduct,
  closeOpenedShiftSafely,
  closeShiftWithExpectedCash,
  createAnonClient,
  createTestProduct,
  ensureOpenShift,
  getBaseUrlOrSkip,
  getOptionalRoleCredentials,
  importWorkspaceModule,
  loadDevEnv,
  makeRunTag,
  parseCsvRoundTrip,
  requireAuthSessions,
  restoreStoreSettings,
  snapshotStoreSettings,
  workspacePath,
} from './helpers.mjs';

loadDevEnv();

describe('Tier 4 — Real-World Application Workloads & Regression (7 scenarios)', () => {
  it('T4-01: Promo bundle retail checkout -> stock/audit logs -> anon get_public_receipt', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    const anonClient = createAnonClient();
    const snapshot = await snapshotStoreSettings(ownerClient);
    let prodA = null;
    let prodB = null;
    let shiftState = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({
          store_name: '[E2E] Toko Promo Bundle',
          tax_enabled: true,
          tax_rate: 11,
        })
        .eq('id', 1);

      prodA = await createTestProduct(ownerClient, `${runTag}-A`, {
        name: `[E2E] Beras Premium ${runTag}`,
        buy_price: 12000,
        sell_price: 20000,
        stock: 10,
      });
      prodB = await createTestProduct(ownerClient, `${runTag}-B`, {
        name: `[E2E] Minyak Goreng ${runTag}`,
        buy_price: 9000,
        sell_price: 15000,
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-W1`;
      // 2x 20000 (-10% = 36000) + 1x 15000 (-2500 = 12500) => subtotal 48500
      // order discount 3500 => afterDiscount 45000 => 11% tax 4950 => total 49950
      const { data: sale, error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [
          {
            product_id: prodA.id,
            qty: 2,
            discount_type: 'percent',
            discount_value: 10,
          },
          {
            product_id: prodB.id,
            qty: 1,
            discount_type: 'nominal',
            discount_value: 2500,
          },
        ],
        p_discount_type: 'nominal',
        p_discount_value: 3500,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null, `Checkout failed: ${saleErr?.message}`);
      assert.equal(Number(sale.transaction.subtotal_amount), 48500);
      assert.equal(Number(sale.transaction.discount_amount), 3500);
      assert.equal(Number(sale.transaction.tax_amount), 4950);
      assert.equal(Number(sale.transaction.total_amount), 49950);
      assert.equal(Number(sale.transaction.change_amount), 50);

      const { data: pA } = await ownerClient
        .from('products')
        .select('stock')
        .eq('id', prodA.id)
        .single();
      const { data: pB } = await ownerClient
        .from('products')
        .select('stock')
        .eq('id', prodB.id)
        .single();
      assert.equal(pA.stock, 8);
      assert.equal(pB.stock, 4);

      const { data: stockLogs, error: logsErr } = await ownerClient
        .from('stock_logs')
        .select('product_id, type, qty, note')
        .in('product_id', [prodA.id, prodB.id]);
      assert.equal(logsErr, null, `stock_logs query failed: ${logsErr?.message}`);
      const saleLogA = (stockLogs || []).find(
        (l) => l.product_id === prodA.id && l.type === 'sale'
      );
      const saleLogB = (stockLogs || []).find(
        (l) => l.product_id === prodB.id && l.type === 'sale'
      );
      assert.ok(saleLogA && Number(saleLogA.qty) === -2, 'Expected -2 sale stock_log for prodA');
      assert.ok(saleLogB && Number(saleLogB.qty) === -1, 'Expected -1 sale stock_log for prodB');

      const { data: receipt, error: recErr } = await anonClient.rpc(
        'get_public_receipt',
        { p_invoice: inv }
      );
      assert.equal(recErr, null);
      assert.equal(Number(receipt.total_amount), 49950);
      assert.equal(receipt.store_settings.store_name, '[E2E] Toko Promo Bundle');
      assert.equal(receipt.items.length, 2);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (prodA) await cleanupTestProduct(ownerClient, prodA.id);
      if (prodB) await cleanupTestProduct(ownerClient, prodB.id);
    }
  });

  it('T4-02: Tax-exempt transaction and 100% promo voucher zero-total checkout', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    let product = null;
    let shiftState = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({ tax_enabled: true, tax_rate: 11 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 25000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const { data: exempt, error: exErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-EXEMPT`,
        p_payment_method: 'qris',
        p_cash_received: 50000,
        p_items: [{ product_id: product.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(exErr, null, `Tax-exempt sale failed: ${exErr?.message}`);
      assert.equal(Number(exempt.transaction.tax_amount), 0);
      assert.equal(Number(exempt.transaction.total_amount), 50000);

      const { data: freeTx, error: freeErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-FREE`,
        p_payment_method: 'cash',
        p_cash_received: 0,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'percent',
        p_discount_value: 100,
        p_apply_tax: true,
      });
      assert.equal(freeErr, null, `100% promo sale failed: ${freeErr?.message}`);
      assert.equal(Number(freeTx.transaction.total_amount), 0);
      assert.equal(Number(freeTx.transaction.tax_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T4-03: Multi-item Excel-ready Sales & Stock Mutation CSV audit export (26 rows + RFC4180 round-trip)', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');

    const salesHeaders = [
      'Invoice',
      'Tanggal',
      'Kasir',
      'Produk',
      'Subtotal',
      'Diskon',
      'Pajak',
      'Total',
    ];
    const adversarialPayloads = [
      '=SUM(A1:A10)',
      '+628123456789',
      '-100+20',
      '@IMPORTXML("http://evil")',
      '  =CMD()',
      '\t+1',
      '\r@SUM(1)',
      'Kopi, Susu "Gula Aren"',
      'Teh Tarik\nDingin',
      '=HYPERLINK("http://x","Klik, Disini")',
    ];

    const salesRows = [];
    for (let i = 0; i < 26; i += 1) {
      const itemName = adversarialPayloads[i % adversarialPayloads.length];
      const cashierName = i % 2 === 0 ? 'Budi, "Kasir"' : '@AdminKasir';
      salesRows.push([
        `INV-20261124-0000${String(i).padStart(2, '0')}-100`,
        '2026-11-24T10:00:00Z',
        cashierName,
        itemName,
        30000,
        5000,
        2750,
        27750,
      ]);
    }

    const salesCsv = buildCsvString(salesHeaders, salesRows);
    assert.equal(salesCsv.charCodeAt(0), 0xfeff, 'Sales CSV must start with UTF-8 BOM');
    assert.ok(salesCsv.includes('\r\n'), 'Sales CSV must use CRLF line endings');

    const parsedSales = parseCsvRoundTrip(salesCsv);
    assert.equal(parsedSales.length, 27, 'Expected 1 header + 26 sales data rows');
    assert.deepEqual(parsedSales[0], salesHeaders);

    for (let r = 1; r < parsedSales.length; r += 1) {
      for (const cell of parsedSales[r]) {
        const trimmed = cell.replace(/^[\s\t\r]+/, '');
        if (trimmed.length > 0) {
          assert.equal(
            /^[=+\-@]/.test(trimmed),
            false,
            `Unescaped formula trigger in Sales CSV row ${r}: ${JSON.stringify(cell)}`
          );
        }
      }
    }

    const stockHeaders = ['Tanggal', 'Barcode', 'Produk', 'Tipe', 'Qty', 'Catatan'];
    const stockRows = [];
    for (let i = 0; i < 26; i += 1) {
      stockRows.push([
        '2026-11-24T11:00:00Z',
        `BC-${i}`,
        adversarialPayloads[i % adversarialPayloads.length],
        i % 2 === 0 ? 'out' : 'in',
        i % 2 === 0 ? '-5' : '10',
        i % 3 === 0 ? '=CMD|"/C calc"!A0' : 'Restock "Mingguan", Gudang A',
      ]);
    }

    const stockCsv = buildCsvString(stockHeaders, stockRows);
    assert.equal(stockCsv.charCodeAt(0), 0xfeff);
    const parsedStock = parseCsvRoundTrip(stockCsv);
    assert.equal(parsedStock.length, 27);
    for (let r = 1; r < parsedStock.length; r += 1) {
      for (const cell of parsedStock[r]) {
        const trimmed = cell.replace(/^[\s\t\r]+/, '');
        if (trimmed.length > 0) {
          assert.equal(
            /^[=+\-@]/.test(trimmed),
            false,
            `Unescaped formula trigger in Stock CSV row ${r}: ${JSON.stringify(cell)}`
          );
        }
      }
    }
  });

  it('T4-04: store_settings update reflects immediately in get_public_receipt while historical tax stays immutable', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    const anonClient = createAnonClient();
    const snapshot = await snapshotStoreSettings(ownerClient);
    let product = null;
    let shiftState = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({
          store_name: '[E2E] Toko Awal',
          footer_note: 'Footer Awal',
          tax_enabled: true,
          tax_rate: 11,
        })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 10000,
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-IMM`;
      const { error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null);

      await ownerClient
        .from('store_settings')
        .update({
          store_name: '[E2E] Toko Baru',
          footer_note: 'Promo Akhir Bulan',
          tax_enabled: false,
          tax_rate: 0,
        })
        .eq('id', 1);

      const { data: receipt, error: recErr } = await anonClient.rpc(
        'get_public_receipt',
        { p_invoice: inv }
      );
      assert.equal(recErr, null);
      assert.equal(receipt.store_settings.store_name, '[E2E] Toko Baru');
      assert.equal(receipt.store_settings.footer_note, 'Promo Akhir Bulan');
      // Historical tax snapshot remains immutable
      assert.equal(Number(receipt.tax_rate), 11);
      assert.equal(Number(receipt.tax_amount), 1100);
      assert.equal(Number(receipt.total_amount), 11100);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T4-05: React Native Sprint 4 pure-core end-to-end pipeline in isolated Node child process without DOM globals', () => {
    const script = `
      for (const name of ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'Blob']) {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          get() { throw new Error('DOM global accessed in RN runtime: ' + name); }
        });
      }
      const pos = await import(${JSON.stringify(pathToFileURL(workspacePath('src/types/pos.ts')).href)});
      const fmt = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/format.ts')).href)});
      const i18n = await import(${JSON.stringify(pathToFileURL(workspacePath('src/i18n/translations.ts')).href)});
      const pricing = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/pricing.ts')).href)});
      const csv = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/csv.ts')).href)});

      if (!pos.isAdminRole('admin') || pos.isAdminRole('user')) {
        throw new Error('Dual-role helper failed in RN child process');
      }
      const calcFn =
        pricing.calculateOrderPricing ||
        pricing.calculateSalePricing ||
        pricing.calculateCartPricing ||
        Object.values(pricing).find((v) => typeof v === 'function' && /order|sale|cart/i.test(v.name || ''));
      if (!calcFn) throw new Error('No pricing function exported');
      const items = [{ sell_price: 20000, price: 20000, qty: 2, discount_type: 'percent', discount_value: 10, discountType: 'percent', discountValue: 10 }];
      const res = calcFn.length >= 2
        ? calcFn(items, { type: 'nominal', value: 1000 }, { tax_enabled: true, tax_rate: 11 }, true)
        : calcFn({ items, orderDiscountType: 'nominal', orderDiscountValue: 1000, discountType: 'nominal', discountValue: 1000, storeSettings: { tax_enabled: true, tax_rate: 11 }, taxEnabled: true, taxRate: 11, applyTax: true });
      const total = Number(res.totalAmount ?? res.total_amount);
      if (total !== 38850) throw new Error('Unexpected RN pricing total: ' + total);
      const inv = fmt.generateInvoiceNumber();
      const formatted = fmt.formatRupiah(total);
      const dt = fmt.formatDateTime('2026-11-24T06:00:00Z');
      const tm = fmt.formatClockTime('2026-11-24T09:05:03');
      if (typeof dt !== 'string' || dt.length < 4) throw new Error('formatDateTime failed in RN');
      if (tm !== '09:05:03') throw new Error('formatClockTime failed in RN');
      if (csv.sanitizeCsvCell('=CMD()') !== "'=CMD()") throw new Error('sanitizeCsvCell failed in RN');
      if (csv.escapeCsvField('Toko, "RN"') !== '"Toko, ""RN"""') throw new Error('escapeCsvField failed in RN');
      const label = i18n.translations.en.tabs.settings;
      const outCsv = csv.buildCsvString(['Invoice', 'Time', 'Label', 'Total'], [[inv, tm, label, formatted]]);
      if (!outCsv.startsWith('\\uFEFF')) throw new Error('Missing BOM in RN CSV output');
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: workspacePath('.'),
      stdio: 'pipe',
    });
  });

  it('T4-06: Mixed-payment shift lifecycle (cash + qris + petty cash IN/OUT) -> close_shift reconciliation', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;

    const { data: existingShift } = await kasirClient
      .from('shifts')
      .select('id')
      .eq('cashier_id', sessions.kasir.user.id)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (existingShift) {
      t.skip('Kasir already has an active OPEN shift; skipping shift lifecycle test');
      return;
    }

    const runTag = makeRunTag();
    const snapshot = await snapshotStoreSettings(ownerClient);
    let product = null;
    let shift = null;
    let shiftClosed = false;

    try {
      await ownerClient
        .from('store_settings')
        .update({ tax_enabled: true, tax_rate: 10 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 10000,
        stock: 20,
      });

      const opened = await ensureOpenShift(
        kasirClient,
        sessions.kasir.user.id,
        50000
      );
      shift = opened.shift;

      // Cash sale: 20000 - 2000 = 18000 + 10% (1800) = 19800
      const { error: cErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-CASH`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 2000,
        p_apply_tax: true,
      });
      assert.equal(cErr, null);

      // QRIS sale: excluded from expected_cash
      const { error: qErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-QRIS`,
        p_payment_method: 'qris',
        p_cash_received: 11000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(qErr, null);

      // Petty cash IN 15000, OUT 5000
      const { error: pcErr } = await kasirClient.from('petty_cash_logs').insert([
        {
          shift_id: shift.id,
          cashier_id: sessions.kasir.user.id,
          type: 'IN',
          amount: 15000,
          category: 'Modal Tambahan',
          description: '[E2E] IN',
        },
        {
          shift_id: shift.id,
          cashier_id: sessions.kasir.user.id,
          type: 'OUT',
          amount: 5000,
          category: 'Operasional',
          description: '[E2E] OUT',
        },
      ]);
      assert.equal(pcErr, null, `Petty cash insert failed: ${pcErr?.message}`);

      const closed = await closeShiftWithExpectedCash(kasirClient, shift);
      shiftClosed = true;
      assert.equal(closed.status, 'CLOSED');
      // 50000 + 19800 + 15000 - 5000 = 79800
      assert.equal(Number(closed.expected_cash), 79800);
      assert.equal(Number(closed.discrepancy), 0);
    } finally {
      if (shift && !shiftClosed) {
        try {
          await closeShiftWithExpectedCash(kasirClient, shift);
        } catch {
          // Preserve primary test failure
        }
      }
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T4-07: v1.0.0-v1.2.0 security & auth regression sweep + optional live HTTP Next.js smoke', async (t) => {
    const anonClient = createAnonClient();

    const { data: hasOwner, error: hoErr } = await anonClient.rpc('has_any_owner');
    assert.equal(hoErr, null);
    assert.equal(typeof hasOwner, 'boolean');

    const { error: storeAnonErr } = await anonClient
      .from('store_settings')
      .select('*')
      .limit(1);
    assert.ok(storeAnonErr !== null, 'Expected anon SELECT on store_settings to be denied');
    assert.notEqual(storeAnonErr.code, 'PGRST205');
    assert.notEqual(storeAnonErr.code, '42P01');

    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);

    const { data: emailPass, error: emailErr } = await anonClient.rpc(
      'resolve_login_email',
      { p_identifier: '  Regression@PosRetail.Test  ' }
    );
    assert.equal(emailErr, null);
    assert.equal(emailPass, 'regression@posretail.test');

    const ownerCreds = getOptionalRoleCredentials('owner');
    if (ownerCreds && !ownerCreds.identifier.includes('@')) {
      const { data: resolvedOwner, error: resErr } = await anonClient.rpc(
        'resolve_login_email',
        { p_identifier: ownerCreds.identifier }
      );
      assert.equal(resErr, null);
      assert.ok(typeof resolvedOwner === 'string' && resolvedOwner.includes('@'));
    }

    const { data: noUser, error: noUserErr } = await anonClient.rpc(
      'resolve_login_email',
      { p_identifier: 'nonexistent_e2e_user_xyz' }
    );
    assert.equal(noUserErr, null);
    assert.equal(noUser, null);

    const { data: missingReceipt, error: recErr } = await anonClient.rpc(
      'get_public_receipt',
      { p_invoice: 'INV-NONEXISTENT-999' }
    );
    assert.equal(recErr, null);
    assert.equal(missingReceipt, null);

    const { error: psErr } = await anonClient.rpc('process_sale', {
      p_invoice_number: 'INV-E2E-ANON',
      p_payment_method: 'cash',
      p_cash_received: 10000,
      p_items: [],
    });
    assert.ok(psErr !== null);

    const { error: csErr } = await anonClient.rpc('close_shift', {
      p_shift_id: '00000000-0000-0000-0000-000000000000',
      p_actual_cash: 0,
      p_notes: 'anon regression',
    });
    assert.ok(csErr !== null);

    const { data: versions, error: verErr } = await anonClient
      .from('app_versions')
      .select('version');
    assert.equal(verErr, null);
    const verList = (versions || []).map((v) => v.version);
    for (const v of ['1.0.0', '1.1.0', '1.2.0', '1.3.0']) {
      assert.ok(verList.includes(v), `Expected version ${v} in app_versions`);
    }

    await t.test('optional live HTTP Next.js route smoke (/ and /receipt/INV-NONEXISTENT-999)', async (sub) => {
      const baseUrl = getBaseUrlOrSkip(sub);
      if (!baseUrl) return;

      const homeRes = await fetch(`${baseUrl}/`);
      assert.equal(homeRes.status, 200);
      const homeHtml = await homeRes.text();
      assert.ok(homeHtml.includes('<html') || homeHtml.includes('<!DOCTYPE html'));

      const recRes = await fetch(`${baseUrl}/receipt/INV-NONEXISTENT-999`);
      assert.equal(recRes.status, 200);
    });
  });
});
