import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanupTestProduct,
  closeOpenedShiftSafely,
  createAnonClient,
  createTestProduct,
  ensureOpenShift,
  findSprint3MigrationFile,
  importWorkspaceModule,
  invokePricingEngine,
  listWorkspaceFiles,
  loadDevEnv,
  makeRunTag,
  readWorkspaceFile,
  requireAuthSessions,
  restoreStoreSettings,
  snapshotStoreSettings,
  workspaceFileExists,
} from './helpers.mjs';

loadDevEnv();

describe('Tier 1 — F1: public.store_settings + RLS (6 tests)', () => {
  it('T1-F1-01: owner can read singleton store_settings row (id=1)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { data, error } = await sessions.owner.client
      .from('store_settings')
      .select('*');
    assert.equal(error, null, `Owner read failed: ${error?.message}`);
    assert.ok(Array.isArray(data) && data.length === 1, 'Expected singleton row');
    assert.equal(data[0].id, 1);
    assert.equal(typeof data[0].store_name, 'string');
    assert.ok(data[0].store_name.trim().length > 0);
    assert.equal(typeof data[0].tax_enabled, 'boolean');
    assert.ok(Number(data[0].tax_rate) >= 0 && Number(data[0].tax_rate) <= 100);
  });

  it('T1-F1-02: kasir can read singleton store_settings row (id=1)', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;

    const { data, error } = await sessions.kasir.client
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
    assert.equal(error, null, `Kasir read failed: ${error?.message}`);
    assert.equal(data.id, 1);
    assert.ok(String(data.store_name).trim().length > 0);
  });

  it('T1-F1-03: owner can update store profile fields and restore original snapshot', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      const payload = {
        store_name: '[E2E] Toko Maju Jaya',
        address: 'Jl. Pengujian No. 99',
        phone: '0811-9999-0001',
        footer_note: 'Struk E2E Terima Kasih',
      };
      const { data, error } = await ownerClient
        .from('store_settings')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();
      assert.equal(error, null, `Owner profile update failed: ${error?.message}`);
      assert.equal(data.store_name, payload.store_name);
      assert.equal(data.address, payload.address);
      assert.equal(data.phone, payload.phone);
      assert.equal(data.footer_note, payload.footer_note);
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });

  it('T1-F1-04: owner can enable optional tax (tax_enabled=true, tax_rate=11)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      const { data, error } = await ownerClient
        .from('store_settings')
        .update({ tax_enabled: true, tax_rate: 11 })
        .eq('id', 1)
        .select()
        .single();
      assert.equal(error, null, `Tax enable failed: ${error?.message}`);
      assert.equal(data.tax_enabled, true);
      assert.equal(Number(data.tax_rate), 11);
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });

  it('T1-F1-05: owner can disable optional tax (tax_enabled=false, tax_rate=0)', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      const { data, error } = await ownerClient
        .from('store_settings')
        .update({ tax_enabled: false, tax_rate: 0 })
        .eq('id', 1)
        .select()
        .single();
      assert.equal(error, null, `Tax disable failed: ${error?.message}`);
      assert.equal(data.tax_enabled, false);
      assert.equal(Number(data.tax_rate), 0);
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });

  it('T1-F1-06: owner update persists updated_by audit column', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      const { data, error } = await ownerClient
        .from('store_settings')
        .update({ updated_by: sessions.owner.user.id })
        .eq('id', 1)
        .select()
        .single();
      assert.equal(error, null, `updated_by update failed: ${error?.message}`);
      assert.equal(data.updated_by, sessions.owner.user.id);
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });
});

