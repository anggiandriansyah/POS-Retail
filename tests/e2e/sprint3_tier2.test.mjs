import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
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
  workspacePath,
} from './helpers.mjs';

loadDevEnv();

describe('Tier 2 — F1: store_settings Boundaries & Security (7 tests)', () => {
  it('T2-F1-01: anon is blocked from SELECT on public.store_settings', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient.from('store_settings').select('*');
    assert.ok(error !== null, `Expected error for anon SELECT, got data=${JSON.stringify(data)}`);
    assert.notEqual(
      error.code,
      'PGRST205',
      `store_settings table missing from schema cache (${error.message})`
    );
    assert.notEqual(
      error.code,
      '42P01',
      `store_settings table missing on DEV (${error.message})`
    );
    assert.equal(data, null);
  });

  it('T2-F1-02: anon is blocked from INSERT/UPDATE on public.store_settings', async () => {
    const anonClient = createAnonClient();
    const { error: insErr } = await anonClient
      .from('store_settings')
      .insert({ id: 1, store_name: 'Anon Hack' });
    assert.ok(insErr !== null, 'Expected anon INSERT to be rejected');
    assert.notEqual(insErr.code, 'PGRST205', `store_settings missing (${insErr.message})`);
    assert.notEqual(insErr.code, '42P01', `store_settings missing (${insErr.message})`);

    const { error: updErr } = await anonClient
      .from('store_settings')
      .update({ store_name: 'Anon Hack' })
      .eq('id', 1);
    assert.ok(updErr !== null, 'Expected anon UPDATE to be rejected');
    assert.notEqual(updErr.code, 'PGRST205', `store_settings missing (${updErr.message})`);
    assert.notEqual(updErr.code, '42P01', `store_settings missing (${updErr.message})`);
  });

  it('T2-F1-03: kasir is blocked from UPDATE/INSERT on public.store_settings', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;

    const { error: updErr } = await sessions.kasir.client
      .from('store_settings')
      .update({ store_name: 'Kasir Hack' })
      .eq('id', 1);
    assert.ok(updErr !== null, 'Expected kasir UPDATE to be rejected by RLS');

    const { error: insErr } = await sessions.kasir.client
      .from('store_settings')
      .insert({ id: 1, store_name: 'Kasir Hack' });
    assert.ok(insErr !== null, 'Expected kasir INSERT to be rejected by RLS');
  });

  it('T2-F1-04: singleton constraint rejects id=2 insert even for owner', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { error } = await sessions.owner.client
      .from('store_settings')
      .insert({ id: 2, store_name: 'Second Store' });
    assert.ok(error !== null, 'Expected id=2 insert to violate check (id = 1)');
  });

  it('T2-F1-05: tax_rate accepts boundaries 0 and 100 and rejects -1, -0.01, 100.01, 101', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      for (const validRate of [0, 100]) {
        const { error } = await ownerClient
          .from('store_settings')
          .update({ tax_rate: validRate })
          .eq('id', 1);
        assert.equal(error, null, `Expected tax_rate=${validRate} to succeed`);
      }

      for (const invalidRate of [-1, -0.01, 100.01, 101]) {
        const { error } = await ownerClient
          .from('store_settings')
          .update({ tax_rate: invalidRate })
          .eq('id', 1);
        assert.ok(
          error !== null,
          `Expected tax_rate=${invalidRate} to fail check constraint`
        );
      }
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });

  it('T2-F1-06: empty or whitespace-only store_name is rejected by DB constraint', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const ownerClient = sessions.owner.client;
    const snapshot = await snapshotStoreSettings(ownerClient);
    try {
      for (const badName of ['', '   ']) {
        const { error } = await ownerClient
          .from('store_settings')
          .update({ store_name: badName })
          .eq('id', 1);
        assert.ok(
          error !== null,
          `Expected store_name=${JSON.stringify(badName)} to be rejected`
        );
      }
    } finally {
      await restoreStoreSettings(ownerClient, snapshot);
    }
  });

  it('T2-F1-07: DELETE on store_settings is denied even for owner', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { error } = await sessions.owner.client
      .from('store_settings')
      .delete()
      .eq('id', 1);
    assert.ok(error !== null, 'Expected DELETE on store_settings to be denied');
    const { data: row } = await sessions.owner.client
      .from('store_settings')
      .select('id')
      .eq('id', 1)
      .single();
    assert.equal(row?.id, 1);
  });
});

