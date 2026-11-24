import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../supabaseClient';
import ReceiptContent from './ReceiptContent';
import ThemeLangToggles from './ThemeLangToggles';

export default function ReceiptPage({ invoiceNumber }) {
  const { dict } = useThemeLang();
  const [transaction, setTransaction] = useState(null);
  const [items, setItems] = useState([]);
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
        setTransaction(data);
        setItems(data.items || []);
      }
      setLoading(false);
    }

    fetchReceipt();
  }, [dict.receiptNotFound, dict.supabaseNotConfigured, invoiceNumber]);

  return (
    <div className="receipt-public-page">
      <div className="receipt-public-actions no-print">
        <a href="/" className="btn btn-outline">
          <ArrowLeft size={16} /> {dict.backToPos}
        </a>
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
      ) : (
        <ReceiptContent transaction={transaction} items={items} />
      )}
    </div>
  );
}
