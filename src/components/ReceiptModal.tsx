'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Printer, X } from 'lucide-react';
import { useStoreSettings } from '../contexts/useStoreSettings';
import { useThemeLang } from '../contexts/useThemeLang';
import type { ReceiptModalData } from '../types/pos';
import { STORE_INFO, formatRupiah } from '../utils/format';
import ReceiptContent, { type ReceiptStoreInfo } from './ReceiptContent';

export interface ReceiptModalProps {
  receiptData: ReceiptModalData | null;
  onClose: () => void;
  storeInfo?: ReceiptStoreInfo | null;
}

export default function ReceiptModal({
  receiptData,
  onClose,
  storeInfo,
}: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const { settings } = useStoreSettings();
  const { dict, lang } = useThemeLang();
  const r = dict.receipt;

  if (!receiptData?.transaction) return null;

  const { transaction, items } = receiptData;
  const effectiveStore: ReceiptStoreInfo = storeInfo ?? settings;
  const storeName =
    effectiveStore?.store_name?.trim() || effectiveStore?.name?.trim() || STORE_INFO.name;
  const footerNote =
    effectiveStore?.footer_note?.trim() ||
    effectiveStore?.footerNote?.trim() ||
    STORE_INFO.footerNote;

  const receiptPath = `/receipt/${encodeURIComponent(transaction.invoice_number)}`;

  function getReceiptUrl(): string {
    return `${window.location.origin}${receiptPath}`;
  }

  async function handleCopyLink() {
    const receiptUrl = getReceiptUrl();
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setFallbackUrl(null);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFallbackUrl(receiptUrl);
    }
  }

  function handleSendWhatsApp() {
    const receiptUrl = getReceiptUrl();
    const itemLines = items
      .map((i) => {
        const itemDiscount = Number(i.discount_amount ?? 0);
        const discText =
          itemDiscount > 0 ? ` [${r.itemDiscount} -${formatRupiah(itemDiscount)}]` : '';
        return `• ${i.product_name} (${i.qty}x ${formatRupiah(i.price)})${discText} = ${formatRupiah(
          i.subtotal
        )}`;
      })
      .join('\n');

    const subtotalAmount = Number(transaction.subtotal_amount ?? 0);
    const discountAmount = Number(transaction.discount_amount ?? 0);
    const taxAmount = Number(transaction.tax_amount ?? 0);
    const taxRate = Number(transaction.tax_rate ?? 0);
    const totalAmount = Number(transaction.total_amount ?? 0);

    const breakdownLines: string[] = [];
    if (discountAmount > 0 || taxAmount > 0) {
      breakdownLines.push(`${r.subtotal}: ${formatRupiah(subtotalAmount || totalAmount)}`);
      if (discountAmount > 0) {
        breakdownLines.push(`${r.discount}: -${formatRupiah(discountAmount)}`);
      }
      if (taxAmount > 0) {
        breakdownLines.push(
          `${r.tax}${taxRate > 0 ? ` (${taxRate}%)` : ''}: ${formatRupiah(taxAmount)}`
        );
      }
    }

    const text = [
      `*${storeName}*`,
      `${r.invoiceNo}: ${transaction.invoice_number}`,
      `---`,
      itemLines,
      `---`,
      ...breakdownLines,
      `*Total: ${formatRupiah(transaction.total_amount)}*`,
      `${r.paid}: ${formatRupiah(transaction.cash_received)}`,
      `${r.change}: ${formatRupiah(transaction.change_amount)}`,
      ``,
      footerNote,
      r.viewDigitalReceipt,
      receiptUrl,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header no-print">
          <h3>{r.viewDigitalReceipt}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={lang === 'en' ? 'Close' : 'Tutup'}>
            <X size={18} />
          </button>
        </div>

        <ReceiptContent transaction={transaction} items={items} storeInfo={effectiveStore} />

        {fallbackUrl && (
          <div className="alert alert-success no-print" style={{ marginTop: '0.75rem', wordBreak: 'break-all' }}>
            <code>{fallbackUrl}</code>
          </div>
        )}

        <div className="modal-actions no-print">
          <button type="button" className="btn btn-primary" onClick={handleSendWhatsApp}>
            <MessageCircle size={16} /> {r.sendWhatsapp}
          </button>
          <button type="button" className="btn btn-outline" onClick={handleCopyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? r.linkCopied : r.copyLink}</span>
          </button>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> {dict.printSavePdf}
          </button>
          <a
            href={receiptPath}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            <ExternalLink size={16} /> {r.openPage}
          </a>
        </div>
      </div>
    </div>
  );
}
