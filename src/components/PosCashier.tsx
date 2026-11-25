'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useStoreSettings } from '../contexts/useStoreSettings';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import type {
  CartItem,
  DiscountType,
  FeedbackMessage,
  PaymentMethod,
  Product,
  ReceiptModalData,
  Transaction,
  TransactionItem,
} from '../types/pos';
import { formatRupiah, generateInvoiceNumber } from '../utils/format';
import { calculateOrderPricing } from '../utils/pricing';
import BarcodeScanner from './BarcodeScanner';

export interface PosCashierProps {
  products: Product[];
  onProductsChanged: () => Promise<void>;
  onCheckoutSuccess: (data: ReceiptModalData) => void;
  onGoToShift?: () => void;
}

export default function PosCashier({
  products,
  onProductsChanged,
  onCheckoutSuccess,
  onGoToShift,
}: PosCashierProps) {
  const { activeShift, profile, refreshShift } = useAuth();
  const { settings } = useStoreSettings();
  const { dict } = useThemeLang();
  const pDict = dict.pos;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState<DiscountType>('nominal');
  const [orderDiscountValue, setOrderDiscountValue] = useState('');
  const [applyTaxOverride, setApplyTaxOverride] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const applyTax = applyTaxOverride ?? Boolean(settings.tax_enabled);

  const pricing = useMemo(
    () =>
      calculateOrderPricing({
        items: cart.map((item) => ({
          sell_price: item.sell_price,
          qty: item.qty,
          discount_type: item.discount_type || 'nominal',
          discount_value: item.discount_value || 0,
        })),
        discountType: orderDiscountType,
        discountValue: Number(orderDiscountValue) || 0,
        taxEnabled: Boolean(settings.tax_enabled),
        taxRate: Number(settings.tax_rate) || 0,
        applyTax,
      }),
    [cart, orderDiscountType, orderDiscountValue, settings.tax_enabled, settings.tax_rate, applyTax]
  );

  const totalAmount = pricing.totalAmount;

  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter((p) => p.is_active !== false);
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const numericCash =
    paymentMethod === 'cash' ? Number(cashReceived) || 0 : totalAmount;
  const changeAmount = Math.max(0, numericCash - totalAmount);

  function updateItemDiscount(
    productId: string,
    discountType: DiscountType,
    discountValue: string
  ) {
    const parsed = Math.max(0, Number(discountValue) || 0);
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              discount_type: discountType,
              discount_value: discountType === 'percent' ? Math.min(100, parsed) : parsed,
            }
          : item
      )
    );
  }

  function addToCart(product: Product) {
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

  function handleBarcodeScan(barcode: string) {
    const found = products.find(
      (p) => p.is_active !== false && p.barcode.toLowerCase() === barcode.toLowerCase()
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

  function updateQty(productId: string, delta: number) {
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

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (!supabase) {
      setFeedback({ type: 'error', text: 'Supabase belum dikonfigurasi.' });
      return;
    }
    if (!activeShift) {
      setFeedback({
        type: 'error',
        text: 'Shift belum dibuka. Buka shift terlebih dahulu sebelum melakukan transaksi.',
      });
      return;
    }
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
        discount_type: item.discount_type || 'nominal',
        discount_value: item.discount_value || 0,
      }));

      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_sale', {
        p_invoice_number: invoiceNumber,
        p_payment_method: paymentMethod,
        p_cash_received: numericCash,
        p_items: rpcItems,
        p_discount_type: orderDiscountType,
        p_discount_value: Number(orderDiscountValue) || 0,
        p_apply_tax: applyTax,
      });

      if (rpcError) {
        if (rpcError.message?.includes('SHIFT_REQUIRED')) {
          await refreshShift();
          throw new Error(
            'Shift belum dibuka atau sudah ditutup. Silakan buka shift terlebih dahulu.'
          );
        }
        throw rpcError;
      }

      const typedResult = rpcResult as {
        transaction: Transaction;
        items?: TransactionItem[];
      };

      const txData: Transaction = {
        ...typedResult.transaction,
        cashier_name: profile?.full_name || 'Kasir',
      };
      const receiptItems: TransactionItem[] = typedResult.items || [];

      setCart([]);
      setCashReceived('');
      setOrderDiscountValue('');
      setOrderDiscountType('nominal');
      setApplyTaxOverride(null);
      setFeedback({ type: 'success', text: `Transaksi ${invoiceNumber} berhasil!` });
      await onProductsChanged();
      onCheckoutSuccess({
        transaction: txData,
        items: receiptItems,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'error',
        text: `Gagal menyimpan transaksi: ${message}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pos-wrapper">
      {!activeShift && (
        <div className="shift-warning-banner">
          <div className="shift-warning-text">
            <AlertTriangle size={20} />
            <div>
              <strong>Shift Kasir Belum Dibuka</strong>
              <p className="muted-text" style={{ margin: 0 }}>
                Anda harus membuka shift (input modal awal laci) sebelum dapat memproses pembayaran.
              </p>
            </div>
          </div>
          {onGoToShift && (
            <button type="button" className="btn btn-primary" onClick={onGoToShift}>
              <Clock size={16} /> Buka Shift Sekarang
            </button>
          )}
        </div>
      )}

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
              cart.map((item, idx) => {
                const line = pricing.items[idx];
                const itemDiscType = item.discount_type || 'nominal';
                const itemDiscVal = item.discount_value || 0;
                return (
                  <div key={item.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span className="muted-text">
                          {formatRupiah(item.sell_price)} × {item.qty} ={' '}
                          <b>{formatRupiah(line?.lineNet ?? item.sell_price * item.qty)}</b>
                          {line && line.itemDiscountAmount > 0 && (
                            <span style={{ marginLeft: 6, color: 'var(--danger)' }}>
                              (-{formatRupiah(line.itemDiscountAmount)})
                            </span>
                          )}
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
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="muted-text" style={{ fontSize: '0.78rem', minWidth: 80 }}>
                        {pDict.itemDiscount}:
                      </span>
                      <select
                        value={itemDiscType}
                        onChange={(e) =>
                          updateItemDiscount(
                            item.id,
                            e.target.value as DiscountType,
                            String(itemDiscVal)
                          )
                        }
                        className="input"
                        style={{ width: 72, padding: '4px 6px', fontSize: '0.8rem' }}
                      >
                        <option value="nominal">Rp</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max={itemDiscType === 'percent' ? 100 : undefined}
                        value={itemDiscVal === 0 ? '' : itemDiscVal}
                        onChange={(e) =>
                          updateItemDiscount(item.id, itemDiscType, e.target.value)
                        }
                        placeholder="0"
                        className="input"
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="checkout-box">
            {cart.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="muted-text" style={{ fontSize: '0.82rem', minWidth: 96 }}>
                    {pDict.orderDiscount}:
                  </span>
                  <select
                    value={orderDiscountType}
                    onChange={(e) => setOrderDiscountType(e.target.value as DiscountType)}
                    className="input"
                    style={{ width: 72, padding: '6px 8px', fontSize: '0.84rem' }}
                  >
                    <option value="nominal">Rp</option>
                    <option value="percent">%</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={orderDiscountType === 'percent' ? 100 : undefined}
                    value={orderDiscountValue}
                    onChange={(e) => setOrderDiscountValue(e.target.value)}
                    placeholder="0"
                    className="input"
                    style={{ flex: 1, padding: '6px 8px', fontSize: '0.84rem' }}
                  />
                </div>

                {settings.tax_enabled && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTaxOverride(e.target.checked)}
                    />
                    <span>
                      {pDict.applyTax} ({settings.tax_rate}%)
                    </span>
                  </label>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span className="muted-text">{pDict.subtotal}</span>
                  <span>{formatRupiah(pricing.subtotalAmount)}</span>
                </div>
                {pricing.orderDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--danger)' }}>
                    <span>{pDict.orderDiscount}</span>
                    <span>-{formatRupiah(pricing.orderDiscountAmount)}</span>
                  </div>
                )}
                {pricing.taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span className="muted-text">
                      {pDict.tax} ({pricing.taxRate}%)
                    </span>
                    <span>{formatRupiah(pricing.taxAmount)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="total-row">
              <span>{pDict.grandTotal}</span>
              <strong>{formatRupiah(totalAmount)}</strong>
            </div>

            <div className="payment-methods">
              {(['cash', 'qris', 'transfer'] as const).map((method) => (
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
              disabled={cart.length === 0 || submitting || !activeShift}
              onClick={handleCheckout}
            >
              <CheckCircle2 size={18} />
              <span>
                {!activeShift
                  ? 'Buka Shift Dulu untuk Bayar'
                  : submitting
                    ? 'Memproses...'
                    : 'Bayar & Buat Struk'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
