import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Clock,
  ClipboardList,
  LogOut,
  ShoppingBag,
  Store,
  Tag,
  Users,
} from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { APP_VERSION, STORE_INFO } from './utils/format';
import LoginPage from './components/LoginPage';
import './App.css';

const PosCashier = lazy(() => import('./components/PosCashier'));
const PriceChecker = lazy(() => import('./components/PriceChecker'));
const InventoryManager = lazy(() => import('./components/InventoryManager'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const ShiftManager = lazy(() => import('./components/ShiftManager'));
const OwnerShifts = lazy(() => import('./components/OwnerShifts'));
const StaffManager = lazy(() => import('./components/StaffManager'));
const ReceiptModal = lazy(() => import('./components/ReceiptModal'));
const ReceiptPage = lazy(() => import('./components/ReceiptPage'));

const KASIR_TABS = [
  { id: 'pos', label: 'Kasir (POS)', icon: ShoppingBag },
  { id: 'price', label: 'Cek Harga', icon: Tag },
  { id: 'shift', label: 'Shift & Petty Cash', icon: Clock },
  { id: 'reports', label: 'Riwayat Saya', icon: BarChart3 },
];

const OWNER_TABS = [
  { id: 'reports', label: 'Laporan & Dashboard', icon: BarChart3 },
  { id: 'inventory', label: 'Produk & Stok', icon: Boxes },
  { id: 'owner_shifts', label: 'Rekap Shift', icon: ClipboardList },
  { id: 'staff', label: 'Kelola Kasir', icon: Users },
  { id: 'pos', label: 'Mode Kasir (POS)', icon: ShoppingBag },
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

function AuthenticatedApp() {
  const { session, profile, activeShift, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const isOwner = profile?.role === 'owner';
  const tabs = isOwner ? OWNER_TABS : KASIR_TABS;
  const defaultTab = isOwner ? 'reports' : 'pos';
  const allowedTabIds = isOwner
    ? [...OWNER_TABS.map((t) => t.id), 'shift']
    : KASIR_TABS.map((t) => t.id);

  const currentTab =
    activeTab && allowedTabIds.includes(activeTab) ? activeTab : defaultTab;

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    const result = await queryProducts();
    setProducts(result.data);
    setError(result.error);
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !profile) return;
    let cancelled = false;
    queryProducts().then((result) => {
      if (cancelled) return;
      setProducts(result.data);
      setError(result.error);
      setLoadingProducts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, profile]);

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="card">
          <p className="muted-text">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;
  const appEnv =
    import.meta.env.VITE_APP_ENV ||
    (import.meta.env.DEV ? 'development' : 'production');
  const isDevEnv = appEnv !== 'production';

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="topbar-row">
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

          <div className="user-bar">
            <div className="user-meta">
              <span className="user-name">{profile.full_name}</span>
              <span className={`badge ${isOwner ? 'badge-owner' : ''}`}>
                {profile.role.toUpperCase()}
              </span>
              <span
                className={`status-pill ${activeShift ? 'status-open' : 'status-closed'}`}
              >
                Shift: {activeShift ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={signOut}
              title="Keluar dari akun"
            >
              <LogOut size={15} />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Menu utama">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
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

        {loadingProducts && products.length === 0 ? (
          <div className="card">
            <p className="muted-text">Memuat data toko dari Supabase...</p>
          </div>
        ) : (
          <Suspense fallback={<div className="card"><p className="muted-text">Memuat modul...</p></div>}>
            {currentTab === 'pos' && (
              <PosCashier
                products={products}
                onProductsChanged={refreshProducts}
                onCheckoutSuccess={(data) => setReceiptData(data)}
                onGoToShift={() => setActiveTab('shift')}
              />
            )}
            {currentTab === 'price' && <PriceChecker products={products} />}
            {currentTab === 'shift' && (
              <ShiftManager onShiftOpened={() => setActiveTab('pos')} />
            )}
            {currentTab === 'inventory' && isOwner && (
              <InventoryManager products={products} onProductsChanged={refreshProducts} />
            )}
            {currentTab === 'owner_shifts' && isOwner && <OwnerShifts />}
            {currentTab === 'staff' && isOwner && <StaffManager />}
            {currentTab === 'reports' && (
              <ReportsView
                products={products}
                onOpenReceipt={(data) => setReceiptData(data)}
              />
            )}
          </Suspense>
        )}
      </main>

      <Suspense fallback={null}>
        <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
      </Suspense>
    </div>
  );
}

export default function App() {
  const pathname = window.location.pathname;
  const receiptMatch = pathname.match(/^\/receipt\/([^/]+)\/?$/);
  const invoiceNumber = receiptMatch ? decodeURIComponent(receiptMatch[1]) : null;

  if (invoiceNumber) {
    return (
      <Suspense fallback={<div className="receipt-public-page"><p className="muted-text">Memuat struk...</p></div>}>
        <ReceiptPage invoiceNumber={invoiceNumber} />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
