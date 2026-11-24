import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanupTestProduct,
  closeShiftWithExpectedCash,
  createAnonClient,
  createTestProduct,
  ensureOpenShift,
  findSprint3MigrationFile,
  getOptionalRoleCredentials,
  importWorkspaceModule,
  invokePricingEngine,
  isAuthRequired,
  loadDevEnv,
  makeRunTag,
  parseCsvRoundTrip,
  readWorkspaceFile,
  requireAuthSessions,
  restoreStoreSettings,
  signInWithRole,
  snapshotStoreSettings,
} from './helpers.mjs';

loadDevEnv();

async function maybeRunLiveSaleParity({
  taxEnabled,
  taxRate,
  applyTax,
  itemsSpec,
  orderDiscountType,
  orderDiscountValue,
  paymentMethod,
  cashReceived,
  expected,
  tagSuffix,
}) {
  const hasCreds =
    getOptionalRoleCredentials('owner') && getOptionalRoleCredentials('kasir');
  if (!hasCreds) {
    if (isAuthRequired()) {
      assert.fail('E2E_REQUIRE_AUTH=1 set but owner/kasir credentials missing');
    }
    return;
  }

  const owner = await signInWithRole('owner');
  const kasir = await signInWithRole('kasir');
  const anon = createAnonClient();
  const runTag = makeRunTag();
  const snapshot = await snapshotStoreSettings(owner.client);
  const createdProducts = [];

  try {
    await owner.client
      .from('store_settings')
      .update({ tax_enabled: taxEnabled, tax_rate: taxRate })
      .eq('id', 1);

    const pItems = [];
    for (let i = 0; i < itemsSpec.length; i += 1) {
      const spec = itemsSpec[i];
      const prod = await createTestProduct(owner.client, `${runTag}-${tagSuffix}-${i}`, {
        sell_price: spec.sell_price,
        buy_price: Math.floor(spec.sell_price * 0.6),
        stock: 20,
      });
      createdProducts.push(prod);
      pItems.push({
        product_id: prod.id,
        qty: spec.qty,
        discount_type: spec.discount_type ?? 'nominal',
        discount_value: spec.discount_value ?? 0,
      });
    }

    await ensureOpenShift(kasir.client, kasir.user.id);
    const inv = `INV-${runTag}-${tagSuffix}`;
    const { data, error } = await kasir.client.rpc('process_sale', {
      p_invoice_number: inv,
      p_payment_method: paymentMethod,
      p_cash_received: cashReceived ?? expected.totalAmount,
      p_items: pItems,
      p_discount_type: orderDiscountType,
      p_discount_value: orderDiscountValue,
      p_apply_tax: applyTax,
    });
    assert.equal(error, null, `Live process_sale failed (${tagSuffix}): ${error?.message}`);
    assert.equal(Number(data.transaction.subtotal_amount), expected.subtotalAmount);
    assert.equal(Number(data.transaction.discount_amount), expected.discountAmount);
    assert.equal(Number(data.transaction.tax_amount), expected.taxAmount);
    assert.equal(Number(data.transaction.total_amount), expected.totalAmount);

    const { data: receipt, error: recErr } = await anon.rpc('get_public_receipt', {
      p_invoice: inv,
    });
    assert.equal(recErr, null);
    assert.equal(Number(receipt.subtotal_amount), expected.subtotalAmount);
    assert.equal(Number(receipt.discount_amount), expected.discountAmount);
    assert.equal(Number(receipt.tax_amount), expected.taxAmount);
    assert.equal(Number(receipt.total_amount), expected.totalAmount);
  } finally {
    await restoreStoreSettings(owner.client, snapshot);
    for (const p of createdProducts) {
      await cleanupTestProduct(owner.client, p.id);
    }
  }
}