describe('Tier 1 — F2: transactions & transaction_items Discount/Tax Schema (5 tests)', () => {
  it('T1-F2-01: transactions table exposes all 6 Sprint 3 discount/tax columns', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { data, error } = await sessions.owner.client
      .from('transactions')
      .select(
        'id, subtotal_amount, discount_type, discount_value, discount_amount, tax_rate, tax_amount, total_amount'
      )
      .limit(5);
    assert.equal(error, null, `transactions schema select failed: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  it('T1-F2-02: transaction_items table exposes 3 Sprint 3 discount columns', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { data, error } = await sessions.owner.client
      .from('transaction_items')
      .select(
        'id, price, cost_price, qty, discount_type, discount_value, discount_amount, subtotal'
      )
      .limit(5);
    assert.equal(error, null, `transaction_items schema select failed: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  it('T1-F2-03: historical backfill keeps subtotal_amount equal to total_amount when discount=0 and tax=0', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { data, error } = await sessions.owner.client
      .from('transactions')
      .select('id, subtotal_amount, discount_amount, tax_amount, total_amount')
      .eq('discount_amount', 0)
      .eq('tax_amount', 0)
      .limit(10);
    assert.equal(error, null, `Backfill query failed: ${error?.message}`);
    for (const row of data || []) {
      assert.equal(
        Number(row.subtotal_amount),
        Number(row.total_amount),
        `Expected subtotal_amount === total_amount for zero-discount/tax row ${row.id}`
      );
    }
  });

  it('T1-F2-04: persisted transaction row records exact order discount and tax breakdown', async (t) => {
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
        buy_price: 10000,
        sell_price: 20000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F204`;
      const { error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: product.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 5000,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null, `process_sale failed: ${saleErr?.message}`);

      const { data: txRow, error: qErr } = await ownerClient
        .from('transactions')
        .select('*, transaction_items(*)')
        .eq('invoice_number', inv)
        .single();
      assert.equal(qErr, null, `Fetch persisted tx failed: ${qErr?.message}`);
      assert.equal(Number(txRow.subtotal_amount), 40000);
      assert.equal(txRow.discount_type, 'nominal');
      assert.equal(Number(txRow.discount_value), 5000);
      assert.equal(Number(txRow.discount_amount), 5000);
      assert.equal(Number(txRow.tax_rate), 11);
      assert.equal(Number(txRow.tax_amount), 3850);
      assert.equal(Number(txRow.total_amount), 38850);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T1-F2-05: transaction_items.subtotal stores net line total and snapshots cost_price', async (t) => {
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
        .update({ tax_enabled: false, tax_rate: 0 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        buy_price: 6500,
        sell_price: 10000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F205`;
      const { error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'qris',
        p_cash_received: 17000,
        p_items: [
          {
            product_id: product.id,
            qty: 2,
            discount_type: 'nominal',
            discount_value: 3000,
          },
        ],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: null,
      });
      assert.equal(saleErr, null, `process_sale failed: ${saleErr?.message}`);

      const { data: txRow, error: qErr } = await ownerClient
        .from('transactions')
        .select('id, subtotal_amount, total_amount, transaction_items(*)')
        .eq('invoice_number', inv)
        .single();
      assert.equal(qErr, null);
      assert.equal(txRow.transaction_items.length, 1);
      const item = txRow.transaction_items[0];
      assert.equal(item.discount_type, 'nominal');
      assert.equal(Number(item.discount_value), 3000);
      assert.equal(Number(item.discount_amount), 3000);
      assert.equal(Number(item.subtotal), 17000);
      assert.equal(Number(item.cost_price), 6500);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });
});

