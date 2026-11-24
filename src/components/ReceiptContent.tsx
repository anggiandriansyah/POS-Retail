'use client';

import { useThemeLang } from '../contexts/useThemeLang';
import type { PublicReceipt, StoreSettings, Transaction, TransactionItem } from '../types/pos';
import { STORE_INFO, formatDateTime, formatRupiah } from '../utils/format';

export type ReceiptStoreInfo = Partial<StoreSettings> & {
  name?: string;
  footerNote?: string;
};

export interface ReceiptContentProps {
  transaction: Transaction | PublicReceipt;
  items: TransactionItem[];
  storeInfo?: ReceiptStoreInfo | null;
}

export default function ReceiptContent({
  transaction,
  items,
  storeInfo,
}: ReceiptContentProps) {
  const { dict } = useThemeLang();
  const r = dict.receipt;

  const receiptStore = 'store_settings' in transaction ? transaction.store_settings : undefined;
  const resolvedStore: ReceiptStoreInfo | null | undefined = storeInfo ?? receiptStore;
  const storeName =
    resolvedStore?.store_name?.trim() || resolvedStore?.name?.trim() || STORE_INFO.name;
  const storeAddress = resolvedStore?.address?.trim() || STORE_INFO.address;
  const storePhone = resolvedStore?.phone?.trim() || STORE_INFO.phone;
  const storeFooter =
    resolvedStore?.footer_note?.trim() || resolvedStore?.footerNote?.trim() || STORE_INFO.footerNote;

  const subtotalAmount = Number(transaction.subtotal_amount ?? 0);
  const discountAmount = Number(transaction.discount_amount ?? 0);
  const taxAmount = Number(transaction.tax_amount ?? 0);
  const taxRate = Number(transaction.tax_rate ?? 0);
  const totalAmount = Number(transaction.total_amount ?? 0);
  const showBreakdown =
    discountAmount > 0 ||
    taxAmount > 0 ||
    (subtotalAmount > 0 && subtotalAmount !== totalAmount);

  return (
    <div className="receipt-paper" id="printable-receipt">
      <div className="receipt-header">
        <h3>{storeName}</h3>
        <p>{storeAddress}</p>
        <p>
          {r.phonePrefix}: {storePhone}
        </p>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-meta">
        <div>
          <span>{r.invoiceNo}</span>
          <span>{transaction.invoice_number}</span>
        </div>
        <div>
          <span>{r.date}</span>
          <span>{formatDateTime(transaction.created_at)}</span>
        </div>
        {transaction.cashier_name && (
          <div>
            <span>{r.cashier}</span>
            <span>{transaction.cashier_name}</span>
          </div>
        )}
        <div>
          <span>{r.payment}</span>
          <span>{(transaction.payment_method || 'cash').toUpperCase()}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-items">
        {items.map((item, idx) => {
          const itemDiscount = Number(item.discount_amount ?? 0);
          return (
            <div key={item.id || idx} className="receipt-item-row">
              <div className="receipt-item-name">
                {item.product_name}
                {itemDiscount > 0 && (
                  <span className="receipt-item-calc" style={{ display: 'block', fontWeight: 400 }}>
                    ({r.itemDiscount} -{formatRupiah(itemDiscount)})
                  </span>
                )}
              </div>
              <div className="receipt-item-calc">
                <span>
                  {item.qty} × {formatRupiah(item.price)}
                </span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-totals">
        {showBreakdown && (
          <div>
            <span>{r.subtotal}</span>
            <span>{formatRupiah(subtotalAmount || totalAmount)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div>
            <span>{r.discount}</span>
            <span>-{formatRupiah(discountAmount)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div>
            <span>
              {r.tax}
              {taxRate > 0 ? ` (${taxRate}%)` : ''}
            </span>
            <span>{formatRupiah(taxAmount)}</span>
          </div>
        )}
        <div className="receipt-total-main">
          <span>{r.total}</span>
          <span>{formatRupiah(transaction.total_amount)}</span>
        </div>
        <div>
          <span>{r.paid}</span>
          <span>{formatRupiah(transaction.cash_received)}</span>
        </div>
        <div>
          <span>{r.change}</span>
          <span>{formatRupiah(transaction.change_amount)}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      <p className="receipt-footer">{storeFooter}</p>
    </div>
  );
}
