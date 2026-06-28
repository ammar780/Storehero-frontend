import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import { SkeletonCards } from '../components/Skeleton';
import { Globe, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertTriangle, Send, Zap, ChevronDown, ChevronRight } from 'lucide-react';

const statusBadge = (s) => {
  if (s === 'healthy' || s === true) return <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={12}/> Live</span>;
  if (s === 'down') return <span className="flex items-center gap-1 text-xs text-red-600"><XCircle size={12}/> Down</span>;
  return <span className="flex items-center gap-1 text-xs text-surface-400"><AlertTriangle size={12}/> Not connected</span>;
};

function ProductCard({ product, onSelect, selected }) {
  const s = product.stats || {};
  const connected = s.connected;
  return (
    <button onClick={() => onSelect(selected === product.id ? null : product.id)}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === product.id ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-brand-300'}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{product.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm dark:text-surface-200">{product.name}</div>
          <div className="text-xs text-surface-400 truncate">{product.desc}</div>
        </div>
        {statusBadge(connected ? 'healthy' : 'not_configured')}
      </div>
      {connected && s.metrics && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {Object.entries(s.metrics || {}).slice(0, 3).map(([k, v]) => (
            <div key={k} className="text-center bg-surface-50 dark:bg-surface-700 rounded-lg p-2">
              <div className="text-[10px] text-surface-400 uppercase">{k.replace(/_/g, ' ')}</div>
              <div className="font-mono font-bold text-sm">{typeof v === 'number' && v > 100 ? fmt.number(v) : v}</div>
            </div>
          ))}
        </div>
      )}
      {!connected && (
        <div className="mt-2 text-xs text-surface-400">
          Configure in Settings → Hub Connections
        </div>
      )}
    </button>
  );
}

function ProductDetail({ product }) {
  const { data, loading } = useApi('/hub/product/' + product.id, {}, [product.id]);
  const s = data?.product?.stats || {};
  
  if (loading) return <SkeletonCards count={4} />;
  if (!s.connected) return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 text-center">
      <span className="text-4xl mb-3 block">{product.icon}</span>
      <h3 className="font-display font-bold text-lg mb-2 dark:text-surface-200">{product.name}</h3>
      <p className="text-sm text-surface-400 mb-4">Not connected yet. Add this product's URL and API key in Settings.</p>
      {s.error && <p className="text-xs text-red-500">Error: {s.error}</p>}
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-3xl">{product.icon}</span>
        <div>
          <h3 className="font-display font-bold text-lg dark:text-surface-200">{product.name}</h3>
          <p className="text-xs text-surface-400">{product.desc}</p>
        </div>
        {statusBadge(s.connected ? 'healthy' : 'down')}
        {product.defaultUrl && (
          <a href={product.defaultUrl} target="_blank" rel="noopener" className="ml-auto flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600">
            Open <ExternalLink size={12}/>
          </a>
        )}
      </div>
      
      {s.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {Object.entries(s.metrics).map(([k, v]) => (
            <div key={k} className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3 text-center">
              <div className="text-[10px] text-surface-400 uppercase">{k.replace(/_/g, ' ')}</div>
              <div className="font-display font-bold text-lg">{typeof v === 'number' ? (v > 1000 ? fmt.number(v) : v) : v}</div>
            </div>
          ))}
        </div>
      )}
      
      {s.recentActivity && (
        <div>
          <h4 className="text-xs font-bold text-surface-400 uppercase mb-2">Recent Activity</h4>
          <div className="space-y-1">
            {(s.recentActivity || []).slice(0, 5).map((a, i) => (
              <div key={i} className="text-xs text-surface-500 dark:text-surface-400 p-2 bg-surface-50 dark:bg-surface-700 rounded-lg">{a}</div>
            ))}
          </div>
        </div>
      )}
      
      {s.actions && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-surface-400 uppercase mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            {(s.actions || []).map((a, i) => (
              <button key={i} className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold">{a.label}</button>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-[10px] text-surface-400 mt-4">Last fetched: {s.lastFetched ? new Date(s.lastFetched).toLocaleString() : 'Never'}</p>
    </div>
  );
}

export default function CommandHubPage() {
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const { data, loading, refetch } = useApi('/hub/products', {}, []);
  const toast = useToast();
  const products = data?.products || [];
  const connected = products.filter(p => p.stats?.connected).length;
  const selectedProduct = products.find(p => p.id === selected);

  const sendDigest = async () => {
    setSending(true);
    try {
      const { data: d } = await api.post('/hub/weekly-digest');
      toast.success('Weekly digest sent to ' + d.recipients + ' recipients');
    } catch(e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader title="Command Hub" subtitle={"Manage all " + products.length + " products from one place — " + connected + " connected"}>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><RefreshCw size={14}/> Refresh</button>
        <button onClick={sendDigest} disabled={sending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          {sending ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} {sending ? 'Sending...' : 'Send Weekly Digest'}
        </button>
      </PageHeader>

      {loading ? <SkeletonCards count={6}/> : (<>
        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onSelect={setSelected} selected={selected} />
          ))}
        </div>

        {/* Selected Product Detail */}
        {selectedProduct && <ProductDetail product={selectedProduct} />}

        {/* Not connected prompt */}
        {connected === 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 mt-6">
            <h3 className="font-display font-bold text-sm mb-2 dark:text-surface-200">How to Connect Your Products</h3>
            <ol className="text-sm text-surface-500 dark:text-surface-400 space-y-2 list-decimal list-inside">
              <li>Add the hub connector to each product's backend (paste the prompt below into each product's Claude chat)</li>
              <li>Deploy the updated backend</li>
              <li>Go to Settings → scroll to "Hub Connections" → add the product URL + API key</li>
              <li>Come back here and click Refresh — the product will show its stats</li>
            </ol>
          </div>
        )}
      </>)}
    </div>
  );
}