describe('Tier 1 — F3: Atomic process_sale & get_public_receipt RPCs (6 tests)', () => {
  it('T1-F3-01: backward-compatible 4-arg process_sale works without overload ambiguity', async (t) => {
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
        .update({ tax_enabled: false, tax_rate: 0 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 15000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F301`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: product.id, qty: 2 }],
      });
      assert.equal(error, null, `4-arg process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.subtotal_amount), 30000);
      assert.equal(Number(data.transaction.discount_amount), 0);
      assert.equal(Number(data.transaction.tax_amount), 0);
      assert.equal(Number(data.transaction.total_amount), 30000);
      assert.equal(Number(data.transaction.change_amount), 20000);

      const { data: updatedProd } = await ownerClient
        .from('products')
        .select('stock')
        .eq('id', product.id)
        .single();
      assert.equal(updatedProd.stock, 8);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T1-F3-02: process_sale computes mixed item percent + nominal discounts with QRIS', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    let prodA = null;
    let prodB = null;
    let shiftState = null;

    try {
      await ownerClient
        .from('store_settings')
        .update({ tax_enabled: false, tax_rate: 0 })
        .eq('id', 1);
      prodA = await createTestProduct(ownerClient, `${runTag}-A`, {
        sell_price: 10000,
        stock: 10,
      });
      prodB = await createTestProduct(ownerClient, `${runTag}-B`, {
        sell_price: 15000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F302`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'qris',
        p_cash_received: 30500,
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
        p_discount_value: 0,
        p_apply_tax: null,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.subtotal_amount), 30500);
      assert.equal(Number(data.transaction.total_amount), 30500);
      assert.equal(Number(data.transaction.cash_received), 30500);
      assert.equal(Number(data.transaction.change_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (prodA) await cleanupTestProduct(ownerClient, prodA.id);
      if (prodB) await cleanupTestProduct(ownerClient, prodB.id);
    }
  });

  it('T1-F3-03: process_sale applies order percent discount and 11% tax on transfer', async (t) => {
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
        sell_price: 50000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F303`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'transfer',
        p_cash_received: 88800,
        p_items: [{ product_id: product.id, qty: 2 }],
        p_discount_type: 'percent',
        p_discount_value: 20,
        p_apply_tax: true,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.subtotal_amount), 100000);
      assert.equal(Number(data.transaction.discount_amount), 20000);
      assert.equal(Number(data.transaction.tax_rate), 11);
      assert.equal(Number(data.transaction.tax_amount), 8800);
      assert.equal(Number(data.transaction.total_amount), 88800);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T1-F3-04: process_sale with p_apply_tax=null inherits store_settings.tax_enabled=true', async (t) => {
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
        .update({ tax_enabled: true, tax_rate: 10 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 25000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F304`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [{ product_id: product.id, qty: 2 }],
        p_discount_type: 'nominal',
        p_discount_value: 5000,
        p_apply_tax: null,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.subtotal_amount), 50000);
      assert.equal(Number(data.transaction.discount_amount), 5000);
      assert.equal(Number(data.transaction.tax_rate), 10);
      assert.equal(Number(data.transaction.tax_amount), 4500);
      assert.equal(Number(data.transaction.total_amount), 49500);
      assert.equal(Number(data.transaction.change_amount), 500);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T1-F3-05: process_sale with p_apply_tax=false opts out of tax when tax_enabled=true', async (t) => {
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
        sell_price: 20000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F305`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.tax_rate), 0);
      assert.equal(Number(data.transaction.tax_amount), 0);
      assert.equal(Number(data.transaction.total_amount), 20000);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T1-F3-06: anon get_public_receipt returns full Sprint 3 payload with store_settings', async (t) => {
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
          store_name: '[E2E] Toko Struk Publik',
          tax_enabled: true,
          tax_rate: 11,
        })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 10000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-F306`;
      const { error: saleErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [
          {
            product_id: product.id,
            qty: 2,
            discount_type: 'nominal',
            discount_value: 2000,
          },
        ],
        p_discount_type: 'nominal',
        p_discount_value: 3000,
        p_apply_tax: true,
      });
      assert.equal(saleErr, null, `process_sale failed: ${saleErr?.message}`);

      const { data: receipt, error: rpcErr } = await anonClient.rpc(
        'get_public_receipt',
        { p_invoice: inv }
      );
      assert.equal(rpcErr, null, `get_public_receipt failed: ${rpcErr?.message}`);
      assert.ok(receipt, 'Expected non-null receipt');
      assert.equal(receipt.invoice_number, inv);
      assert.equal(Number(receipt.subtotal_amount), 18000);
      assert.equal(Number(receipt.discount_amount), 3000);
      assert.equal(Number(receipt.tax_rate), 11);
      assert.equal(Number(receipt.tax_amount), 1650);
      assert.equal(Number(receipt.total_amount), 16650);
      assert.ok(Array.isArray(receipt.items) && receipt.items.length === 1);
      assert.equal(Number(receipt.items[0].discount_amount), 2000);
      assert.ok(receipt.store_settings, 'Expected store_settings in public receipt');
      assert.equal(receipt.store_settings.store_name, '[E2E] Toko Struk Publik');
      assert.equal(receipt.store_settings.tax_enabled, true);
      assert.equal(Number(receipt.store_settings.tax_rate), 11);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });
});

describe('Tier 1 — F4: app_versions 1.3.0 Row (5 tests)', () => {
  it('T1-F4-01: anon reads 1.3.0 row from public.app_versions', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('app_versions')
      .select('*')
      .eq('version', '1.3.0')
      .single();
    assert.equal(error, null, `Expected 1.3.0 in app_versions: ${error?.message}`);
    assert.equal(data.version, '1.3.0');
  });

  it('T1-F4-02: app_versions preserves complete lineage 1.0.0, 1.1.0, 1.2.0, 1.3.0', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('app_versions')
      .select('version');
    assert.equal(error, null, `app_versions select failed: ${error?.message}`);
    const versions = (data || []).map((row) => row.version);
    for (const v of ['1.0.0', '1.1.0', '1.2.0', '1.3.0']) {
      assert.ok(versions.includes(v), `Expected ${v} in ${JSON.stringify(versions)}`);
    }
  });

  it('T1-F4-03: app_versions 1.3.0 row has non-empty phase, notes, and valid released_at', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('app_versions')
      .select('version, phase, notes, released_at')
      .eq('version', '1.3.0')
      .single();
    assert.equal(error, null, `Query failed: ${error?.message}`);
    assert.ok(typeof data.phase === 'string' && data.phase.trim().length > 0);
    assert.ok(typeof data.notes === 'string' && data.notes.trim().length > 0);
    assert.ok(!Number.isNaN(Date.parse(data.released_at)), 'released_at must be valid ISO date');
  });

  it('T1-F4-04: authenticated user can read 1.3.0 row from app_versions', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { data, error } = await sessions.owner.client
      .from('app_versions')
      .select('version')
      .eq('version', '1.3.0')
      .single();
    assert.equal(error, null);
    assert.equal(data.version, '1.3.0');
  });

  it('T1-F4-05: app_versions contains exactly 1 row for version 1.3.0', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('app_versions')
      .select('version')
      .eq('version', '1.3.0');
    assert.equal(error, null);
    assert.equal(data.length, 1);
  });
});

describe('Tier 1 — F5: Tech Debt Cleanup & Shared Core Purity (6 tests)', () => {
  it('T1-F5-01: legacy Vite assets hero.png, react.svg, vite.svg are deleted', () => {
    for (const rel of [
      'src/assets/hero.png',
      'src/assets/react.svg',
      'src/assets/vite.svg',
    ]) {
      assert.equal(
        workspaceFileExists(rel),
        false,
        `Legacy Vite asset ${rel} should be removed`
      );
    }
  });

  it('T1-F5-02: zero references to deleted Vite assets exist in src/**', () => {
    const files = listWorkspaceFiles('src');
    assert.ok(files.length > 0);
    for (const rel of files) {
      if (!/\.(ts|tsx|js|mjs|css)$/i.test(rel)) continue;
      const content = readWorkspaceFile(rel);
      assert.equal(
        /hero\.png|react\.svg|vite\.svg/i.test(content),
        false,
        `Found forbidden legacy asset reference in ${rel}`
      );
    }
  });

  it('T1-F5-03: shared core modules contain zero browser, DOM, or Next.js APIs', () => {
    const coreFiles = [
      'src/types/pos.ts',
      'src/utils/format.ts',
      'src/i18n/translations.ts',
      'src/utils/pricing.ts',
      'src/utils/csv.ts',
    ];
    const forbiddenPattern =
      /\b(window|document|localStorage|sessionStorage|navigator|Blob|FileReader)\b|from\s+['"](next\/|react-dom|lucide-react|html5-qrcode)/;

    for (const rel of coreFiles) {
      assert.ok(workspaceFileExists(rel), `Missing shared core module ${rel}`);
      const content = readWorkspaceFile(rel);
      assert.equal(
        forbiddenPattern.test(content),
        false,
        `Forbidden browser/UI dependency found in ${rel}`
      );
    }
  });

  it('T1-F5-04: native Node ESM dynamic import succeeds on all 5 shared core modules', async () => {
    const pos = await importWorkspaceModule('src/types/pos.ts');
    const format = await importWorkspaceModule('src/utils/format.ts');
    const translations = await importWorkspaceModule('src/i18n/translations.ts');
    const pricing = await importWorkspaceModule('src/utils/pricing.ts');
    const csv = await importWorkspaceModule('src/utils/csv.ts');

    assert.ok(pos && typeof pos === 'object');
    assert.equal(typeof format.formatRupiah, 'function');
    assert.ok(translations.translations?.id && translations.translations?.en);
    assert.ok(Object.keys(pricing).length > 0);
    assert.equal(typeof csv.buildCsvString, 'function');
  });

  it('T1-F5-05: formatRupiah, formatDateTime, formatClockTime, and generateInvoiceNumber happy paths', async () => {
    const {
      formatRupiah,
      formatDateTime,
      formatClockTime,
      generateInvoiceNumber,
    } = await importWorkspaceModule('src/utils/format.ts');

    const norm = (s) => s.replace(/\u00a0/g, ' ');
    assert.equal(norm(formatRupiah(25000)), 'Rp 25.000');
    assert.ok(formatDateTime('2026-11-24T06:00:00Z').length > 4);
    assert.equal(formatClockTime('2026-11-24T09:05:03'), '09:05:03');
    assert.match(generateInvoiceNumber(), /^INV-\d{8}-\d{6}-\d{3}$/);
  });

  it('T1-F5-06: STORE_INFO fallback object exposes non-empty profile strings', async () => {
    const { STORE_INFO } = await importWorkspaceModule('src/utils/format.ts');
    assert.ok(STORE_INFO && typeof STORE_INFO === 'object');
    for (const key of ['name', 'address', 'phone', 'footerNote']) {
      assert.equal(typeof STORE_INFO[key], 'string');
      assert.ok(STORE_INFO[key].trim().length > 0, `STORE_INFO.${key} must be non-empty`);
    }
  });
});

describe('Tier 1 — F6: Store Settings UI & App-Wide Integration (6 tests)', () => {
  it('T1-F6-01: StoreSettingsForm.tsx exists with store profile, tax inputs, and save action', () => {
    const rel = 'src/components/StoreSettingsForm.tsx';
    assert.ok(workspaceFileExists(rel), `Missing ${rel}`);
    const content = readWorkspaceFile(rel);
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    assert.ok(/<form\b[\s\S]*onSubmit=\{/.test(codeOnly), 'StoreSettingsForm.tsx must render a form with onSubmit');
    assert.ok(
      /\.from\(\s*['"]store_settings['"]\s*\)[\s\S]*\.(?:upsert|update)\(/.test(codeOnly),
      'StoreSettingsForm.tsx must persist updates to store_settings'
    );
    for (const field of [
      'store_name',
      'address',
      'phone',
      'footer_note',
      'tax_enabled',
      'tax_rate',
    ]) {
      assert.ok(
        codeOnly.includes(field),
        `StoreSettingsForm.tsx must bind/submit ${field}`
      );
    }
  });

  it('T1-F6-02: src/app/page.tsx exposes settings tab for admin/owner and excludes it for kasir/user', () => {
    const content = readWorkspaceFile('src/app/page.tsx');
    assert.ok(content.includes('StoreSettingsForm'), 'page.tsx must mount StoreSettingsForm');
    assert.ok(content.includes('isAdminRole'), 'page.tsx must gate tabs via isAdminRole');

    const ownerTabsMatch = content.match(
      /const\s+ownerTabs[^=]*=\s*\[([\s\S]*?)\](?:\s*as\s+const)?\s*;/
    );
    assert.ok(ownerTabsMatch, 'Expected ownerTabs definition in src/app/page.tsx');
    assert.ok(
      ownerTabsMatch[1].includes("'settings'"),
      'ownerTabs must include settings tab'
    );

    const kasirTabsMatch = content.match(
      /const\s+kasirTabs[^=]*=\s*\[([\s\S]*?)\](?:\s*as\s+const)?\s*;/
    );
    assert.ok(kasirTabsMatch, 'Expected kasirTabs definition in src/app/page.tsx');
    assert.equal(
      kasirTabsMatch[1].includes("'settings'"),
      false,
      'kasirTabs must NOT include settings tab'
    );
  });

  it('T1-F6-03: store settings context and LoginPage integrate dynamic profile with STORE_INFO fallback', () => {
    const hasDedicatedCtx = workspaceFileExists('src/contexts/StoreSettingsContext.tsx');
    const authCtx = readWorkspaceFile('src/contexts/AuthContext.tsx');
    const loginPage = readWorkspaceFile('src/components/LoginPage.tsx');

    const storesDynamic =
      (hasDedicatedCtx &&
        readWorkspaceFile('src/contexts/StoreSettingsContext.tsx').includes('store_settings')) ||
      authCtx.includes('store_settings');
    assert.ok(storesDynamic, 'AuthContext or StoreSettingsContext must load store_settings');
    assert.ok(
      loginPage.includes('STORE_INFO'),
      'LoginPage.tsx must retain STORE_INFO fallback'
    );
    assert.ok(
      /storeSettings|store_settings|storeName/i.test(loginPage),
      'LoginPage.tsx must support dynamic store settings'
    );
  });

  it('T1-F6-04: ReceiptContent.tsx and ReceiptModal.tsx consume dynamic store profile', () => {
    const receiptContent = readWorkspaceFile('src/components/ReceiptContent.tsx');
    const receiptModal = readWorkspaceFile('src/components/ReceiptModal.tsx');

    assert.ok(
      receiptContent.includes('store_settings') &&
        receiptContent.includes('STORE_INFO') &&
        /\{storeName\}[\s\S]*\{storeAddress\}[\s\S]*\{storePhone\}[\s\S]*\{storeFooter\}/.test(
          receiptContent
        ),
      'ReceiptContent.tsx must render dynamic store profile fields with STORE_INFO fallback'
    );

    const waMatch = receiptModal.match(
      /function\s+handleSendWhatsApp[\s\S]*?(?=\n\s*return\s*\()/
    );
    assert.ok(waMatch, 'Expected handleSendWhatsApp in ReceiptModal.tsx');
    const waFn = waMatch[0];
    assert.ok(
      (waFn.includes('storeName') || /settings\.store_name|storeInfo/.test(waFn)) &&
        (waFn.includes('footerNote') || /footer_note/.test(waFn)) &&
        waFn.includes('encodeURIComponent'),
      'ReceiptModal.tsx handleSendWhatsApp must interpolate dynamic storeName and footerNote into wa.me URL'
    );
  });

  it('T1-F6-05: ReceiptPage.tsx consumes get_public_receipt store_settings with fallback', () => {
    const receiptPage = readWorkspaceFile('src/components/ReceiptPage.tsx');
    assert.ok(receiptPage.includes('get_public_receipt'));
    assert.ok(
      /<ReceiptContent[\s\S]*?storeInfo=\{[^}]*store_settings/.test(receiptPage),
      'ReceiptPage.tsx must pass transaction.store_settings to ReceiptContent'
    );
  });

  it('T1-F6-06: Sprint 3 SQL migration creates public.store_settings singleton with RLS', () => {
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Expected supabase/migrations/v1_3_0*.sql');
    const sql = readWorkspaceFile(migPath);
    assert.ok(/create\s+table[\s\S]*public\.store_settings/i.test(sql));
    assert.ok(/check\s*\(\s*id\s*=\s*1\s*\)/i.test(sql));
    assert.ok(/enable\s+row\s+level\s+security/i.test(sql));
  });
});

describe('Tier 1 — F7: Cashier Discounts & Optional Tax + Profit Display (6 tests)', () => {
  it('T1-F7-01: pricing.ts computes per-item nominal discount accurately', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [
        { sell_price: 10000, qty: 2, discount_type: 'nominal', discount_value: 3000 },
      ],
      orderDiscountType: 'nominal',
      orderDiscountValue: 0,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(res.subtotalAmount, 17000);
    assert.equal(res.discountAmount, 0);
    assert.equal(res.taxAmount, 0);
    assert.equal(res.totalAmount, 17000);
  });

  it('T1-F7-02: pricing.ts computes per-item percent discount accurately', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [
        { sell_price: 10000, qty: 3, discount_type: 'percent', discount_value: 10 },
      ],
      orderDiscountType: 'nominal',
      orderDiscountValue: 0,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(res.subtotalAmount, 27000);
    assert.equal(res.totalAmount, 27000);
  });

  it('T1-F7-03: pricing.ts computes per-receipt nominal and percent discounts accurately', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const nomRes = invokePricingEngine(pricingMod, {
      items: [
        { sell_price: 20000, qty: 2, discount_type: 'nominal', discount_value: 0 },
        { sell_price: 15000, qty: 1, discount_type: 'nominal', discount_value: 0 },
      ],
      orderDiscountType: 'nominal',
      orderDiscountValue: 5000,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(nomRes.subtotalAmount, 55000);
    assert.equal(nomRes.discountAmount, 5000);
    assert.equal(nomRes.afterDiscount, 50000);
    assert.equal(nomRes.totalAmount, 50000);

    const pctRes = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 50000, qty: 2, discount_type: 'nominal', discount_value: 0 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 20,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(pctRes.subtotalAmount, 100000);
    assert.equal(pctRes.discountAmount, 20000);
    assert.equal(pctRes.afterDiscount, 80000);
    assert.equal(pctRes.totalAmount, 80000);
  });

  it('T1-F7-04: pricing.ts applies optional tax using storeSettings.tax_enabled && (applyTax ?? true)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const withTax = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 50000, qty: 2, discount_type: 'nominal', discount_value: 0 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 20,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(withTax.afterDiscount, 80000);
    assert.equal(withTax.taxAmount, 8800);
    assert.equal(withTax.totalAmount, 88800);

    const optOut = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 50000, qty: 2, discount_type: 'nominal', discount_value: 0 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 20,
      taxEnabled: true,
      taxRate: 11,
      applyTax: false,
    });
    assert.equal(optOut.taxAmount, 0);
    assert.equal(optOut.totalAmount, 80000);
  });

  it('T1-F7-05: PosCashier.tsx integrates item/order discounts, tax toggle, and 7-arg process_sale', () => {
    const posCashier = readWorkspaceFile('src/components/PosCashier.tsx');
    assert.ok(posCashier.includes('p_discount_type'));
    assert.ok(posCashier.includes('p_discount_value'));
    assert.ok(posCashier.includes('p_apply_tax'));
    assert.ok(/pricing/.test(posCashier), 'PosCashier.tsx must use src/utils/pricing');
  });

  it('T1-F7-06: ReportsView.tsx adjusts net/gross profit for discounts and excludes tax', () => {
    const reports = readWorkspaceFile('src/components/ReportsView.tsx');
    const todayQueryMatch = reports.match(
      /let\s+todayQuery\s*=[\s\S]*?\.select\(\s*(['"`])([\s\S]*?)\1\s*\)/
    );
    assert.ok(todayQueryMatch, 'Expected todayQuery in ReportsView.tsx');
    const todaySelectCols = todayQueryMatch[2];
    assert.ok(
      todaySelectCols.includes('discount_amount') ||
        todaySelectCols.includes('subtotal_amount') ||
        todaySelectCols.includes('subtotal'),
      `todayQuery must select discount/subtotal columns for profit calculation, got: ${todaySelectCols}`
    );

    const profitBlockMatch = reports.match(
      /let\s+todayProfit\s*=[\s\S]*?(?=const\s+lowStockCount|return\s*\{)/
    );
    assert.ok(profitBlockMatch, 'Expected todayProfit calculation block in ReportsView.tsx');
    const profitBlock = profitBlockMatch[0];
    assert.ok(
      /discount_amount|subtotal_amount|item\.subtotal/.test(profitBlock),
      'todayProfit calculation in ReportsView.tsx must subtract order/item discounts instead of using raw item.price * qty'
    );
  });
});