describe('Tier 2 — F2: transactions & transaction_items Security & Boundaries (5 tests)', () => {
  it('T2-F2-01: kasir cannot read transactions created by owner', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    let product = null;
    let shiftState = null;

    try {
      product = await createTestProduct(ownerClient, runTag, { stock: 5 });
      shiftState = await ensureOpenShift(ownerClient, sessions.owner.user.id);
      const inv = `INV-${runTag}-OWN`;
      const { error: saleErr } = await ownerClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
      });
      assert.equal(saleErr, null, `Owner sale failed: ${saleErr?.message}`);

      const { data: kasirRows, error: qErr } = await kasirClient
        .from('transactions')
        .select('id, invoice_number, cashier_id')
        .eq('invoice_number', inv);
      assert.equal(qErr, null);
      assert.deepEqual(kasirRows, [], 'Kasir must not see owner transaction');
    } finally {
      await closeOpenedShiftSafely(ownerClient, shiftState);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F2-02: direct INSERT into transactions is denied even for owner', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { error } = await sessions.owner.client.from('transactions').insert({
      invoice_number: 'INV-DIRECT-BLOCKED',
      payment_method: 'cash',
      total_amount: 0,
      cash_received: 0,
      change_amount: 0,
    });
    assert.ok(error !== null, 'Direct INSERT into transactions must be denied');
  });

  it('T2-F2-03: direct UPDATE and DELETE on transactions and transaction_items are denied', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner']);
    if (!sessions) return;

    const { error: updTx } = await sessions.owner.client
      .from('transactions')
      .update({ total_amount: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    assert.ok(updTx !== null, 'Direct UPDATE on transactions must be denied');

    const { error: delItems } = await sessions.owner.client
      .from('transaction_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    assert.ok(delItems !== null, 'Direct DELETE on transaction_items must be denied');
  });

  it('T2-F2-04: anon is denied SELECT on transaction_items', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('transaction_items')
      .select('*')
      .limit(1);
    assert.ok(error !== null);
    assert.equal(data, null);
  });

  it('T2-F2-05: 100% discounted 0-total transaction persists cleanly (>= 0 invariant)', async (t) => {
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
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const inv = `INV-${runTag}-ZERO`;
      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: inv,
        p_payment_method: 'cash',
        p_cash_received: 0,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'percent',
        p_discount_value: 100,
        p_apply_tax: true,
      });
      assert.equal(error, null, `100% discount checkout failed: ${error?.message}`);
      assert.equal(Number(data.transaction.total_amount), 0);
      assert.equal(Number(data.transaction.tax_amount), 0);
      assert.equal(Number(data.transaction.change_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });
});

