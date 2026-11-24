import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Printer, X } from 'lucide-react';
import { STORE_INFO, formatRupiah } from '../utils/format';
import ReceiptContent from './ReceiptContent';

export default function ReceiptModal({ receiptData, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!receiptData?.transaction) return null;

  const { transaction, items } = receiptData;
  const receiptUrl = `${window.location.origin}/receipt/${encodeURIComponent(
    transaction.invoice_number
  )}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Salin link struk digital:', receiptUrl);
    }
  }

  function handleSendWhatsApp() {
    const itemLines = items
      .map(
        (i) =>
          `• ${i.product_name} (${i.qty}x ${formatRupiah(i.price)}) = ${formatRupiah(
            i.subtotal
          )}`
      )
      .join('\n');

    const text = [
      `*${STORE_INFO.name}*`,
      `No. Nota: ${transaction.invoice_number}`,
      `---`,
      itemLines,
      `---`,
      `*Total: ${formatRupiah(transaction.total_amount)}*`,
      `Bayar: ${formatRupiah(transaction.cash_received)}`,
      `Kembalian: ${formatRupiah(transaction.change_amount)}`,
      ``,
      `Lihat struk digital Anda:`,
      receiptUrl,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header no-print">
          <h3>Digital Receipt</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <ReceiptContent transaction={transaction} items={items} />

        <div className="modal-actions no-print">
          <button type="button" className="btn btn-primary" onClick={handleSendWhatsApp}>
            <MessageCircle size={16} /> Kirim WhatsApp
          </button>
          <button type="button" className="btn btn-outline" onClick={handleCopyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link Disalin!' : 'Salin Link'}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Print / PDF
          </button>
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            <ExternalLink size={16} /> Buka Halaman Struk
          </a>
        </div>
      </div>
    </div>
  );
}
