import { useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatRupiah, generateInvoiceNumber } from '../utils/format';
import BarcodeScanner from './BarcodeScanner';

export default function PosCashier({ products, onProductsChanged, onCheckoutSuccess }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [products, search]);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.sell_price * item.qty, 0),
    [cart]
  );

  const numericCash =
    paymentMethod === 'cash' ? Number(cashReceived) || 0 : totalAmount;
  const changeAmount = Math.max(0, numericCash - totalAmount);

  function addToCart(product) {
    if (product.stock <= 0) {
      setFeedback({ type: 'error', text: `Stok "${product.name}" habis!` });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          setFeedback({
            type: 'error',
            text: `Stok "${product.name}" tersisa ${product.stock}.`,
          });
          return prev;
        }
        setFeedback({ type: 'success', text: `+1 ${product.name}` });
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      setFeedback({ type: 'success', text: `Ditambahkan: ${product.name}` });
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function handleBarcodeScan(barcode) {
    const found = products.find(
      (p) => p.barcode.toLowerCase() === barcode.toLowerCase()
    );
    if (!found) {
      setFeedback({
        type: 'error',
        text: `Barcode "${barcode}" tidak ditemukan di daftar produk.`,
      });
      return;
    }
    addToCart(found);
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const nextQty = item.qty + delta;
          if (nextQty > item.stock) {
            setFeedback({
              type: 'error',
              text: `Stok "${item.name}" hanya tersisa ${item.stock}.`,
            });
            return item;
          }
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && numericCash < totalAmount) {
      setFeedback({
        type: 'error',
        text: 'Uang tunai yang diterima kurang dari total belanja.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const invoiceNumber = generateInvoiceNumber();
      const rpcItems = cart.map((item) => ({
        product_id: item.id,
        qty: item.qty,
      }));

      let txData = null;
      let receiptItems = null;

      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_sale', {
        p_invoice_number: invoiceNumber,
        p_payment_method: paymentMethod,
        p_cash_received: numericCash,
        p_items: rpcItems,
      });

      if (!rpcError && rpcResult) {
        txData = rpcResult.transaction;
        receiptItems = rpcResult.items;
      } else {
        const rpcNotFound =
          rpcError?.code === 'PGRST202' ||
          rpcError?.message?.toLowerCase().includes('could not find the function');

        if (!rpcNotFound) {
          throw rpcError;
        }

        // Fallback jika fungsi RPC process_sale belum dibuat di Supabase
        const { data: insertedTx, error: txError } = await supabase
          .from('transactions')
          .insert({
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            cash_received: numericCash,
            change_amount: changeAmount,
          })
          .select()
          .single();

        if (txError) throw txError;
        txData = insertedTx;

        const itemsPayload = cart.map((item) => ({
          transaction_id: txData.id,
          product_id: item.id,
          product_name: item.name,
          qty: item.qty,
          price: item.sell_price,
          subtotal: item.sell_price * item.qty,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('transaction_items')
          .insert(itemsPayload)
          .select();

        if (itemsError) throw itemsError;
        receiptItems = insertedItems || itemsPayload;

        for (const item of cart) {
          const nextStock = Math.max(0, item.stock - item.qty);
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: nextStock })
            .eq('id', item.id);

          if (stockError) throw stockError;

          await supabase.from('stock_logs').insert({
            product_id: item.id,
            type: 'sale',
            qty: -item.qty,
            note: `Penjualan ${invoiceNumber}`,
          });
        }
      }

      setCart([]);
      setCashReceived('');
      setFeedback({ type: 'success', text: `Transaksi ${invoiceNumber} berhasil!` });
      await onProductsChanged();
      onCheckoutSuccess({
        transaction: txData,
        items: receiptItems,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: `Gagal menyimpan transaksi: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pos-layout">
      <div className="pos-left card">
        <h2>Scan & Pilih Produk</h2>
        <BarcodeScanner
          onScan={handleBarcodeScan}
          placeholder="Scan barcode produk untuk masuk keranjang..."
          buttonLabel="Tambah"
        />

        {feedback && (
          <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {feedback.text}
          </div>
        )}

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau barcode secara manual..."
            className="input"
          />
        </div>

        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p className="muted-text">
              Belum ada produk yang cocok. Tambahkan produk terlebih dahulu di tab Produk & Stok.
            </p>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`product-tile ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                <div className="product-tile-top">
                  <span className="badge">{product.category || 'Umum'}</span>
                  <span className={`stock-pill ${product.stock <= product.min_stock ? 'low' : ''}`}>
                    Stok: {product.stock}
                  </span>
                </div>
                <strong className="product-tile-name">{product.name}</strong>
                <span className="product-tile-barcode">{product.barcode}</span>
                <span className="product-tile-price">{formatRupiah(product.sell_price)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="pos-right card">
        <div className="cart-header">
          <h2>
            <ShoppingCart size={20} /> Keranjang ({cart.reduce((s, i) => s + i.qty, 0)})
          </h2>
          {cart.length > 0 && (
            <button
              type="button"
              className="btn-text-danger"
              onClick={() => setCart([])}
            >
              Kosongkan
            </button>
          )}
        </div>

        <div className="cart-list">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={36} />
              <p>Keranjang masih kosong. Scan barcode atau klik produk di sebelah kiri.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <span className="muted-text">
                    {formatRupiah(item.sell_price)} × {item.qty} ={' '}
                    <b>{formatRupiah(item.sell_price * item.qty)}</b>
                  </span>
                </div>
                <div className="cart-item-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => updateQty(item.id, -1)}
                    aria-label="Kurangi jumlah"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => updateQty(item.id, 1)}
                    aria-label="Tambah jumlah"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeItem(item.id)}
                    aria-label="Hapus item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="checkout-box">
          <div className="total-row">
            <span>Total Belanja</span>
            <strong>{formatRupiah(totalAmount)}</strong>
          </div>

          <div className="payment-methods">
            {['cash', 'qris', 'transfer'].map((method) => (
              <button
                key={method}
                type="button"
                className={`chip ${paymentMethod === method ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method)}
              >
                {method.toUpperCase()}
              </button>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div className="cash-section">
              <label>
                Uang Diterima (Rp)
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Masukkan nominal bayar..."
                  className="input"
                />
              </label>
              <div className="quick-cash">
                <button
                  type="button"
                  className="chip"
                  onClick={() => setCashReceived(String(totalAmount))}
                >
                  Uang Pas
                </button>
                {[20000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="chip"
                    onClick={() => setCashReceived(String(val))}
                  >
                    {formatRupiah(val)}
                  </button>
                ))}
              </div>
              <div className="change-row">
                <span>Kembalian</span>
                <strong>{formatRupiah(changeAmount)}</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={cart.length === 0 || submitting}
            onClick={handleCheckout}
          >
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Memproses...' : 'Bayar & Buat Struk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
