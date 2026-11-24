import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Boxes, ShoppingBag, Store, Tag } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { APP_VERSION, STORE_INFO } from './utils/format';
import PosCashier from './components/PosCashier';
import PriceChecker from './components/PriceChecker';
import InventoryManager from './components/InventoryManager';
import ReportsView from './components/ReportsView';
import ReceiptModal from './components/ReceiptModal';
import ReceiptPage from './components/ReceiptPage';
import './App.css';

const TABS = [
  { id: 'pos', label: 'Kasir (POS)', icon: ShoppingBag },
  { id: 'price', label: 'Cek Harga', icon: Tag },
  { id: 'inventory', label: 'Produk & Stok', icon: Boxes },
  { id: 'reports', label: 'Laporan', icon: BarChart3 },
];

async function queryProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: 'Supabase belum dikonfigurasi di file .env.' };
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    return { data: [], error: `Gagal memuat produk: ${error.message}` };
  }
  return { data: data || [], error: '' };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const pathname = window.location.pathname;
  const receiptMatch = pathname.match(/^\/receipt\/([^/]+)\/?$/);
  const invoiceNumber = receiptMatch ? decodeURIComponent(receiptMatch[1]) : null;

  const refreshProducts = useCallback(async () => {
    const result = await queryProducts();
    setProducts(result.data);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (invoiceNumber) return;
    let cancelled = false;
    queryProducts().then((result) => {
      if (cancelled) return;
      setProducts(result.data);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [invoiceNumber]);

  if (invoiceNumber) {
    return <ReceiptPage invoiceNumber={invoiceNumber} />;
  }

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;
  const appEnv = import.meta.env.VITE_APP_ENV || (import.meta.env.DEV ? 'development' : 'production');
  const isDevEnv = appEnv !== 'production';

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-logo">
            <Store size={22} />
          </div>
          <div>
            <h1>
              {STORE_INFO.name}{' '}
              {isDevEnv && <span className="env-badge">DEV</span>}
            </h1>
            <span className="muted-text">
              POS Retail &amp; Barcode Inventory • <code>v{APP_VERSION}</code>
            </span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Menu utama">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
                {tab.id === 'inventory' && lowStockCount > 0 && (
                  <span className="nav-badge">{lowStockCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="main-content no-print">
        {error && <div className="alert alert-error">{error}</div>}

        {loading && products.length === 0 ? (
          <div className="card">
            <p className="muted-text">Menghubungkan ke Supabase...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && (
              <PosCashier
                products={products}
                onProductsChanged={refreshProducts}
                onCheckoutSuccess={(data) => setReceiptData(data)}
              />
            )}
            {activeTab === 'price' && <PriceChecker products={products} />}
            {activeTab === 'inventory' && (
              <InventoryManager products={products} onProductsChanged={refreshProducts} />
            )}
            {activeTab === 'reports' && (
              <ReportsView
                products={products}
                onOpenReceipt={(data) => setReceiptData(data)}
              />
            )}
          </>
        )}
      </main>

      <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
}