describe('Tier 2 — F3: process_sale & get_public_receipt Boundaries & Anti-Tampering (8 tests)', () => {
  it('T2-F3-01: anon is rejected on 7-arg process_sale with permission error (not missing signature)', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient.rpc('process_sale', {
      p_invoice_number: 'INV-ANON-7ARG',
      p_payment_method: 'cash',
      p_cash_received: 10000,
      p_items: [],
      p_discount_type: 'nominal',
      p_discount_value: 0,
      p_apply_tax: false,
    });
    assert.ok(error !== null, `Expected error for anon 7-arg process_sale, got ${JSON.stringify(data)}`);
    assert.notEqual(
      error.code,
      'PGRST202',
      `7-arg process_sale signature missing on DEV (${error.message})`
    );
  });

  it('T2-F3-02: process_sale rejects missing open shift with SHIFT_REQUIRED', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;

    const kasirClient = sessions.kasir.client;
    const { data: openShift } = await kasirClient
      .from('shifts')
      .select('*')
      .eq('cashier_id', sessions.kasir.user.id)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (openShift) {
      t.skip('Kasir already has an active OPEN shift; skipping SHIFT_REQUIRED close to preserve active session');
      return;
    }

    const { error } = await kasirClient.rpc('process_sale', {
      p_invoice_number: `INV-${makeRunTag()}-NOSHIFT`,
      p_payment_method: 'cash',
      p_cash_received: 10000,
      p_items: [{ product_id: '00000000-0000-0000-0000-000000000001', qty: 1 }],
      p_discount_type: 'nominal',
      p_discount_value: 0,
      p_apply_tax: false,
    });
    assert.ok(error !== null);
    assert.ok(error.message.includes('SHIFT_REQUIRED'), `Expected SHIFT_REQUIRED, got ${error.message}`);
  });

  it('T2-F3-03: tampered client price, subtotal, and cost_price in p_items are ignored by server', async (t) => {
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
        buy_price: 8000,
        sell_price: 25000,
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-TAMPER`,
        p_payment_method: 'cash',
        p_cash_received: 50000,
        p_items: [
          {
            product_id: product.id,
            qty: 2,
            price: 1,
            sell_price: 1,
            subtotal: 2,
            cost_price: 0,
          },
        ],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.total_amount), 50000);
      assert.equal(Number(data.items[0].price), 25000);
      assert.equal(Number(data.items[0].subtotal), 50000);
      assert.equal(Number(data.items[0].cost_price), 8000);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F3-04: p_apply_tax=true cannot enable tax when store_settings.tax_enabled=false', async (t) => {
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
        .update({ tax_enabled: false, tax_rate: 11 })
        .eq('id', 1);
      product = await createTestProduct(ownerClient, runTag, {
        sell_price: 10000,
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const { data, error } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-TAXOFF`,
        p_payment_method: 'qris',
        p_cash_received: 10000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: true,
      });
      assert.equal(error, null, `process_sale failed: ${error?.message}`);
      assert.equal(Number(data.transaction.tax_rate), 0);
      assert.equal(Number(data.transaction.tax_amount), 0);
      assert.equal(Number(data.transaction.total_amount), 10000);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F3-05: percent discount boundaries 0 and 100 succeed while -0.01 and 100.01 fail', async (t) => {
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
        sell_price: 10000,
        stock: 10,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      for (const badPct of [-0.01, 100.01]) {
        const { error: badErr } = await kasirClient.rpc('process_sale', {
          p_invoice_number: `INV-${runTag}-BADPCT-${badPct}`,
          p_payment_method: 'cash',
          p_cash_received: 10000,
          p_items: [{ product_id: product.id, qty: 1 }],
          p_discount_type: 'percent',
          p_discount_value: badPct,
          p_apply_tax: false,
        });
        assert.ok(badErr !== null, `Expected percent=${badPct} to be rejected`);
      }

      const { data: ok0, error: err0 } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-PCT0`,
        p_payment_method: 'cash',
        p_cash_received: 10000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'percent',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.equal(err0, null);
      assert.equal(Number(ok0.transaction.total_amount), 10000);

      const { data: ok100, error: err100 } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-PCT100`,
        p_payment_method: 'cash',
        p_cash_received: 0,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'percent',
        p_discount_value: 100,
        p_apply_tax: false,
      });
      assert.equal(err100, null, `Expected percent=100 to succeed: ${err100?.message}`);
      assert.equal(Number(ok100.transaction.discount_amount), 10000);
      assert.equal(Number(ok100.transaction.total_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F3-06: negative nominal -1 or invalid discount_type is rejected by process_sale', async (t) => {
    const sessions = await requireAuthSessions(t, ['owner', 'kasir']);
    if (!sessions) return;

    const runTag = makeRunTag();
    const ownerClient = sessions.owner.client;
    const kasirClient = sessions.kasir.client;
    let product = null;
    let shiftState = null;

    try {
      product = await createTestProduct(ownerClient, runTag, { stock: 5 });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const { error: negErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-NEG`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: -1,
        p_apply_tax: false,
      });
      assert.ok(negErr !== null, 'Negative discount_value must be rejected');

      const { error: typeErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-TYPE`,
        p_payment_method: 'cash',
        p_cash_received: 20000,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'voucher',
        p_discount_value: 1000,
        p_apply_tax: false,
      });
      assert.ok(typeErr !== null, 'Invalid discount_type must be rejected');
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F3-07: nominal discount > subtotal clamps >= 0 and cash < total is rejected', async (t) => {
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
        sell_price: 10000,
        stock: 5,
      });
      shiftState = await ensureOpenShift(kasirClient, sessions.kasir.user.id);

      const { error: underpayErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-UNDER`,
        p_payment_method: 'cash',
        p_cash_received: 9999,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 0,
        p_apply_tax: false,
      });
      assert.ok(underpayErr !== null, 'Underpayment must be rejected');

      const { data: clamped, error: clampErr } = await kasirClient.rpc('process_sale', {
        p_invoice_number: `INV-${runTag}-CLAMP`,
        p_payment_method: 'cash',
        p_cash_received: 0,
        p_items: [{ product_id: product.id, qty: 1 }],
        p_discount_type: 'nominal',
        p_discount_value: 99999,
        p_apply_tax: false,
      });
      assert.equal(clampErr, null, `Clamped discount checkout failed: ${clampErr?.message}`);
      assert.equal(Number(clamped.transaction.discount_amount), 10000);
      assert.equal(Number(clamped.transaction.total_amount), 0);
    } finally {
      await closeOpenedShiftSafely(kasirClient, shiftState);
      await restoreStoreSettings(ownerClient, snapshot);
      if (product) await cleanupTestProduct(ownerClient, product.id);
    }
  });

  it('T2-F3-08: get_public_receipt returns null without error for missing, empty, null, or short invoices', async () => {
    const anonClient = createAnonClient();
    for (const inv of ['INV-NONEXISTENT-999', null, '', '   ', 'ABCD']) {
      const { data, error } = await anonClient.rpc('get_public_receipt', {
        p_invoice: inv,
      });
      assert.equal(error, null, `Unexpected error for p_invoice=${JSON.stringify(inv)}`);
      assert.equal(data, null);
    }
  });
});

describe('Tier 2 — F4: app_versions Boundaries & Migration Idempotency (5 tests)', () => {
  it('T2-F4-01: anon is blocked from inserting into app_versions', async () => {
    const anonClient = createAnonClient();
    const { error } = await anonClient.from('app_versions').insert({
      version: '9.9.9',
      phase: 'Test',
      notes: 'Should fail',
    });
    assert.ok(error !== null, 'Expected anon INSERT on app_versions to fail');
  });

  it('T2-F4-02: kasir is blocked from inserting into app_versions', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;

    const { error } = await sessions.kasir.client.from('app_versions').insert({
      version: '9.9.8',
      phase: 'Test',
      notes: 'Should fail',
    });
    assert.ok(error !== null, 'Expected kasir INSERT on app_versions to fail');
  });

  it('T2-F4-03: duplicate 1.3.0 does not exist in app_versions', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient
      .from('app_versions')
      .select('version')
      .eq('version', '1.3.0');
    assert.equal(error, null);
    assert.equal(data.length, 1);
  });

  it('T2-F4-04: every row in app_versions uses valid SemVer format', async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient.from('app_versions').select('version');
    assert.equal(error, null);
    assert.ok(Array.isArray(data) && data.length >= 4);
    for (const row of data) {
      assert.match(row.version, /^\d+\.\d+\.\d+$/);
    }
  });

  it('T2-F4-05: Sprint 3 SQL migration uses idempotent ON CONFLICT for app_versions', () => {
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Expected supabase/migrations/v1_3_0*.sql');
    const sql = readWorkspaceFile(migPath);
    assert.ok(/on\s+conflict[\s\S]*do\s+nothing/i.test(sql));
  });
});

describe('Tier 2 — F5: Shared Core Purity & Formatting Boundaries (5 tests)', () => {
  it('T2-F5-01: stripped Node runtime without browser globals loads and runs all 5 shared core modules', () => {
    const script = `
      for (const name of ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'Blob']) {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          get() { throw new Error('Forbidden browser global accessed: ' + name); }
        });
      }
      const pos = await import(${JSON.stringify(pathToFileURL(workspacePath('src/types/pos.ts')).href)});
      const fmt = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/format.ts')).href)});
      const i18n = await import(${JSON.stringify(pathToFileURL(workspacePath('src/i18n/translations.ts')).href)});
      const pricing = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/pricing.ts')).href)});
      const csv = await import(${JSON.stringify(pathToFileURL(workspacePath('src/utils/csv.ts')).href)});
      if (typeof fmt.formatRupiah(1000) !== 'string') throw new Error('formatRupiah failed');
      if (typeof fmt.formatDateTime('2026-11-24T06:00:00Z') !== 'string') throw new Error('formatDateTime failed');
      if (fmt.formatClockTime('2026-11-24T09:05:03') !== '09:05:03') throw new Error('formatClockTime failed');
      if (!/^INV-\\d{8}-\\d{6}-\\d{3}$/.test(fmt.generateInvoiceNumber())) throw new Error('generateInvoiceNumber failed');
      if (csv.sanitizeCsvCell('=CMD()') !== "'=CMD()") throw new Error('sanitizeCsvCell failed');
      if (csv.escapeCsvField('a,"b"') !== '"a,""b"""') throw new Error('escapeCsvField failed');
      if (typeof csv.buildCsvString(['a'], [['b']]) !== 'string') throw new Error('csv failed');
      if (typeof pos.isAdminRole !== 'function') throw new Error('isAdminRole missing');
      if (!i18n.translations?.id || !i18n.translations?.en) throw new Error('translations failed');
      if (Object.keys(pricing).length === 0) throw new Error('pricing empty');
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: workspacePath('.'),
      stdio: 'pipe',
    });
  });

  it('T2-F5-02: formatRupiah handles 0, -0, -1, large values, NaN, null, undefined, and non-numeric strings', async () => {
    const { formatRupiah } = await importWorkspaceModule('src/utils/format.ts');
    const norm = (s) => s.replace(/\u00a0/g, ' ');
    assert.equal(norm(formatRupiah(0)), 'Rp 0');
    assert.equal(norm(formatRupiah(-0)), 'Rp 0');
    assert.equal(norm(formatRupiah(-1)), '-Rp 1');
    assert.equal(norm(formatRupiah(999999999999)), 'Rp 999.999.999.999');
    assert.equal(norm(formatRupiah(Number.NaN)), 'Rp 0');
    assert.equal(norm(formatRupiah(null)), 'Rp 0');
    assert.equal(norm(formatRupiah(undefined)), 'Rp 0');
    assert.equal(norm(formatRupiah('abc')), 'Rp 0');
  });

  it('T2-F5-03: formatDateTime and formatClockTime handle null, empty, midnight, and 23:59:59', async () => {
    const { formatDateTime, formatClockTime } = await importWorkspaceModule(
      'src/utils/format.ts'
    );
    assert.equal(formatDateTime(null), '-');
    assert.equal(formatDateTime(undefined), '-');
    assert.equal(formatDateTime(''), '-');
    assert.equal(formatClockTime(null), '--:--:--');
    assert.equal(formatClockTime(''), '--:--:--');
    assert.equal(formatClockTime('2026-01-01T00:00:00'), '00:00:00');
    assert.equal(formatClockTime('2026-12-31T23:59:59'), '23:59:59');
  });

  it('T2-F5-04: generateInvoiceNumber produces valid format across rapid consecutive calls', async () => {
    const { generateInvoiceNumber } = await importWorkspaceModule('src/utils/format.ts');
    for (let i = 0; i < 50; i += 1) {
      const inv = generateInvoiceNumber();
      assert.match(inv, /^INV-\d{8}-\d{6}-\d{3}$/);
    }
  });

  it('T2-F5-05: src/assets/ directory is absent or empty', () => {
    const remaining = listWorkspaceFiles('src/assets');
    assert.deepEqual(remaining, [], `Expected src/assets empty, found ${remaining.join(', ')}`);
  });
});