describe('Tier 1 — F8: CSV Export & Date Filter (6 tests)', () => {
  it('T1-F8-01: buildCsvString prepends UTF-8 BOM (\\uFEFF)', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const csv = buildCsvString(['Invoice', 'Total'], [['INV-1', 15000]]);
    assert.equal(csv.charCodeAt(0), 0xfeff);
  });

  it('T1-F8-02: buildCsvString joins header and data rows with CRLF (\\r\\n)', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const csv = buildCsvString(
      ['A', 'B'],
      [
        ['1', '2'],
        ['3', '4'],
      ]
    );
    const body = csv.slice(1);
    const lines = body.split('\r\n');
    assert.equal(lines.length, 3);
    assert.deepEqual(lines, ['A,B', '1,2', '3,4']);
  });

  it('T1-F8-03: escapeCsvField quotes commas, quotes, and newlines and doubles inner quotes', async () => {
    const { escapeCsvField } = await importWorkspaceModule('src/utils/csv.ts');
    assert.equal(escapeCsvField('Kopi, Susu'), '"Kopi, Susu"');
    assert.equal(escapeCsvField('Ukuran "L"'), '"Ukuran ""L"""');
    assert.equal(escapeCsvField('Baris 1\nBaris 2'), '"Baris 1\nBaris 2"');
  });

  it('T1-F8-04: sanitizeCsvCell preserves normal safe strings, numbers, and ISO dates', async () => {
    const { sanitizeCsvCell } = await importWorkspaceModule('src/utils/csv.ts');
    assert.equal(sanitizeCsvCell('Kopi Hitam'), 'Kopi Hitam');
    assert.equal(sanitizeCsvCell(25000), '25000');
    assert.equal(sanitizeCsvCell('2026-11-24'), '2026-11-24');
  });

  it('T1-F8-05: ReportsView.tsx provides date range filter without 50-row export truncation', () => {
    const reports = readWorkspaceFile('src/components/ReportsView.tsx');
    assert.ok(
      /startDate|dateFrom|fromDate/i.test(reports) &&
        /endDate|dateTo|toDate/i.test(reports),
      'ReportsView.tsx must provide start & end date filter controls'
    );
    assert.ok(
      reports.includes('type="date"'),
      'ReportsView.tsx must render date inputs'
    );

    const hasFixed50Or500Limit =
      /\.limit\(\s*(?:hasDateRange\s*\?\s*500\s*:\s*50|50|500)\s*\)/.test(reports);
    const exportBlockMatch = reports.match(
      /function\s+handleExportCsv[\s\S]*?(?=\n\s*return\s*\()/
    );
    const exportBlock = exportBlockMatch ? exportBlockMatch[0] : '';
    const exportFetchesFullData =
      /\.from\(\s*['"](?:transactions|stock_logs)['"]\s*\)/.test(exportBlock) ||
      /\.range\s*\(/.test(exportBlock);
    assert.ok(
      !hasFixed50Or500Limit || exportFetchesFullData,
      'ReportsView.tsx must not silently truncate CSV exports at .limit(50)/.limit(500)'
    );
  });

  it('T1-F8-06: ReportsView.tsx exposes Owner-only Sales CSV and Stock Mutation CSV exports', () => {
    const reports = readWorkspaceFile('src/components/ReportsView.tsx');
    assert.ok(
      reports.includes('buildCsvString') || reports.includes('../utils/csv'),
      'ReportsView.tsx must use src/utils/csv'
    );
    assert.ok(/csv/i.test(reports) && /Blob|download/i.test(reports));
    assert.ok(
      /stock_logs|Mutasi Stok|Stock Mutation/i.test(reports) &&
        /isOwner|isAdminRole/i.test(reports)
    );
  });
});

describe('Tier 1 — F9: Versioning, Changelog & i18n (5 tests)', () => {
  it('T1-F9-01: package.json version equals 1.3.0', () => {
    const pkg = JSON.parse(readWorkspaceFile('package.json'));
    assert.equal(pkg.version, '1.3.0');
  });

  it('T1-F9-02: src/utils/format.ts APP_VERSION equals 1.3.0', async () => {
    const { APP_VERSION } = await importWorkspaceModule('src/utils/format.ts');
    assert.equal(APP_VERSION, '1.3.0');
  });

  it('T1-F9-03: CHANGELOG.md documents [1.3.0] covering US-3.1 through US-3.4', () => {
    const changelog = readWorkspaceFile('CHANGELOG.md');
    const idx130 = changelog.indexOf('## [1.3.0]');
    assert.ok(idx130 !== -1, 'CHANGELOG.md must contain ## [1.3.0]');
    const section = changelog.slice(idx130, idx130 + 2500);
    assert.ok(/store_settings|pengaturan toko|store profile/i.test(section));
    assert.ok(/diskon|discount|pajak|tax/i.test(section));
    assert.ok(/csv/i.test(section));
    assert.ok(/react native|shared core|assets/i.test(section));
  });

  it('T1-F9-04: translations.ts includes Sprint 3 keys in both id and en', async () => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    const idJson = JSON.stringify(translations.id).toLowerCase();
    const enJson = JSON.stringify(translations.en).toLowerCase();

    const idTopicKeywords = {
      settings: ['settings', 'pengaturan'],
      discount: ['discount', 'diskon'],
      tax: ['tax', 'pajak', 'ppn'],
      csv: ['csv'],
    };

    for (const [topic, idKeywords] of Object.entries(idTopicKeywords)) {
      assert.ok(
        idKeywords.some((kw) => idJson.includes(kw)),
        `translations.id should include Sprint 3 topic: ${topic}`
      );
      assert.ok(
        enJson.includes(topic),
        `translations.en should include Sprint 3 topic: ${topic}`
      );
    }
    assert.ok(translations.id.tabs?.settings, 'translations.id.tabs.settings missing');
    assert.ok(translations.en.tabs?.settings, 'translations.en.tabs.settings missing');
  });

  it('T1-F9-05: Sprint 3 SQL migration exists and inserts 1.3.0 into app_versions', () => {
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Expected supabase/migrations/v1_3_0*.sql');
    const sql = readWorkspaceFile(migPath);
    assert.ok(/insert\s+into\s+public\.app_versions/i.test(sql));
    assert.ok(sql.includes("'1.3.0'"));
  });
});

describe('Tier 1 — F10: Dual-Role Backward Compatibility (5 tests)', () => {
  it('T1-F10-01: UserRole in src/types/pos.ts supports owner, kasir, admin, user', () => {
    const posTypes = readWorkspaceFile('src/types/pos.ts');
    for (const r of ["'owner'", "'kasir'", "'admin'", "'user'"]) {
      assert.ok(posTypes.includes(r), `UserRole must include ${r}`);
    }
  });

  it('T1-F10-02: isAdminRole returns true for owner and admin', async () => {
    const posMod = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(typeof posMod.isAdminRole, 'function', 'isAdminRole must be exported');
    assert.equal(posMod.isAdminRole('owner'), true);
    assert.equal(posMod.isAdminRole('admin'), true);
  });

  it('T1-F10-03: isAdminRole returns false for kasir and user', async () => {
    const posMod = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(typeof posMod.isAdminRole, 'function', 'isAdminRole must be exported');
    assert.equal(posMod.isAdminRole('kasir'), false);
    assert.equal(posMod.isAdminRole('user'), false);
  });

  it('T1-F10-04: Sprint 3 SQL migration updates profiles.role check constraint and private.is_owner()', () => {
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Expected supabase/migrations/v1_3_0*.sql');
    const sql = readWorkspaceFile(migPath);
    assert.ok(/'admin'/.test(sql) && /'user'/.test(sql));
    const isOwnerFnMatch = sql.match(
      /create\s+or\s+replace\s+function\s+private\.is_owner\(\)[\s\S]*?(\$[a-zA-Z_]*\$)[\s\S]*?\1\s*;/i
    );
    assert.ok(isOwnerFnMatch, 'Expected private.is_owner() in v1_3_0 migration');
    const ownerInMatch = isOwnerFnMatch[0].match(/role\s+in\s*\(([^)]+)\)/i);
    assert.ok(ownerInMatch, 'Expected role in (...) inside private.is_owner()');
    const ownerRoles = [...ownerInMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(
      [...new Set(ownerRoles)].sort(),
      ['admin', 'owner'],
      `private.is_owner() must include ['admin', 'owner'], got ${JSON.stringify(ownerRoles)}`
    );
  });

  it('T1-F10-05: UI components use isAdminRole for dual-role equivalence with zero hardcoded owner-only role checks', () => {
    for (const rel of [
      'src/app/page.tsx',
      'src/components/StoreSettingsForm.tsx',
      'src/components/ReportsView.tsx',
      'src/components/StaffManager.tsx',
    ]) {
      const content = readWorkspaceFile(rel);
      assert.ok(
        content.includes('isAdminRole'),
        `${rel} must use isAdminRole for dual-role backward compatibility`
      );
      assert.equal(
        /\brole\s*===\s*['"]owner['"]/.test(content),
        false,
        `${rel} must not contain hardcoded role === 'owner' checks`
      );
    }
  });
});
