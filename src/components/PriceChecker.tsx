'use client';

import { useState } from 'react';
import { Tag, AlertTriangle, PackageCheck } from 'lucide-react';
import type { Product } from '../types/pos';
import { formatRupiah } from '../utils/format';
import BarcodeScanner from './BarcodeScanner';

export interface PriceCheckerProps {
  products: Product[];
}

export default function PriceChecker({ products }: PriceCheckerProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');

  function handleScan(barcode: string) {
    const found = products.find(
      (p) => p.is_active !== false && p.barcode.toLowerCase() === barcode.toLowerCase()
    );
    if (found) {
      setSelectedProduct(found);
      setNotFoundBarcode('');
    } else {
      setSelectedProduct(null);
      setNotFoundBarcode(barcode);
    }
  }

  return (
    <div className="price-checker-container card">
      <div className="section-header">
        <div>
          <h2>Cek Harga Cepat</h2>
          <p className="muted-text">
            Scan barcode barang untuk langsung melihat harga jual dan sisa stok tanpa masuk keranjang kasir.
          </p>
        </div>
      </div>

      <BarcodeScanner
        onScan={handleScan}
        placeholder="Scan barcode produk di sini untuk cek harga..."
        buttonLabel="Cek Harga"
      />

      {notFoundBarcode && (
        <div className="price-result not-found">
          <AlertTriangle size={40} />
          <h3>Produk Tidak Ditemukan</h3>
          <p>
            Barcode <code>{notFoundBarcode}</code> belum terdaftar di database.
          </p>
        </div>
      )}

      {selectedProduct && (
        <div className="price-result found">
          <div className="price-result-meta">
            <span className="badge">{selectedProduct.category || 'Umum'}</span>
            <span className="muted-text">Barcode: {selectedProduct.barcode}</span>
          </div>
          <h3 className="price-result-name">{selectedProduct.name}</h3>
          <div className="price-result-amount">
            <Tag size={28} />
            <span>{formatRupiah(selectedProduct.sell_price)}</span>
          </div>
          <div className="price-result-stock">
            <PackageCheck size={18} />
            <span>
              Sisa Stok: <strong>{selectedProduct.stock}</strong> pcs
            </span>
            {selectedProduct.stock <= selectedProduct.min_stock && (
              <span className="stock-pill low">Stok Menipis</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