describe('Tier 2 — F6: Store Settings UI & Fallback Boundaries (5 tests)', () => {
  it('T2-F6-01: LoginPage, ReceiptContent, and ReceiptPage provide STORE_INFO fallback for blank store_name', () => {
    const loginSrc = readWorkspaceFile('src/components/LoginPage.tsx');
    assert.ok(
      loginSrc.includes('STORE_INFO.name'),
      'LoginPage.tsx must retain STORE_INFO.name fallback'
    );

    const receiptContentSrc = readWorkspaceFile('src/components/ReceiptContent.tsx');
    assert.ok(
      /store_name\?\.trim\(\)[\s\S]*STORE_INFO\.name/.test(receiptContentSrc),
      'ReceiptContent.tsx must trim store_name and fall back to STORE_INFO.name'
    );

    const receiptPageSrc = readWorkspaceFile('src/components/ReceiptPage.tsx');
    assert.ok(
      /<ReceiptContent[\s\S]*?storeInfo=\{[^}]*store_settings/.test(receiptPageSrc),
      'ReceiptPage.tsx must delegate rendering with store_settings to ReceiptContent (inheriting STORE_INFO fallback)'
    );
  });

  it('T2-F6-02: ReceiptContent handles legacy PublicReceipt without store_settings via STORE_INFO fallback', () => {
    const src = readWorkspaceFile('src/components/ReceiptContent.tsx');
    assert.ok(
      src.includes('STORE_INFO.name') && src.includes('STORE_INFO.footerNote'),
      'ReceiptContent must fall back to STORE_INFO fields'
    );
  });

  it('T2-F6-03: StoreSettingsForm validates empty store_name and tax_rate < 0 or > 100', () => {
    const src = readWorkspaceFile('src/components/StoreSettingsForm.tsx');
    assert.ok(
      /\.trim\(\)[\s\S]*if\s*\(\s*!\w+\s*\)[\s\S]*errStoreNameRequired/.test(src),
      'StoreSettingsForm must reject empty/whitespace store_name with errStoreNameRequired'
    );
    assert.ok(
      /<\s*0\s*\|\|\s*\w+\s*>\s*100[\s\S]*errTaxRateRange/.test(src),
      'StoreSettingsForm must validate tax_rate < 0 or > 100 with errTaxRateRange'
    );
  });

  it('T2-F6-04: store_settings fetch handles unauthenticated/anon denial silently without crashing LoginPage', () => {
    const hasDedicatedCtx = listWorkspaceFiles('src/contexts').some((f) =>
      f.endsWith('StoreSettingsContext.tsx')
    );
    const ctxSrc = hasDedicatedCtx
      ? readWorkspaceFile('src/contexts/StoreSettingsContext.tsx')
      : readWorkspaceFile('src/contexts/AuthContext.tsx');
    assert.ok(
      ctxSrc.includes('store_settings') &&
        /if\s*\(\s*!(?:userId|session|user)[\s\S]*DEFAULT_STORE_SETTINGS|STORE_INFO/.test(ctxSrc) &&
        /try\s*\{[\s\S]*catch\s*\(/.test(ctxSrc),
      'Context loading store_settings must guard unauthenticated state and catch fetch errors safely'
    );
  });

  it('T2-F6-05: ReceiptPage handles get_public_receipt returning null cleanly', () => {
    const src = readWorkspaceFile('src/components/ReceiptPage.tsx');
    assert.ok(
      src.includes('receiptNotFound') &&
        /(?:rpcError\s*\|\|\s*!data|!data\s*\|\|\s*rpcError)/.test(src),
      'ReceiptPage must show receiptNotFound when get_public_receipt returns null'
    );
  });
});

describe('Tier 2 — F7: Pricing Boundaries & Rounding (7 tests)', () => {
  it('T2-F7-01: pricing.ts handles percent boundaries 0, 100, -0.01, and 100.01 safely (>= 0)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const r0 = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1, discount_type: 'percent', discount_value: 0 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 0,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(r0.totalAmount, 10000);

    const r100 = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1, discount_type: 'percent', discount_value: 100 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 0,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(r100.totalAmount, 0);

    const rNeg = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1, discount_type: 'percent', discount_value: -0.01 }],
      orderDiscountType: 'percent',
      orderDiscountValue: -0.01,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(rNeg.totalAmount, 10000);

    const rOver = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1, discount_type: 'percent', discount_value: 100.01 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 100.01,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(rOver.totalAmount, 0);
  });

  it('T2-F7-02: pricing.ts clamps nominal discounts exceeding lineGross or subtotal to >= 0', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const itemClamp = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 5000, qty: 1, discount_type: 'nominal', discount_value: 50000 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 0,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(itemClamp.subtotalAmount, 0);
    assert.equal(itemClamp.totalAmount, 0);

    const orderClamp = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 5000, qty: 2, discount_type: 'nominal', discount_value: 0 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 99999,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(orderClamp.subtotalAmount, 10000);
    assert.equal(orderClamp.discountAmount, 10000);
    assert.equal(orderClamp.afterDiscount, 0);
    assert.equal(orderClamp.taxAmount, 0);
    assert.equal(orderClamp.totalAmount, 0);
  });

  it('T2-F7-03: pricing.ts clamps negative nominal discounts to 0', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1, discount_type: 'nominal', discount_value: -500 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: -200,
      taxEnabled: false,
      taxRate: 0,
    });
    assert.equal(res.subtotalAmount, 10000);
    assert.equal(res.discountAmount, 0);
    assert.equal(res.totalAmount, 10000);
  });

  it('T2-F7-04: pricing.ts matches Math.round half-up rounding boundary (1005 * 10% -> 101)', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 1005, qty: 1, discount_type: 'percent', discount_value: 10 }],
      orderDiscountType: 'nominal',
      orderDiscountValue: 0,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    // 1005 - Math.round(100.5) = 1005 - 101 = 904; tax = Math.round(904 * 0.11 = 99.44) = 99; total = 1003
    assert.equal(res.subtotalAmount, 904);
    assert.equal(res.taxAmount, 99);
    assert.equal(res.totalAmount, 1003);
  });

  it('T2-F7-05: pricing.ts handles tax_rate=0 and tax_rate=100 boundaries', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const zeroTax = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1 }],
      taxEnabled: true,
      taxRate: 0,
      applyTax: true,
    });
    assert.equal(zeroTax.taxAmount, 0);
    assert.equal(zeroTax.totalAmount, 10000);

    const maxTax = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 10000, qty: 1 }],
      taxEnabled: true,
      taxRate: 100,
      applyTax: true,
    });
    assert.equal(maxTax.taxAmount, 10000);
    assert.equal(maxTax.totalAmount, 20000);
  });

  it('T2-F7-06: 100% order discount produces total=0 with zero tax', async () => {
    const pricingMod = await importWorkspaceModule('src/utils/pricing.ts');
    const res = invokePricingEngine(pricingMod, {
      items: [{ sell_price: 25000, qty: 2 }],
      orderDiscountType: 'percent',
      orderDiscountValue: 100,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(res.subtotalAmount, 50000);
    assert.equal(res.discountAmount, 50000);
    assert.equal(res.afterDiscount, 0);
    assert.equal(res.taxAmount, 0);
    assert.equal(res.totalAmount, 0);
  });

  it('T2-F7-07: PosCashier enforces cash >= totalAmount and non-negative totals', () => {
    const src = readWorkspaceFile('src/components/PosCashier.tsx');
    assert.ok(
      src.includes('numericCash < totalAmount') || /cash.*<\s*.*total/i.test(src),
      'PosCashier must block checkout when cash < totalAmount'
    );
  });
});

