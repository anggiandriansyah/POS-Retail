import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  APP_VERSION,
  formatRupiah,
  generateInvoiceNumber,
} from '../src/utils/format.js';

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
const supabaseUrl = envDev.VITE_SUPABASE_URL;
const supabaseAnonKey = envDev.VITE_SUPABASE_ANON_KEY;

assert.ok(supabaseUrl, 'VITE_SUPABASE_URL must be defined in .env.development');
assert.ok(supabaseAnonKey, 'VITE_SUPABASE_ANON_KEY must be defined in .env.development');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

describe('Unit Tests - src/utils/format.js', () => {
  it('APP_VERSION should be 1.1.0', () => {
    assert.equal(APP_VERSION, '1.1.0');
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
});

describe('Live Integration & Security Tests - Supabase DEV', () => {
  const protectedTables = [
    'products',
    'transactions',
    'shifts',
    'petty_cash_logs',
    'profiles',
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

  it("app_versions is readable and contains versions '1.0.0' and '1.1.0'", async () => {
    const { data, error } = await supabase
      .from('app_versions')
      .select('version');
    assert.equal(error, null);
    assert.ok(Array.isArray(data), 'Expected app_versions data to be an array');

    const versions = data.map((row) => row.version);
    assert.ok(versions.includes('1.0.0'), `Expected '1.0.0' in ${JSON.stringify(versions)}`);
    assert.ok(versions.includes('1.1.0'), `Expected '1.1.0' in ${JSON.stringify(versions)}`);
  });
});
