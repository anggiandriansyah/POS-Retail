import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ReceiptContent from './ReceiptContent';

export default function ReceiptPage({ invoiceNumber }) {
  const [transaction, setTransaction] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReceipt() {
      setLoading(true);
      const { data, error: txError } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (txError || !data) {
        setError('Struk tidak ditemukan atau sudah dihapus.');
      } else {
        setTransaction(data);
        setItems(data.transaction_items || []);
      }
      setLoading(false);
    }

    fetchReceipt();
  }, [invoiceNumber]);

  return (
    <div className="receipt-public-page">
      <div className="receipt-public-actions no-print">
        <a href="/" className="btn btn-outline">
          <ArrowLeft size={16} /> Kembali ke POS
        </a>
        {transaction && (
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Simpan PDF
          </button>
        )}
      </div>

      {loading ? (
        <p className="muted-text">Memuat struk digital...</p>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <ReceiptContent transaction={transaction} items={items} />
      )}
    </div>
  );
}