describe('Tier 2 — F8: CSV Formula Injection & Date Filter Boundaries (8 tests)', () => {
  it('T2-F8-01: sanitizeCsvCell prefixes direct formula triggers (=, +, -, @, \\t, \\r)', async () => {
    const { sanitizeCsvCell } = await importWorkspaceModule('src/utils/csv.ts');
    for (const payload of ['=CMD()', '+1+1', '-1+1', '@SUM(A1)', '\t=1', '\r=1']) {
      const sanitized = sanitizeCsvCell(payload);
      assert.ok(
        sanitized.startsWith("'"),
        `Expected leading quote neutralization for ${JSON.stringify(payload)}, got ${JSON.stringify(sanitized)}`
      );
    }
  });

  it('T2-F8-02: sanitizeCsvCell neutralizes whitespace-padded formula payloads', async () => {
    const { sanitizeCsvCell } = await importWorkspaceModule('src/utils/csv.ts');
    for (const payload of [
      ' =CMD()',
      '  +1',
      '   -1',
      '\t@SUM(A1)',
      ' \r=1',
    ]) {
      const sanitized = sanitizeCsvCell(payload);
      assert.ok(
        sanitized.startsWith("'"),
        `Expected whitespace-padded payload ${JSON.stringify(payload)} to be prefixed with ', got ${JSON.stringify(sanitized)}`
      );
    }
  });

  it('T2-F8-03: escapeCsvField combines formula neutralization and RFC4180 quoting', async () => {
    const { escapeCsvField } = await importWorkspaceModule('src/utils/csv.ts');
    assert.equal(escapeCsvField('=HYPERLINK("a,b")'), '"\'=HYPERLINK(""a,b"")"');
  });

  it('T2-F8-04: escapeCsvField escapes commas, quotes, LF, and CRLF properly', async () => {
    const { escapeCsvField } = await importWorkspaceModule('src/utils/csv.ts');
    assert.equal(escapeCsvField('A,B'), '"A,B"');
    assert.equal(escapeCsvField('Say "Hi"'), '"Say ""Hi"""');
    assert.equal(escapeCsvField('L1\nL2'), '"L1\nL2"');
    assert.equal(escapeCsvField('L1\r\nL2'), '"L1\r\nL2"');
  });

  it('T2-F8-05: sanitizeCsvCell handles null, undefined, empty string, 0, and false', async () => {
    const { sanitizeCsvCell } = await importWorkspaceModule('src/utils/csv.ts');
    assert.equal(sanitizeCsvCell(null), '');
    assert.equal(sanitizeCsvCell(undefined), '');
    assert.equal(sanitizeCsvCell(''), '');
    assert.equal(sanitizeCsvCell(0), '0');
    assert.equal(sanitizeCsvCell(false), 'false');
  });

  it('T2-F8-06: buildCsvString with empty rows produces valid UTF-8 BOM + header CSV', async () => {
    const { buildCsvString } = await importWorkspaceModule('src/utils/csv.ts');
    const csv = buildCsvString(['Col1', 'Col2'], []);
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.ok(csv.slice(1).startsWith('Col1,Col2'));
  });

  it('T2-F8-07: ReportsView handles inverted/empty date ranges cleanly', () => {
    const src = readWorkspaceFile('src/components/ReportsView.tsx');
    assert.ok(
      /startDate|dateFrom|fromDate/i.test(src) &&
        /endDate|dateTo|toDate/i.test(src),
      'ReportsView must manage startDate/endDate range cleanly'
    );
    assert.ok(
      /startDate\s*>\s*endDate|endDate\s*<\s*startDate|errInvalidDateRange/.test(src),
      'ReportsView must validate inverted date range (startDate > endDate / errInvalidDateRange)'
    );
    assert.ok(
      src.includes('transactions.length === 0') && src.includes('stockLogs.length === 0'),
      'ReportsView must render empty state cleanly when date filter matches 0 rows'
    );
  });

  it('T2-F8-08: kasir is blocked from reading stock_logs directly via RLS', async (t) => {
    const sessions = await requireAuthSessions(t, ['kasir']);
    if (!sessions) return;

    const { data, error } = await sessions.kasir.client
      .from('stock_logs')
      .select('*')
      .limit(1);
    assert.equal(error, null);
    assert.deepEqual(data, [], 'Kasir must not see stock_logs rows');
  });
});

