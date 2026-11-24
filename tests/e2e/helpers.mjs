import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../..');
export const EXPECTED_DEV_HOST = 'tcbhaiyhtndnqgatysmh.supabase.co';

export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function loadDevEnv() {
  const devEnvPath = path.join(ROOT_DIR, '.env.development');
  assert.ok(
    fs.existsSync(devEnvPath),
    `Expected .env.development at ${devEnvPath}`
  );
  const envDev = parseEnvFile(devEnvPath);
  const supabaseUrl = envDev.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = envDev.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert.ok(
    supabaseUrl,
    'NEXT_PUBLIC_SUPABASE_URL must be defined in .env.development'
  );
  assert.ok(
    supabaseAnonKey,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.development'
  );

  const parsedUrl = new URL(supabaseUrl);
  assert.equal(
    parsedUrl.protocol,
    'https:',
    `DEV safety guard: expected https: protocol, got ${parsedUrl.protocol}`
  );
  assert.equal(
    parsedUrl.port,
    '',
    `DEV safety guard: expected default port (''), got ${parsedUrl.port}`
  );
  assert.equal(
    parsedUrl.hostname,
    EXPECTED_DEV_HOST,
    `DEV safety guard: expected host ${EXPECTED_DEV_HOST}, got ${parsedUrl.hostname}`
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
    appEnv: envDev.NEXT_PUBLIC_APP_ENV || 'development',
    envDev,
  };
}

