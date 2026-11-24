import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  APP_VERSION,
  formatClockTime,
  formatRupiah,
  generateInvoiceNumber,
} from '../src/utils/format.ts';
import { translations } from '../src/i18n/translations.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

const envDev = loadEnvFile(path.join(ROOT_DIR, '.env.development'));
const supabaseUrl = envDev.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envDev.NEXT_PUBLIC_SUPABASE_ANON_KEY;

assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL must be defined in .env.development');
assert.ok(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.development');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

describe('Unit Tests - src/utils/format.ts', () => {
  it('APP_VERSION should be 1.3.0', () => {
    assert.equal(APP_VERSION, '1.3.0');
  });

  it('formatRupiah formats positive numbers in IDR without decimals', () => {
    const normalize = (str) => str.replace(/\u00a0/g, ' ');
    assert.equal(normalize(formatRupiah(15000)), 'Rp 15.000');
    assert.equal(normalize(formatRupiah(1250000)), 'Rp 1.250.000');
    assert.equal(normalize(formatRupiah('5000')), 'Rp 5.000');
  });

  it('formatRupiah handles zero, negative, and invalid inputs safely', () => {
    const normalize = (str) => str.replace(/\u00a0/g, ' ');
    assert.equal(normalize(formatRupiah(0)), 'Rp 0');
    assert.equal(normalize(formatRupiah(null)), 'Rp 0');
    assert.equal(normalize(formatRupiah(undefined)), 'Rp 0');
    assert.equal(normalize(formatRupiah('not-a-number')), 'Rp 0');
    assert.equal(normalize(formatRupiah(-2500)), '-Rp 2.500');
  });

  it('generateInvoiceNumber returns valid INV-YYYYMMDD-HHMMSS-XXX format', () => {
    const invoice = generateInvoiceNumber();
    assert.match(invoice, /^INV-\d{8}-\d{6}-\d{3}$/);

    const [, datePart, timePart, randPart] = invoice.split('-');
    assert.equal(datePart.length, 8);
    assert.equal(timePart.length, 6);
    const randNum = Number(randPart);
    assert.ok(randNum >= 100 && randNum <= 999, `Random suffix ${randNum} should be 100..999`);
  });

  it('formatClockTime formats ISO timestamps as HH:MM:SS and handles empty inputs', () => {
    assert.equal(formatClockTime(null), '--:--:--');
    assert.equal(formatClockTime(undefined), '--:--:--');
    assert.equal(formatClockTime(''), '--:--:--');

    assert.equal(formatClockTime('2026-01-15T09:05:03'), '09:05:03');
    assert.equal(formatClockTime('2026-01-15T00:00:00'), '00:00:00');
    assert.equal(formatClockTime('2026-01-15T23:59:59'), '23:59:59');
    assert.match(formatClockTime(new Date().toISOString()), /^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('Unit Tests - src/i18n/translations.ts', () => {
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

  it('translations has complete and matching id and en keys with non-empty strings', () => {
    assert.ok(translations.id && typeof translations.id === 'object', 'translations.id must exist');
    assert.ok(translations.en && typeof translations.en === 'object', 'translations.en must exist');

    const idEntries = collectLeafKeys(translations.id);
    const enEntries = collectLeafKeys(translations.en);

    assert.ok(idEntries.length > 0, 'translations.id must not be empty');
    assert.ok(enEntries.length > 0, 'translations.en must not be empty');

    const idMap = new Map(idEntries);
    const enMap = new Map(enEntries);

    const missingInEn = idEntries.map(([k]) => k).filter((k) => !enMap.has(k));
    const missingInId = enEntries.map(([k]) => k).filter((k) => !idMap.has(k));

    assert.deepEqual(missingInEn, [], `Keys missing in en: ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInId, [], `Keys missing in id: ${missingInId.join(', ')}`);

    for (const [key, val] of idEntries) {
      assert.equal(typeof val, 'string', `id.${key} must be a string`);
      assert.ok(val.trim().length > 0, `id.${key} must be non-empty`);
    }
    for (const [key, val] of enEntries) {
      assert.equal(typeof val, 'string', `en.${key} must be a string`);
      assert.ok(val.trim().length > 0, `en.${key} must be non-empty`);
    }
  });
});

describe('Live Integration & Security Tests - Supabase DEV', () => {
  const protectedTables = [
    'products',
    'transactions',
    'shifts',
    'petty_cash_logs',
    'profiles',
    'stock_requests',
  ];

  for (const table of protectedTables) {
    it(`anon is denied from reading table '${table}'`, async () => {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      assert.ok(
        error !== null,
        `Expected error when anon reads '${table}', got data=${JSON.stringify(data)}`
      );
      assert.equal(data, null);
    });
  }

  it('anon can call has_any_owner RPC without error', async () => {
    const { data, error } = await supabase.rpc('has_any_owner');
    assert.equal(error, null);
    assert.equal(typeof data, 'boolean');
  });

  it("anon calling get_public_receipt('INV-NONEXISTENT-999') returns null without DB error", async () => {
    const { data, error } = await supabase.rpc('get_public_receipt', {
      p_invoice: 'INV-NONEXISTENT-999',
    });
    assert.equal(error, null);
    assert.equal(data, null);
  });

  it("anon can call resolve_login_email('anggitest123') and gets 'anggitest123@posretail.test'", async () => {
    const { data, error } = await supabase.rpc('resolve_login_email', {
      p_identifier: 'anggitest123',
    });
    assert.equal(error, null);
    assert.equal(data, 'anggitest123@posretail.test');
  });

  it("anon calling resolve_login_email('nonexistent_user_xyz') returns null", async () => {
    const { data, error } = await supabase.rpc('resolve_login_email', {
      p_identifier: 'nonexistent_user_xyz',
    });
    assert.equal(error, null);
    assert.equal(data, null);
  });

  it('anon is rejected when calling process_sale RPC', async () => {
    const { data, error } = await supabase.rpc('process_sale', {
      p_invoice_number: 'INV-TEST-ANON-001',
      p_payment_method: 'cash',
      p_cash_received: 10000,
      p_items: [],
    });
    assert.ok(
      error !== null,
      `Expected error when anon calls process_sale, got data=${JSON.stringify(data)}`
    );
  });

  it('anon is rejected when calling close_shift RPC', async () => {
    const { data, error } = await supabase.rpc('close_shift', {
      p_shift_id: '00000000-0000-0000-0000-000000000000',
      p_actual_cash: 0,
      p_notes: 'anon test',
    });
    assert.ok(
      error !== null,
      `Expected error when anon calls close_shift, got data=${JSON.stringify(data)}`
    );
  });

  it("app_versions is readable and contains versions '1.0.0', '1.1.0', '1.2.0', and '1.3.0'", async () => {
    const { data, error } = await supabase
      .from('app_versions')
      .select('version');
    assert.equal(error, null);
    assert.ok(Array.isArray(data), 'Expected app_versions data to be an array');

    const versions = data.map((row) => row.version);
    assert.ok(versions.includes('1.0.0'), `Expected '1.0.0' in ${JSON.stringify(versions)}`);
    assert.ok(versions.includes('1.1.0'), `Expected '1.1.0' in ${JSON.stringify(versions)}`);
    assert.ok(versions.includes('1.2.0'), `Expected '1.2.0' in ${JSON.stringify(versions)}`);
    assert.ok(versions.includes('1.3.0'), `Expected '1.3.0' in ${JSON.stringify(versions)}`);
  });
});
