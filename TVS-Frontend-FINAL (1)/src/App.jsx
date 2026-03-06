import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Megaphone, Palette, DollarSign, TrendingUp, Users, Target, LineChart, Zap, Calculator, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, Moon, Sun } from 'lucide-react';

import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import MarketingPage from './pages/MarketingPage';
import CreativesPage from './pages/CreativesPage';
import FinancePage from './pages/FinancePage';
import LTVPage from './pages/LTVPage';
import CustomersPage from './pages/CustomersPage';
import GoalsPage from './pages/GoalsPage';
import ForecastPage from './pages/ForecastPage';
import ScenarioPage from './pages/ScenarioPage';
import CalculatorsPage from './pages/CalculatorsPage';
import SettingsPage from './pages/SettingsPage';
import TaxExportPage from './pages/TaxExportPage';
import InventoryPage from './pages/InventoryPage';
import AIPage from './pages/AIPage';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', group: 'core' },
  { to: '/products', icon: Package, label: 'Products', group: 'core' },
  { to: '/inventory', icon: Package, label: 'Inventory', group: 'core' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', group: 'core' },
  { type: 'divider', label: 'MARKETING' },
  { to: '/marketing', icon: Megaphone, label: 'Marketing', group: 'marketing' },
  { to: '/creatives', icon: Palette, label: 'Creatives', group: 'marketing' },
  { type: 'divider', label: 'FINANCE' },
  { to: '/finance', icon: DollarSign, label: 'P&L', group: 'finance' },
  { to: '/ltv', icon: TrendingUp, label: 'LTV & Cohorts', group: 'finance' },
  { to: '/customers', icon: Users, label: 'Customers', group: 'finance' },
  { type: 'divider', label: 'PLANNING' },
  { to: '/goals', icon: Target, label: 'Goals', group: 'planning' },
  { to: '/forecast', icon: LineChart, label: 'Forecast', group: 'planning' },
  { to: '/scenarios', icon: Zap, label: 'Scenarios', group: 'planning' },
  { to: '/ai', icon: Zap, label: 'AI Advisor', group: 'planning' },
  { to: '/calculators', icon: Calculator, label: 'Calculators', group: 'planning' },
  { to: '/tax-export', icon: Calculator, label: 'Tax Export', group: 'planning' },
  { type: 'divider', label: '' },
  { to: '/settings', icon: Settings, label: 'Settings', group: 'system' },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} flex-shrink-0 bg-brand-950 flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-white font-display font-bold text-lg">V</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="font-display font-bold text-white text-sm tracking-tight leading-none">TVS Profit</div>
            <div className="text-[10px] text-brand-400 font-medium tracking-widest uppercase mt-0.5">Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {nav.map((item, i) => {
          if (item.type === 'divider') {
            return !collapsed ? (
              <div key={i} className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-semibold text-brand-600 tracking-[0.15em] uppercase">{item.label}</span>
              </div>
            ) : <div key={i} className="pt-3 pb-1"><div className="h-px bg-brand-800/50 mx-2" /></div>;
          }
          const Icon = item.icon;
          const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active ? 'bg-brand-500/20 text-brand-300 shadow-sm' : 'text-brand-400/70 hover:text-brand-300 hover:bg-white/[0.04]'}`}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={`flex-shrink-0 transition-colors ${active ? 'text-brand-400' : 'text-brand-600 group-hover:text-brand-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-brand-800/30">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-brand-500 hover:text-brand-300 hover:bg-white/[0.04] transition-all text-xs">
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span>Collapse</span></>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl hover:bg-white/[0.04] transition-all group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-display font-bold text-[11px] flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-brand-200 font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-brand-500 truncate">{user.email}</div>
            </div>
            <button onClick={logout} title="Sign out" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/20 text-brand-500 hover:text-red-400">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const nav = { 'd': '/', 'p': '/products', 'o': '/orders', 'm': '/marketing', 'f': '/finance', 's': '/settings', 'g': '/goals', 'c': '/calculators', 'l': '/ltv' };
      if (nav[e.key]) { e.preventDefault(); window.location.hash = ''; window.location.pathname = nav[e.key]; }
      if (e.key === '?') { e.preventDefault(); alert('Keyboard Shortcuts:\nD=Dashboard  P=Products  O=Orders\nM=Marketing  F=Finance  S=Settings\nG=Goals  C=Calculators  L=LTV'); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar - desktop */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar - mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-surface-100 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-surface-100">
            <Menu size={20} />
          </button>
          <div className="font-display font-bold text-brand-900 dark:text-brand-300 text-sm">TVS Profit</div>
          <button onClick={toggleDark} className="ml-auto p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto dark:text-surface-200">
          {children}
        </div>
      </main>
    </div>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-brand-950">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse-soft">
          <span className="text-white font-display font-bold text-2xl">V</span>
        </div>
        <div className="text-brand-300 font-display font-medium text-sm">Loading dashboard...</div>
        <div className="mt-4 w-32 h-1 bg-brand-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full w-1/2 bg-brand-400 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, setupRequired } = useAuth();

  if (loading) return <LoadingScreen />;
  if (setupRequired) return <SetupPage />;
  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/creatives" element={<CreativesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/ltv" element={<LTVPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/scenarios" element={<ScenarioPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/calculators" element={<CalculatorsPage />} />
        <Route path="/tax-export" element={<TaxExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
