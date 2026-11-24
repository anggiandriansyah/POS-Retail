'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
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
  type LucideIcon,
} from 'lucide-react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/useAuth';
import { useThemeLang } from '../contexts/useThemeLang';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { Product, ReceiptModalData } from '../types/pos';
import { APP_VERSION, STORE_INFO } from '../utils/format';
import LoginPage from '../components/LoginPage';
import ThemeLangToggles from '../components/ThemeLangToggles';

const PosCashier = dynamic(() => import('../components/PosCashier'), { ssr: false });
const PriceChecker = dynamic(() => import('../components/PriceChecker'), { ssr: false });
const InventoryManager = dynamic(() => import('../components/InventoryManager'), { ssr: false });
const ReportsView = dynamic(() => import('../components/ReportsView'), { ssr: false });
const ShiftManager = dynamic(() => import('../components/ShiftManager'), { ssr: false });
const StockRequestPanel = dynamic(() => import('../components/StockRequestPanel'), { ssr: false });
const OwnerLiveMonitor = dynamic(() => import('../components/OwnerLiveMonitor'), { ssr: false });
const OwnerShifts = dynamic(() => import('../components/OwnerShifts'), { ssr: false });
const StaffManager = dynamic(() => import('../components/StaffManager'), { ssr: false });
const ReceiptModal = dynamic(() => import('../components/ReceiptModal'), { ssr: false });

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isLive?: boolean;
}

async function queryProducts(): Promise<{ data: Product[]; error: string }> {
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
  return { data: (data as Product[]) || [], error: '' };
}

function AuthenticatedApp() {
  const { session, profile, activeShift, loading: authLoading, signOut } = useAuth();
  const { dict } = useThemeLang();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptModalData | null>(null);

  const isOwner = profile?.role === 'owner';

  const kasirTabs: TabItem[] = [
    { id: 'pos', label: dict.tabs.pos, icon: ShoppingBag },
    { id: 'price', label: dict.tabs.price, icon: Tag },
    { id: 'shift', label: dict.tabs.shift, icon: Clock },
    { id: 'stock_requests', label: dict.tabs.stockRequests, icon: PackagePlus },
    { id: 'reports', label: dict.tabs.reports, icon: BarChart3 },
  ];

  const ownerTabs: TabItem[] = [
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
  const isDevEnv = process.env.NEXT_PUBLIC_APP_ENV !== 'production';

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
          <>
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
          </>
        )}
      </main>

      <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