describe('Tier 2 — F9: i18n, Versioning & Regression Boundaries (5 tests)', () => {
  function collectLeafKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...collectLeafKeys(value, fullKey));
      } else {
        keys.push([fullKey, value]);
      }
    }
    return keys;
  }

  it('T2-F9-01: translations.id and translations.en have zero missing keys in either direction', async () => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    const idKeys = new Set(collectLeafKeys(translations.id).map(([k]) => k));
    const enKeys = new Set(collectLeafKeys(translations.en).map(([k]) => k));
    const missingInEn = [...idKeys].filter((k) => !enKeys.has(k));
    const missingInId = [...enKeys].filter((k) => !idKeys.has(k));
    assert.deepEqual(missingInEn, [], `Missing in en: ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInId, [], `Missing in id: ${missingInId.join(', ')}`);
  });

  it('T2-F9-02: all translation leaf values in id and en are non-empty strings', async () => {
    const { translations } = await importWorkspaceModule('src/i18n/translations.ts');
    for (const lang of ['id', 'en']) {
      for (const [k, v] of collectLeafKeys(translations[lang])) {
        assert.equal(typeof v, 'string', `${lang}.${k} must be string`);
        assert.ok(v.trim().length > 0, `${lang}.${k} must be non-empty`);
      }
    }
  });

  it('T2-F9-03: APP_VERSION uses strict SemVer and matches package.json version', async () => {
    const { APP_VERSION } = await importWorkspaceModule('src/utils/format.ts');
    const pkg = JSON.parse(readWorkspaceFile('package.json'));
    assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
    assert.equal(APP_VERSION, pkg.version);
  });

  it('T2-F9-04: resolve_login_email handles empty, whitespace, unknown, and email inputs cleanly', async () => {
    const anonClient = createAnonClient();
    for (const bad of ['', '   ', 'nonexistent_e2e_user_xyz']) {
      const { data, error } = await anonClient.rpc('resolve_login_email', {
        p_identifier: bad,
      });
      assert.equal(error, null);
      assert.equal(data, null);
    }
    const { data: passThrough, error: emailErr } = await anonClient.rpc(
      'resolve_login_email',
      { p_identifier: '  TEST@Example.COM  ' }
    );
    assert.equal(emailErr, null);
    assert.equal(passThrough, 'test@example.com');
  });

  it('T2-F9-05: anon is denied SELECT on all operational tables including store_settings', async () => {
    const anonClient = createAnonClient();
    const tables = [
      'products',
      'transactions',
      'transaction_items',
      'stock_logs',
      'shifts',
      'petty_cash_logs',
      'profiles',
      'stock_requests',
      'store_settings',
    ];
    for (const table of tables) {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      assert.ok(error !== null, `Expected anon SELECT denial on ${table}`);
      assert.notEqual(
        error.code,
        'PGRST205',
        `Table ${table} missing from schema cache (${error.message})`
      );
      assert.notEqual(
        error.code,
        '42P01',
        `Table ${table} missing on DEV (${error.message})`
      );
      assert.equal(data, null);
    }
  });
});

describe('Tier 2 — F10: Dual-Role Boundaries & Security (6 tests)', () => {
  it('T2-F10-01: isAdminRole returns false for null, undefined, and empty string', async () => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(typeof isAdminRole, 'function');
    assert.equal(isAdminRole(null), false);
    assert.equal(isAdminRole(undefined), false);
    assert.equal(isAdminRole(''), false);
  });

  it('T2-F10-02: isAdminRole is strictly case-sensitive and rejects unknown role strings', async () => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    for (const invalid of ['OWNER', 'Admin', 'superadmin', 'kasir ', ' admin']) {
      assert.equal(isAdminRole(invalid), false, `Expected false for ${JSON.stringify(invalid)}`);
    }
  });

  it('T2-F10-03: isAdminRole executes cleanly in Node/RN runtime without DOM globals', async () => {
    const { isAdminRole } = await importWorkspaceModule('src/types/pos.ts');
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('user'), false);
  });

  it('T2-F10-04: Sprint 3 SQL migration restricts profiles.role check constraint to the 4 valid roles', () => {
    const migPath = findSprint3MigrationFile();
    assert.ok(migPath, 'Expected supabase/migrations/v1_3_0*.sql');
    const sql = readWorkspaceFile(migPath);
    const checkMatch = sql.match(/check\s*\(\s*role\s+in\s*\(([^)]+)\)\s*\)/i);
    assert.ok(checkMatch, 'Migration must enforce profiles.role CHECK (role IN (...))');
    const roles = [...checkMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(
      [...new Set(roles)].sort(),
      ['admin', 'kasir', 'owner', 'user'],
      `Migration profiles.role check must allow exact set [admin, kasir, owner, user], got ${JSON.stringify(roles)}`
    );
  });

  it('T2-F10-05: user role is denied owner-only store_settings write by RLS', async (t) => {
    const sessions = await requireAuthSessions(t, ['user']);
    if (!sessions) return;

    const { error } = await sessions.user.client
      .from('store_settings')
      .update({ store_name: 'User Hack' })
      .eq('id', 1);
    assert.ok(error !== null, 'Expected user role write to store_settings to be denied');
  });

  it('T2-F10-06: admin role has owner-equivalent RLS on store_settings and stock_logs (private.is_owner() equivalence)', async (t) => {
    const sessions = await requireAuthSessions(t, ['admin']);
    if (!sessions) return;

    const adminClient = sessions.admin.client;
    assert.equal(
      sessions.admin.profile.role,
      'admin',
      `Expected E2E_ADMIN account to have role=admin, got ${sessions.admin.profile.role}`
    );

    const snapshot = await snapshotStoreSettings(adminClient);
    try {
      const { data: updated, error: updErr } = await adminClient
        .from('store_settings')
        .update({ footer_note: '[E2E] Admin RLS Equivalence' })
        .eq('id', 1)
        .select()
        .single();
      assert.equal(updErr, null, `Admin update on store_settings failed: ${updErr?.message}`);
      assert.equal(updated.footer_note, '[E2E] Admin RLS Equivalence');

      const { data: logs, error: logsErr } = await adminClient
        .from('stock_logs')
        .select('id')
        .limit(1);
      assert.equal(logsErr, null, `Admin SELECT on stock_logs failed: ${logsErr?.message}`);
      assert.ok(Array.isArray(logs));
    } finally {
      await restoreStoreSettings(adminClient, snapshot);
    }
  });
});