export function createAnonClient() {
  const { supabaseUrl, supabaseAnonKey } = loadDevEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getEnvValue(envDev, keys) {
  for (const key of keys) {
    if (process.env[key] && String(process.env[key]).trim()) {
      return String(process.env[key]).trim();
    }
    if (envDev[key] && String(envDev[key]).trim()) {
      return String(envDev[key]).trim();
    }
  }
  return '';
}

export function getOptionalRoleCredentials(role) {
  const { envDev } = loadDevEnv();
  const upper = role.toUpperCase();
  const idKeys = [
    `E2E_${upper}_IDENTIFIER`,
    `E2E_${upper}_EMAIL`,
    `TEST_${upper}_IDENTIFIER`,
    `TEST_${upper}_EMAIL`,
  ];
  if (role === 'kasir') {
    idKeys.push('TEST_CASHIER_IDENTIFIER', 'TEST_CASHIER_EMAIL');
  }
  const pwKeys = [`E2E_${upper}_PASSWORD`, `TEST_${upper}_PASSWORD`];
  if (role === 'kasir') {
    pwKeys.push('TEST_CASHIER_PASSWORD');
  }

  const identifier = getEnvValue(envDev, idKeys);
  const password = getEnvValue(envDev, pwKeys);
  if (!identifier || !password) return null;
  return { identifier, password };
}

export function isAuthRequired() {
  return (
    process.env.E2E_REQUIRE_AUTH === '1' ||
    process.env.E2E_REQUIRE_AUTH === 'true'
  );
}

export async function signInWithRole(role) {
  const creds = getOptionalRoleCredentials(role);
  if (!creds) return null;

  const { supabaseUrl, supabaseAnonKey } = loadDevEnv();
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let email = creds.identifier;
  if (!email.includes('@')) {
    const { data: resolved, error: resolveErr } = await client.rpc(
      'resolve_login_email',
      { p_identifier: email }
    );
    assert.equal(
      resolveErr,
      null,
      `resolve_login_email failed for ${role}: ${resolveErr?.message}`
    );
    assert.ok(resolved, `Could not resolve email for ${role} identifier`);
    email = resolved;
  }

  const { data: authData, error: signInErr } =
    await client.auth.signInWithPassword({
      email,
      password: creds.password,
    });
  assert.equal(
    signInErr,
    null,
    `Sign-in failed for ${role}: ${signInErr?.message}`
  );
  assert.ok(authData.user, `Expected user session for ${role}`);

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  assert.equal(
    profErr,
    null,
    `Failed to fetch profile for ${role}: ${profErr?.message}`
  );

  if (role === 'owner' || role === 'admin') {
    assert.ok(
      profile.role === 'owner' || profile.role === 'admin',
      `Role mismatch for ${role}: expected owner or admin, got ${profile.role}`
    );
  } else {
    assert.equal(
      profile.role,
      role,
      `Role mismatch for ${role}: expected ${role}, got ${profile.role}`
    );
  }

  return { client, user: authData.user, profile };
}

const sessionCache = new Map();

export async function requireAuthSessions(t, roles = ['owner']) {
  const missing = roles.filter((r) => !getOptionalRoleCredentials(r));
  if (missing.length > 0) {
    const msg = `DEV credentials missing for [${missing.join(', ')}] (set E2E_<ROLE>_IDENTIFIER & E2E_<ROLE>_PASSWORD)`;
    if (isAuthRequired()) {
      assert.fail(msg);
    }
    t.skip(msg);
    return null;
  }

  const sessions = {};
  for (const role of roles) {
    if (!sessionCache.has(role)) {
      sessionCache.set(role, await signInWithRole(role));
    }
    sessions[role] = sessionCache.get(role);
  }
  return sessions;
}

export function getBaseUrlOrSkip(t) {
  const { envDev } = loadDevEnv();
  const url =
    process.env.E2E_BASE_URL ||
    process.env.APP_BASE_URL ||
    envDev.E2E_BASE_URL ||
    '';
  if (!url.trim()) {
    t.skip('E2E_BASE_URL not configured; skipping live Next.js HTTP check');
    return null;
  }
  return url.trim().replace(/\/+$/, '');
}

export function makeRunTag() {
  return `E2E-S3-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function snapshotStoreSettings(ownerClient) {
  const { data, error } = await ownerClient
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();
  assert.equal(
    error,
    null,
    `Failed to snapshot store_settings: ${error?.message}`
  );
  return data;
}

export async function restoreStoreSettings(ownerClient, snapshot) {
  if (!snapshot) return;
  const { error } = await ownerClient
    .from('store_settings')
    .update({
      store_name: snapshot.store_name,
      address: snapshot.address,
      phone: snapshot.phone,
      footer_note: snapshot.footer_note,
      tax_enabled: snapshot.tax_enabled,
      tax_rate: snapshot.tax_rate,
      updated_by: snapshot.updated_by ?? null,
    })
    .eq('id', 1);
  assert.equal(
    error,
    null,
    `Failed to restore store_settings: ${error?.message}`
  );
}

export async function createTestProduct(ownerClient, runTag, overrides = {}) {
  const seq = Math.floor(100 + Math.random() * 900);
  const payload = {
    barcode: `E2E-BC-${runTag}-${seq}`,
    name: `[E2E] Produk ${runTag}-${seq}`,
    category: 'E2E-Test',
    buy_price: 10000,
    sell_price: 15000,
    stock: 20,
    min_stock: 2,
    is_active: true,
    ...overrides,
  };
  const { data, error } = await ownerClient
    .from('products')
    .insert(payload)
    .select()
    .single();
  assert.equal(
    error,
    null,
    `Failed to create test product: ${error?.message}`
  );
  return data;
}

export async function cleanupTestProduct(ownerClient, productId) {
  if (!productId) return;
  const { error: directDelErr } = await ownerClient
    .from('products')
    .delete()
    .eq('id', productId);
  if (!directDelErr) return;

  const { data: txRefs } = await ownerClient
    .from('transaction_items')
    .select('id')
    .eq('product_id', productId)
    .limit(1);

  if (!txRefs || txRefs.length === 0) {
    await ownerClient.from('stock_logs').delete().eq('product_id', productId);
    const { error: retryDelErr } = await ownerClient
      .from('products')
      .delete()
      .eq('id', productId);
    if (!retryDelErr) return;
  }

  await ownerClient
    .from('products')
    .update({ is_active: false, stock: 0 })
    .eq('id', productId);
}

export async function ensureOpenShift(client, userId, openingCash = 100000) {
  const { data: existing, error: selErr } = await client
    .from('shifts')
    .select('*')
    .eq('cashier_id', userId)
    .eq('status', 'OPEN')
    .maybeSingle();
  assert.equal(selErr, null, `Shift lookup failed: ${selErr?.message}`);
  if (existing) {
    return { shift: existing, openedByTest: false };
  }
  const { data: created, error: insErr } = await client
    .from('shifts')
    .insert({
      cashier_id: userId,
      status: 'OPEN',
      opening_cash: openingCash,
    })
    .select()
    .single();
  assert.equal(
    insErr,
    null,
    `Failed to open test shift: ${insErr?.message}`
  );
  return { shift: created, openedByTest: true };
}

export async function closeShiftWithExpectedCash(client, shift) {
  if (!shift?.id) return null;
  const { data: cashTx } = await client
    .from('transactions')
    .select('total_amount, payment_method')
    .eq('shift_id', shift.id);
  const { data: pettyLogs } = await client
    .from('petty_cash_logs')
    .select('type, amount')
    .eq('shift_id', shift.id);

  const cashSales = (cashTx || [])
    .filter((tx) => String(tx.payment_method || '').toLowerCase() === 'cash')
    .reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);
  const pettyIn = (pettyLogs || [])
    .filter((p) => p.type === 'IN')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pettyOut = (pettyLogs || [])
    .filter((p) => p.type === 'OUT')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const expectedCash =
    Number(shift.opening_cash || 0) + cashSales + pettyIn - pettyOut;

  const { data, error } = await client.rpc('close_shift', {
    p_shift_id: shift.id,
    p_actual_cash: expectedCash,
    p_notes: 'E2E automated test close',
  });
  assert.equal(error, null, `close_shift failed: ${error?.message}`);
  return data;
}

export async function closeOpenedShiftSafely(client, shiftState) {
  if (!shiftState?.openedByTest || !shiftState?.shift?.id) return null;
  try {
    return await closeShiftWithExpectedCash(client, shiftState.shift);
  } catch {
    return null;
  }
}

export function workspacePath(relPath) {
  return path.join(ROOT_DIR, relPath);
}

export function workspaceFileExists(relPath) {
  return fs.existsSync(workspacePath(relPath));
}

export function readWorkspaceFile(relPath) {
  return fs.readFileSync(workspacePath(relPath), 'utf8');
}

export function listWorkspaceFiles(relDir) {
  const target = workspacePath(relDir);
  if (!fs.existsSync(target)) return [];
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        out.push(path.relative(ROOT_DIR, full).replace(/\\/g, '/'));
      }
    }
  }
  walk(target);
  return out;
}

export function findSprint3MigrationFile() {
  const files = listWorkspaceFiles('supabase/migrations');
  return (
    files.find((f) => /v1_3_0.*\.sql$/i.test(f)) || null
  );
}

export async function importWorkspaceModule(relPath) {
  const absPath = workspacePath(relPath);
  assert.ok(
    fs.existsSync(absPath),
    `Expected workspace module ${relPath} to exist`
  );
  return import(pathToFileURL(absPath).href);
}

export function invokePricingEngine(pricingMod, input) {
  const candidates = [
    'calculateSalePricing',
    'calculateOrderPricing',
    'calculateCartPricing',
    'calculatePricing',
    'calculateTotals',
    'computePricing',
    'computeOrderPricing',
  ];
  let fn = null;
  for (const name of candidates) {
    if (typeof pricingMod[name] === 'function') {
      fn = pricingMod[name];
      break;
    }
  }
  if (!fn) {
    fn = Object.values(pricingMod).find(
      (v) =>
        typeof v === 'function' &&
        /pric|total|sale|cart|order/i.test(v.name || '')
    );
  }
  assert.ok(
    typeof fn === 'function',
    `Expected src/utils/pricing.ts to export a pricing calculation function; found [${Object.keys(pricingMod).join(', ')}]`
  );

  const normalizedItems = (input.items || []).map((item) => ({
    ...item,
    sell_price: item.sell_price ?? item.price,
    price: item.price ?? item.sell_price,
    qty: item.qty,
    discount_type: item.discount_type ?? item.discountType ?? 'nominal',
    discount_value: item.discount_value ?? item.discountValue ?? 0,
    discountType: item.discountType ?? item.discount_type ?? 'nominal',
    discountValue: item.discountValue ?? item.discount_value ?? 0,
  }));

  const storeSettings = {
    tax_enabled: Boolean(input.taxEnabled),
    tax_rate: Number(input.taxRate ?? 0),
  };

  const payload = {
    items: normalizedItems,
    orderDiscountType: input.orderDiscountType ?? 'nominal',
    orderDiscountValue: input.orderDiscountValue ?? 0,
    discountType: input.orderDiscountType ?? 'nominal',
    discountValue: input.orderDiscountValue ?? 0,
    discount_type: input.orderDiscountType ?? 'nominal',
    discount_value: input.orderDiscountValue ?? 0,
    taxEnabled: storeSettings.tax_enabled,
    taxRate: storeSettings.tax_rate,
    tax_enabled: storeSettings.tax_enabled,
    tax_rate: storeSettings.tax_rate,
    storeSettings,
    applyTax: input.applyTax,
    p_apply_tax: input.applyTax,
  };

  const raw =
    fn.length >= 2
      ? fn(
          normalizedItems,
          {
            type: payload.orderDiscountType,
            value: payload.orderDiscountValue,
          },
          storeSettings,
          input.applyTax
        )
      : fn(payload);

  assert.ok(raw && typeof raw === 'object', 'Pricing engine must return an object');

  const result = {
    items: raw.items || raw.lineItems || [],
    subtotalAmount: Number(raw.subtotalAmount ?? raw.subtotal_amount),
    discountAmount: Number(
      raw.discountAmount ?? raw.orderDiscountAmount ?? raw.discount_amount
    ),
    afterDiscount: Number(
      raw.afterDiscount ??
        raw.after_discount ??
        (Number(raw.subtotalAmount ?? raw.subtotal_amount) -
          Number(
            raw.discountAmount ??
              raw.orderDiscountAmount ??
              raw.discount_amount ??
              0
          ))
    ),
    taxEnabled: Boolean(raw.taxEnabled ?? raw.tax_enabled ?? raw.effectiveTaxEnabled),
    taxRate: Number(raw.taxRate ?? raw.tax_rate ?? raw.effectiveTaxRate ?? 0),
    taxAmount: Number(raw.taxAmount ?? raw.tax_amount),
    totalAmount: Number(raw.totalAmount ?? raw.total_amount),
  };

  for (const field of [
    'subtotalAmount',
    'discountAmount',
    'afterDiscount',
    'taxAmount',
    'totalAmount',
  ]) {
    assert.ok(
      Number.isFinite(result[field]),
      `Pricing result.${field} must be finite, got ${result[field]}`
    );
  }
  return result;
}

export function parseCsvRoundTrip(csvText) {
  const withoutBom = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let endedOnRowSeparator = false;

  for (let i = 0; i < withoutBom.length; i += 1) {
    const ch = withoutBom[i];
    if (inQuotes) {
      endedOnRowSeparator = false;
      if (ch === '"') {
        if (withoutBom[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      endedOnRowSeparator = false;
      inQuotes = true;
    } else if (ch === ',') {
      endedOnRowSeparator = false;
      row.push(field);
      field = '';
    } else if (ch === '\r' && withoutBom[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      endedOnRowSeparator = true;
      i += 1;
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      endedOnRowSeparator = true;
    } else {
      endedOnRowSeparator = false;
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0 || endedOnRowSeparator) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
