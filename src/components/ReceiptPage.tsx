'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type { PublicReceipt, TransactionItem } from '../types/pos';
import ReceiptContent from './ReceiptContent';
import ThemeLangToggles from './ThemeLangToggles';

export interface ReceiptPageProps {
  invoiceNumber: string;
}

export default function ReceiptPage({ invoiceNumber }: ReceiptPageProps) {
  const { dict } = useThemeLang();
  const [transaction, setTransaction] = useState<PublicReceipt | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReceipt() {
      setLoading(true);
      if (!supabase) {
        setError(dict.supabaseNotConfigured);
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_public_receipt', {
        p_invoice: invoiceNumber,
      });

      if (rpcError || !data) {
        setError(dict.receiptNotFound);
      } else {
        const receipt = data as PublicReceipt;
        setTransaction(receipt);
        setItems(receipt.items || []);
      }
      setLoading(false);
    }

    fetchReceipt();
  }, [dict.receiptNotFound, dict.supabaseNotConfigured, invoiceNumber]);

  return (
    <div className="receipt-public-page">
      <div className="receipt-public-actions no-print">
        <Link href="/" className="btn btn-outline">
          <ArrowLeft size={16} /> {dict.backToPos}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ThemeLangToggles compact />
          {transaction && (
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> {dict.printSavePdf}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="muted-text">{dict.loadingReceipt}</p>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : transaction ? (
        <ReceiptContent
          transaction={transaction}
          items={items}
          storeInfo={transaction.store_settings}
        />
      ) : null}
    </div>
  );
}