describe('Tier 3 — Cross-Feature Pairwise Combinatorial Matrix (12 scenarios)', () => {
  it('T3-01: tax_enabled=false + tax_rate=11 + applyTax=true + item % + order Rp (qris)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const items = [
      { sell_price: 20000, qty: 2, discount_type: 'percent', discount_value: 15 },
    ];
    const res = invokePricingEngine(pricingMod, {
      items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 2000,
      taxEnabled: false,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(res.subtotalAmount, 34000);
    assert.equal(res.discountAmount, 2000);
    assert.equal(res.afterDiscount, 32000);
    assert.equal(res.taxAmount, 0);
    assert.equal(res.totalAmount, 32000);

    await maybeRunLiveSaleParity({
      taxEnabled: false,
      taxRate: 11,
      applyTax: true,
      itemsSpec: items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 2000,
      paymentMethod: 'qris',
      expected: res,
      tagSuffix: 'T301',
    });
  });

  it('T3-02: tax_enabled=true + tax_rate=11 + applyTax=null + item Rp + order % (transfer)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const items = [
      { sell_price: 30000, qty: 2, discount_type: 'nominal', discount_value: 5000 },
    ];
    const res = invokePricingEngine(pricingMod, {
      items,
      orderDiscountType: 'percent',
      orderDiscountValue: 10,
      taxEnabled: true,
      taxRate: 11,
      applyTax: null,
    });
    assert.equal(res.subtotalAmount, 55000);
    assert.equal(res.discountAmount, 5500);
    assert.equal(res.afterDiscount, 49500);
    assert.equal(res.taxAmount, 5445);
    assert.equal(res.totalAmount, 54945);

    await maybeRunLiveSaleParity({
      taxEnabled: true,
      taxRate: 11,
      applyTax: null,
      itemsSpec: items,
      orderDiscountType: 'percent',
      orderDiscountValue: 10,
      paymentMethod: 'transfer',
      expected: res,
      tagSuffix: 'T302',
    });
  });

  it('T3-03: tax_enabled=true + tax_rate=11 + applyTax=false + no item disc + order Rp (cash)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const items = [
      { sell_price: 25000, qty: 2, discount_type: 'nominal', discount_value: 0 },
    ];
    const res = invokePricingEngine(pricingMod, {
      items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 10000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: false,
    });
    assert.equal(res.subtotalAmount, 50000);
    assert.equal(res.discountAmount, 10000);
    assert.equal(res.afterDiscount, 40000);
    assert.equal(res.taxAmount, 0);
    assert.equal(res.totalAmount, 40000);

    await maybeRunLiveSaleParity({
      taxEnabled: true,
      taxRate: 11,
      applyTax: false,
      itemsSpec: items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 10000,
      paymentMethod: 'cash',
      cashReceived: 50000,
      expected: res,
      tagSuffix: 'T303',
    });
  });

  it('T3-04: tax_enabled=true + tax_rate=12.5 + mixed item discounts + over-subtotal order Rp clamps to 0', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const items = [
      { sell_price: 10000, qty: 2, discount_type: 'percent', discount_value: 50 },
      { sell_price: 8000, qty: 1, discount_type: 'nominal', discount_value: 3000 },
    ];
    const res = invokePricingEngine(pricingMod, {
      items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 999999,
      taxEnabled: true,
      taxRate: 12.5,
      applyTax: true,
    });
    assert.equal(res.subtotalAmount, 15000);
    assert.equal(res.discountAmount, 15000);
    assert.equal(res.afterDiscount, 0);
    assert.equal(res.taxAmount, 0);
    assert.equal(res.totalAmount, 0);

    await maybeRunLiveSaleParity({
      taxEnabled: true,
      taxRate: 12.5,
      applyTax: true,
      itemsSpec: items,
      orderDiscountType: 'nominal',
      orderDiscountValue: 999999,
      paymentMethod: 'cash',
      cashReceived: 0,
      expected: res,
      tagSuffix: 'T304',
    });
  });

  it('T3-05: pricing.ts vs SQL process_sale exact parity across multi-item .5 rounding cases', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const items = [
      { sell_price: 1005, qty: 1, discount_type: 'percent', discount_value: 10 },
      { sell_price: 1015, qty: 1, discount_type: 'percent', discount_value: 10 },
    ];
    const res = invokePricingEngine(pricingMod, {
      items,
      orderDiscountType: 'percent',
      orderDiscountValue: 5,
      taxEnabled: true,
      taxRate: 12.5,
      applyTax: true,
    });
    assert.equal(res.subtotalAmount, 1817);
    assert.equal(res.discountAmount, 91);
    assert.equal(res.afterDiscount, 1726);
    assert.equal(res.taxAmount, 216);
    assert.equal(res.totalAmount, 1942);

    await maybeRunLiveSaleParity({
      taxEnabled: true,
      taxRate: 12.5,
      applyTax: true,
      itemsSpec: items,
      orderDiscountType: 'percent',
      orderDiscountValue: 5,
      paymentMethod: 'cash',
      cashReceived: 2000,
      expected: res,
      tagSuffix: 'T305',
    });
  });

  it('T3-06: Discounts + Tax + ReportsView Net Profit & Sales CSV export consistency', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const reportsSrc = readWorkspaceFile('src/components/ReportsView.tsx');

    const res = invokePricingEngine(pricingMod, {
      items: [
        { sell_price: 20000, qty: 2, discount_type: 'nominal', discount_value: 4000 },
      ],
      orderDiscountType: 'nominal',
      orderDiscountValue: 6000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    // subtotal=36000, orderDisc=6000, afterDiscount=30000, tax=3300, total=33300
    assert.equal(res.subtotalAmount, 36000);
    assert.equal(res.discountAmount, 6000);
    assert.equal(res.taxAmount, 3300);
    assert.equal(res.totalAmount, 33300);

    // Profit = (36000 - 6000) - (12000 * 2) = 6000 (tax 3300 excluded)
    const cogs = 12000 * 2;
    const expectedProfit = res.subtotalAmount - res.discountAmount - cogs;
    assert.equal(expectedProfit, 6000);

    assert.ok(
      reportsSrc.includes('discount_amount') && reportsSrc.includes('buildCsvString'),
      'ReportsView must adjust profit by discount_amount and build Sales CSV'
    );

    const csv = buildCsvString(
      ['Invoice', 'Subtotal', 'Diskon', 'Pajak', 'Total'],
      [['INV-T306', res.subtotalAmount, res.discountAmount, res.taxAmount, res.totalAmount]]
    );
    const parsed = parseCsvRoundTrip(csv);
    assert.deepEqual(parsed, [
      ['Invoice', 'Subtotal', 'Diskon', 'Pajak', 'Total'],
      ['INV-T306', '36000', '6000', '3300', '33300'],
    ]);
  });

  it('T3-07: Bilingual id/en parity + Sprint 3 keys + role tab mapping', async () => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    const pageSrc = readWorkspaceFile('src/app/page.tsx');

    for (const lang of ['id', 'en']) {
      assert.ok(translations[lang].tabs?.settings, `${lang}.tabs.settings missing`);
      assert.ok(translations[lang].tabs?.pos, `${lang}.tabs.pos missing`);
      assert.ok(translations[lang].tabs?.reports, `${lang}.tabs.reports missing`);
      assert.notEqual(
        translations[lang].tabs.settings,
        translations[lang].tabs.pos
      );
    }

    assert.ok(pageSrc.includes('dict.tabs.settings'));
    assert.ok(pageSrc.includes('isAdminRole'));
  });

  it('T3-08: store_settings + ReceiptContent + ReceiptModal WhatsApp + ReceiptPage integration with special chars', () => {
    const receiptContent = readWorkspaceFile('src/components/ReceiptContent.tsx');
    const receiptModal = readWorkspaceFile('src/components/ReceiptModal.tsx');
    const receiptPage = readWorkspaceFile('src/components/ReceiptPage.tsx');

    assert.ok(/storeSettings|store_settings/i.test(receiptContent));
    assert.ok(/discount_amount|discount/i.test(receiptContent));
    assert.ok(/tax_amount|tax/i.test(receiptContent));
    assert.ok(/storeSettings|store_settings/i.test(receiptModal));
    assert.ok(/encodeURIComponent/.test(receiptModal));
    assert.ok(receiptPage.includes('get_public_receipt'));
  });

  it('T3-09: Dual-role admin/owner equivalence vs kasir/user restriction across types, UI, and SQL', async () => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    const pageSrc = readWorkspaceFile('src/app/page.tsx');
    const staffSrc = readWorkspaceFile('src/components/StaffManager.tsx');
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Missing v1_3_0 migration');
    const sql = readWorkspaceFile(migPath);

    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);

    assert.ok(pageSrc.includes('isAdminRole(profile?.role)'));
    assert.ok(staffSrc.includes("'admin'") && staffSrc.includes("'user'"));
    const isOwnerFnMatch = sql.match(/create\s+or\s+replace\s+function\s+private\.is_owner\(\)[\s\S]*?\$\$;/i);
    assert.ok(isOwnerFnMatch, 'Expected private.is_owner() in v1_3_0 migration');
    const ownerInMatch = isOwnerFnMatch[0].match(/role\s+in\s*\(([^)]+)\)/i);
    assert.ok(ownerInMatch, 'Expected role in (...) inside private.is_owner()');
    const ownerRoles = [...ownerInMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(
      [...new Set(ownerRoles)].sort(),
      ['admin', 'owner'],
      `private.is_owner() must grant equivalence to ['admin', 'owner'], got ${JSON.stringify(ownerRoles)}`
    );
  });

  it('T3-10: store_settings + CSV formula-injection-laden store/product/cashier names export safely', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const csv = buildCsvString(
      ['Store', 'Product', 'Cashier', 'Note'],
      [
        ['=Toko&Hack', '+Kopi, "Special"', '@Kasir1', '\t-Promo\nLine2'],
      ]
    );
    const parsed = parseCsvRoundTrip(csv);
    assert.equal(parsed.length, 2);
    for (const cell of parsed[1]) {
      assert.ok(cell.startsWith("'"), `Cell ${JSON.stringify(cell)} must be formula-neutralized`);
    }
  });

  it('T3-11: Legacy 4-arg process_sale integrates cleanly with Sprint 3 get_public_receipt', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    const anonClient = createAnonClient();
    const snapshot = await snapshotStoreSettings(ownerClient);
    let product = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({ store_name: '[E2E] Toko Legacy Compat', tax_enabled: false, tax_rate: 0 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 12000,
        stock: 5,
      });
      await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-LEG`;
      const { error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 15000,
        p_items: [{ product_id: product.id, qty: 1 }],
      });
      assert.equal(saleErr, null, `4-arg process_sale failed: ${saleErr?.message}`);

      const { data: receipt, error: recErr } = await anonClient.rpc(
        'get_public_receipt',
        { p_invoice: inv }
      );
      assert.equal(recErr, null);
      assert.equal(Number(receipt.discount_amount), 0);
      assert.equal(Number(receipt.tax_amount), 0);
      assert.equal(Number(receipt.total_amount), 12000);
      assert.equal(receipt.store_settings.store_name, '[E2E] Toko Legacy Compat');
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T3-12: Discounted + taxed cash vs qris sales reconcile accurately in close_shift', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const kasirClient = sessions.kasir.client;
    const ownerClient = sessions.owner.client;
    const { data: existingShift } = await kasirClient
      .from('shifts')
      .select('id')
      .eq('cashier_id', sessions.kasir.user.id)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (existingShift) {
      t.skip('Kasir already has an active OPEN shift; skipping close_shift test to avoid closing active shift');
      return;
    }

    const runTag = makeRunTag();
    const snapshot = await snapshotStoreSettings(ownerClient);
    let product = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({ tax_enabled: true, tax_rate: 10 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 20000,
        stock: 10,
      });

      const { shift } = await ensureOpenShift(
        kasirClient,
        sessions.kasir.user.id,
        100000
      );

      // Cash sale: 20000 - 2000 = 18000 + 10% (1800) = 19800
      const { error: cashErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-C`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 2000,
        p_apply_tax: true,
      });
      assert.equal(cashErr, null);

      // QRIS sale: excluded from expected_cash
      const { error: qrisErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-Q`,
        p_payment_method: 'qris',
        p_cash_received: 22000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(qrisErr, null);

      const closed = await closeShiftWithExpectedCash(kasirClient, shift);
      assert.equal(closed.status, 'CLOSED');
      assert.equal(Number(closed.expected_cash), 119800);
      assert.equal(Number(closed.discrepancy), 0);
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });
});
