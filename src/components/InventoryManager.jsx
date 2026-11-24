import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatRupiah } from '../utils/format';
import BarcodeScanner from './BarcodeScanner';

const EMPTY_FORM = {
  id: null,
  barcode: '',
  name: '',
  category: 'Umum',
  buy_price: '',
  sell_price: '',
  stock: '',
  min_stock: '5',
};

export default function InventoryManager({ products, onProductsChanged }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState(null);

  // State untuk Scan Mutasi Stok (Kurangi / Tambah Stok)
  const [stockMode, setStockMode] = useState('out'); // 'out' | 'in'
  const [scannedProduct, setScannedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustNote, setAdjustNote] = useState('Rusak / Kadaluarsa');
  const [adjusting, setAdjusting] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  function handleScanForStock(barcode) {
    const found = products.find(
      (p) => p.barcode.toLowerCase() === barcode.toLowerCase()
    );
    if (!found) {
      setScannedProduct(null);
      setFeedback({
        type: 'error',
        text: `Barcode "${barcode}" belum terdaftar. Anda bisa menambahkannya di form Tambah Produk.`,
      });
      return;
    }
    setScannedProduct(found);
    setFeedback(null);
  }

  async function handleStockAdjustment(e) {
    e.preventDefault();
    if (!scannedProduct) return;

    const qtyNum = parseInt(adjustQty, 10);
    if (!qtyNum || qtyNum <= 0) {
      setFeedback({ type: 'error', text: 'Jumlah harus lebih dari 0.' });
      return;
    }

    if (stockMode === 'out' && qtyNum > scannedProduct.stock) {
      setFeedback({
        type: 'error',
        text: `Stok "${scannedProduct.name}" hanya tersisa ${scannedProduct.stock}.`,
      });
      return;
    }

    setAdjusting(true);
    try {
      const delta = stockMode === 'out' ? -qtyNum : qtyNum;
      const nextStock = scannedProduct.stock + delta;

      const { error: updateErr } = await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', scannedProduct.id);

      if (updateErr) throw updateErr;

      const { error: logErr } = await supabase.from('stock_logs').insert({
        product_id: scannedProduct.id,
        type: stockMode,
        qty: delta,
        note: adjustNote.trim() || (stockMode === 'out' ? 'Pengurangan stok' : 'Restock barang'),
      });

      if (logErr) throw logErr;

      setFeedback({
        type: 'success',
        text: `Stok "${scannedProduct.name}" berhasil diperbarui menjadi ${nextStock} pcs.`,
      });
      setScannedProduct({ ...scannedProduct, stock: nextStock });
      setAdjustQty('1');
      await onProductsChanged();
    } catch (err) {
      setFeedback({ type: 'error', text: `Gagal update stok: ${err.message}` });
    } finally {
      setAdjusting(false);
    }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      barcode: form.barcode.trim(),
      name: form.name.trim(),
      category: form.category.trim() || 'Umum',
      buy_price: Number(form.buy_price) || 0,
      sell_price: Number(form.sell_price) || 0,
      stock: parseInt(form.stock, 10) || 0,
      min_stock: parseInt(form.min_stock, 10) || 5,
    };

    try {
      if (form.id) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', form.id);
        if (error) throw error;
        setFeedback({ type: 'success', text: `Produk "${payload.name}" diperbarui.` });
      } else {
        const { data: created, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;

        if (payload.stock > 0 && created) {
          await supabase.from('stock_logs').insert({
            product_id: created.id,
            type: 'in',
            qty: payload.stock,
            note: 'Stok awal produk baru',
          });
        }
        setFeedback({ type: 'success', text: `Produk "${payload.name}" berhasil ditambahkan.` });
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      await onProductsChanged();
    } catch (err) {
      const isDuplicate =
        err?.code === '23505' || err?.message?.toLowerCase().includes('duplicate key');
      setFeedback({
        type: 'error',
        text: isDuplicate
          ? `Barcode "${payload.barcode}" sudah terdaftar pada produk lain.`
          : `Gagal menyimpan produk: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      setFeedback({ type: 'error', text: `Gagal menghapus: ${error.message}` });
      return;
    }
    setFeedback({ type: 'success', text: `Produk "${product.name}" dihapus.` });
    await onProductsChanged();
  }

  function startEdit(product) {
    setForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category || 'Umum',
      buy_price: String(product.buy_price),
      sell_price: String(product.sell_price),
      stock: String(product.stock),
      min_stock: String(product.min_stock),
    });
    setShowForm(true);
  }

  return (
    <div className="inventory-layout">
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      {/* Panel Scan Kurangi / Tambah Stok */}
      <section className="card">
        <div className="section-header">
          <div>
            <h2>Scan Mutasi Stok (Masuk / Kurangi Stok)</h2>
            <p className="muted-text">
              Gunakan barcode scanner untuk mengurangi stok (rusak, kedaluwarsa, pakai toko) atau menambah stok masuk.
            </p>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`chip ${stockMode === 'out' ? 'active-danger' : ''}`}
              onClick={() => {
                setStockMode('out');
                setAdjustNote('Rusak / Kadaluarsa');
              }}
            >
              <ArrowDownCircle size={16} /> Kurangi Stok
            </button>
            <button
              type="button"
              className={`chip ${stockMode === 'in' ? 'active' : ''}`}
              onClick={() => {
                setStockMode('in');
                setAdjustNote('Restock Supplier');
              }}
            >
              <ArrowUpCircle size={16} /> Tambah Stok
            </button>
          </div>
        </div>

        <BarcodeScanner
          onScan={handleScanForStock}
          placeholder="Scan barcode barang yang stoknya ingin diubah..."
          autoFocus={false}
          buttonLabel="Pilih Barang"
        />

        {scannedProduct && (
          <form onSubmit={handleStockAdjustment} className="stock-adjust-card">
            <div>
              <strong>{scannedProduct.name}</strong>
              <p className="muted-text">
                Barcode: {scannedProduct.barcode} • Stok Saat Ini:{' '}
                <b>{scannedProduct.stock} pcs</b>
              </p>
            </div>
            <div className="stock-adjust-fields">
              <label>
                Jumlah ({stockMode === 'out' ? 'Dikurangi' : 'Ditambah'})
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="input"
                  required
                />
              </label>
              <label style={{ flex: 2 }}>
                Catatan / Alasan
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Misal: Rusak, Expired, Restock..."
                  className="input"
                />
              </label>
              <button
                type="submit"
                disabled={adjusting}
                className={`btn ${stockMode === 'out' ? 'btn-danger' : 'btn-primary'}`}
              >
                {adjusting
                  ? 'Menyimpan...'
                  : stockMode === 'out'
                  ? 'Kurangi Stok'
                  : 'Tambah Stok'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Daftar & Form Produk */}
      <section className="card">
        <div className="section-header">
          <h2>Daftar Produk ({products.length})</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm((prev) => !prev);
            }}
          >
            <Plus size={16} />
            <span>{showForm ? 'Tutup Form' : 'Tambah Produk'}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSaveProduct} className="product-form">
            <div className="form-grid">
              <label>
                Barcode *
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Scan atau ketik barcode"
                  className="input"
                  required
                />
              </label>
              <label>
                Nama Produk *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu 250ml"
                  className="input"
                  required
                />
              </label>
              <label>
                Kategori
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Minuman / Snack / dll"
                  className="input"
                />
              </label>
              <label>
                Harga Modal (HPP)
                <input
                  type="number"
                  min="0"
                  value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  placeholder="0"
                  className="input"
                  required
                />
              </label>
              <label>
                Harga Jual *
                <input
                  type="number"
                  min="0"
                  value={form.sell_price}
                  onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                  placeholder="0"
                  className="input"
                  required
                />
              </label>
              <label>
                Stok Awal
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  className="input"
                  required
                />
              </label>
              <label>
                Batas Peringatan Stok
                <input
                  type="number"
                  min="0"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  className="input"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : form.id ? 'Update Produk' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        )}

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk berdasarkan nama, barcode, atau kategori..."
            className="input"
          />
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Modal</th>
                <th>Harga Jual</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center muted-text">
                    Belum ada produk. Klik "Tambah Produk" untuk mulai mengisi data.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.barcode}</code></td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.category || 'Umum'}</td>
                    <td>{formatRupiah(p.buy_price)}</td>
                    <td><strong>{formatRupiah(p.sell_price)}</strong></td>
                    <td>
                      <span className={`stock-pill ${p.stock <= p.min_stock ? 'low' : ''}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEdit(p)}
                          title="Edit Produk"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleDelete(p)}
                          title="Hapus Produk"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
