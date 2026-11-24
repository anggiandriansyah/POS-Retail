import { STORE_INFO, formatDateTime, formatRupiah } from '../utils/format';

export default function ReceiptContent({ transaction, items }) {
  return (
    <div className="receipt-paper" id="printable-receipt">
      <div className="receipt-header">
        <h3>{STORE_INFO.name}</h3>
        <p>{STORE_INFO.address}</p>
        <p>Telp: {STORE_INFO.phone}</p>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-meta">
        <div>
          <span>No. Nota</span>
          <span>{transaction.invoice_number}</span>
        </div>
        <div>
          <span>Tanggal</span>
          <span>{formatDateTime(transaction.created_at)}</span>
        </div>
        <div>
          <span>Pembayaran</span>
          <span>{(transaction.payment_method || 'cash').toUpperCase()}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-items">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="receipt-item-row">
            <div className="receipt-item-name">{item.product_name}</div>
            <div className="receipt-item-calc">
              <span>
                {item.qty} × {formatRupiah(item.price)}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-totals">
        <div className="receipt-total-main">
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.total_amount)}</span>
        </div>
        <div>
          <span>Bayar</span>
          <span>{formatRupiah(transaction.cash_received)}</span>
        </div>
        <div>
          <span>Kembalian</span>
          <span>{formatRupiah(transaction.change_amount)}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      <p className="receipt-footer">{STORE_INFO.footerNote}</p>
    </div>
  );
}
