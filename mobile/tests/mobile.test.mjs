import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAdminRole } from '../../src/types/pos.ts';
import { calculateOrderPricing } from '../../src/utils/pricing.ts';
import { translations } from '../../src/i18n/translations.ts';
import { buildEscPosReceipt } from '../src/utils/escpos.ts';
import { buildWhatsAppReceiptUrl } from '../src/utils/whatsapp.ts';

describe('ALPHOS Mobile Automated Test Suite (US-4.1..US-4.6)', () => {
  it('auth & role routing aligns with isAdminRole for owner/admin vs kasir/user', () => {
    assert.equal(isAdminRole('owner'), true);
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('kasir'), false);
    assert.equal(isAdminRole('user'), false);
  });

  it('shift & petty cash categories exist in Shared Core translations (id & en)', () => {
    const serialized = JSON.stringify(translations);
    for (const cat of ['OPERASIONAL', 'KEMBALIAN', 'BELANJA_DARURAT', 'SETOR_BANK', 'LAINNYA']) {
      assert.ok(serialized.includes(cat), `Missing petty cash category ${cat}`);
    }
  });

  it('pricing discount/PPN + WhatsApp DEV receipt URL builder work cleanly', () => {
    const calc = calculateOrderPricing({
      items: [{ sell_price: 20000, qty: 2, discount_type: 'percent', discount_value: 10 }],
      discountType: 'nominal',
      discountValue: 6000,
      taxEnabled: true,
      taxRate: 11,
      applyTax: true,
    });
    assert.equal(calc.totalAmount, 33300);

    const wa = buildWhatsAppReceiptUrl({
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-20261125-001',
      totalAmount: calc.totalAmount,
    });
    assert.match(wa, /^https:\/\/wa\.me\/\?text=/);
    assert.ok(decodeURIComponent(wa).includes('/receipt/INV-20261125-001'));
  });

  it('escpos 58mm & 80mm thermal payloads start with ESC @ and end with GS V', () => {
    const b58 = buildEscPosReceipt({
      paperWidth: '58mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-58',
      items: [{ product_name: 'Kopi', qty: 1, price: 15000, subtotal: 15000 }],
      totalAmount: 15000,
      cashReceived: 20000,
      changeAmount: 5000,
      paymentMethod: 'cash',
    });
    assert.equal(b58[0], 0x1b);
    assert.equal(b58[1], 0x40);
    assert.equal(b58[b58.length - 3], 0x1d);
    assert.equal(b58[b58.length - 2], 0x56);

    const b80 = buildEscPosReceipt({
      paperWidth: '80mm',
      storeName: 'ALPHOS Store',
      invoiceNumber: 'INV-80',
      items: [{ product_name: 'Teh', qty: 2, price: 10000, subtotal: 20000 }],
      discountAmount: 2000,
      taxAmount: 1980,
      totalAmount: 19980,
      cashReceived: 20000,
      changeAmount: 20,
      paymentMethod: 'cash',
    });
    assert.equal(b80[0], 0x1b);
    assert.equal(b80[1], 0x40);
  });
});
