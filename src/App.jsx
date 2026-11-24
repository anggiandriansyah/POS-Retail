import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Clock,
  ClipboardList,
  LogOut,
  PackagePlus,
  Radio,
  ShoppingBag,
  Store,
  Tag,
  Users,
} from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeLangProvider } from './contexts/ThemeLangContext';
import { useAuth } from './contexts/useAuth';
import { useThemeLang } from './contexts/useThemeLang';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { APP_VERSION, STORE_INFO } from './utils/format';
import LoginPage from './components/LoginPage';
import ThemeLangToggles from './components/ThemeLangToggles';
import './App.css';

const PosCashier = lazy(() => import('./components/PosCashier'));
const PriceChecker = lazy(() => import('./components/PriceChecker'));
const InventoryManager = lazy(() => import('./components/InventoryManager'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const ShiftManager = lazy(() => import('./components/ShiftManager'));
const StockRequestPanel = lazy(() => import('./components/StockRequestPanel'));
const OwnerLiveMonitor = lazy(() => import('./components/OwnerLiveMonitor'));
const OwnerShifts = lazy(() => import('./components/OwnerShifts'));
const StaffManager = lazy(() => import('./components/StaffManager'));
const ReceiptModal = lazy(() => import('./components/ReceiptModal'));
const ReceiptPage = lazy(() => import('./components/ReceiptPage'));

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
  const { dict } = useThemeLang();
  const [activeTab, setActiveTab] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const isOwner = profile?.role === 'owner';

  const kasirTabs = [
    { id: 'pos', label: dict.tabs.pos, icon: ShoppingBag },
    { id: 'price', label: dict.tabs.price, icon: Tag },
    { id: 'shift', label: dict.tabs.shift, icon: Clock },
    { id: 'stock_requests', label: dict.tabs.stockRequests, icon: PackagePlus },
    { id: 'reports', label: dict.tabs.reports, icon: BarChart3 },
  ];

  const ownerTabs = [
    { id: 'live', label: dict.tabs.live, icon: Radio, isLive: true },
    { id: 'reports', label: dict.tabs.ownerReports, icon: BarChart3 },
    { id: 'inventory', label: dict.tabs.inventory, icon: Boxes },
    { id: 'owner_shifts', label: dict.tabs.ownerShifts, icon: ClipboardList },
    { id: 'staff', label: dict.tabs.staff, icon: Users },
    { id: 'pos', label: dict.tabs.ownerPos, icon: ShoppingBag },
  ];

  const tabs = isOwner ? ownerTabs : kasirTabs;
  const defaultTab = isOwner ? 'live' : 'pos';
  const allowedTabIds = isOwner
    ? [...ownerTabs.map((t) => t.id), 'shift']
    : kasirTabs.map((t) => t.id);

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
          <p className="muted-text">{dict.loadingSession}</p>
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
                {dict.appSubtitle} • <code>v{APP_VERSION}</code>
              </span>
            </div>
          </div>

          <div className="user-bar">
            <ThemeLangToggles compact />
            <div className="user-meta">
              <span className="user-name">{profile.full_name}</span>
              <span className={`badge ${isOwner ? 'badge-owner' : ''}`}>
                {profile.role.toUpperCase()}
              </span>
              <span
                className={`status-pill ${activeShift ? 'status-open' : 'status-closed'}`}
              >
                {dict.shiftLabel}: {activeShift ? dict.openStatus : dict.closedStatus}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={signOut}
              title={dict.logout}
            >
              <LogOut size={15} />
              <span>{dict.logout}</span>
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
                {tab.isLive && <span className="live-dot" aria-hidden="true" />}
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
            <p className="muted-text">{dict.loadingStore}</p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="card">
                <p className="muted-text">{dict.loadingModule}</p>
              </div>
            }
          >
            {currentTab === 'live' && isOwner && (
              <OwnerLiveMonitor onProductsChanged={refreshProducts} />
            )}
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
            {currentTab === 'stock_requests' && (
              <StockRequestPanel products={products} />
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

  return (
    <ThemeLangProvider>
      {invoiceNumber ? (
        <Suspense
          fallback={
            <div className="receipt-public-page">
              <p className="muted-text">Loading...</p>
            </div>
          }
        >
          <ReceiptPage invoiceNumber={invoiceNumber} />
        </Suspense>
      ) : (
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      )}
    </ThemeLangProvider>
  );
}
