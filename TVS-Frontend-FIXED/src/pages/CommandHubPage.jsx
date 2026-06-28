import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonCards } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertTriangle, Send, Zap, Brain, ArrowRight, TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react';

const COLORS = ['#f1c349','#3b82f6','#22c55e','#ef4444','#8b5cf6','#ec4899','#f59e0b','#14b8a6','#6366f1','#d946ef','#0ea5e9'];

const healthColor = (s) => s === true || s === 'healthy' ? 'text-emerald-500' : s === 'down' ? 'text-red-500' : 'text-surface-400';
const healthBg = (s) => s === true || s === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : s === 'down' ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700';
const healthLabel = (s) => s === true || s === 'healthy' ? '● Live' : s === 'down' ? '● Down' : '○ Not connected';

function safeStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return val.text || val.message || val.name || val.label || JSON.stringify(val);
  return String(val);
}

function ProductDetail({ product, onAskAI }) {
  const s = product.stats || {};
  const connected = s.connected;
  const metrics = s.metrics || {};
  const metricEntries = Object.entries(metrics);

  if (!connected) return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
      <div className="flex items-center gap-3 mb-4"><span className="text-3xl">{product.icon}</span><div><div className="font-display font-bold text-lg dark:text-surface-200">{product.name}</div><div className="text-xs text-surface-400">{product.desc}</div></div></div>
      <div className="text-center py-8"><AlertTriangle size={32} className="mx-auto mb-3 text-surface-300"/><p className="text-sm text-surface-400">Not connected. Go to Settings → find "Hub: {product.name}" → enter Backend URL + API Key.</p>{s.error && <p className="text-xs text-red-500 mt-2">{safeStr(s.error)}</p>}</div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-3xl">{product.icon}</span>
        <div className="flex-1 min-w-0"><div className="font-display font-bold text-lg dark:text-surface-200">{product.name}</div><div className="text-xs text-surface-400">{product.desc}</div></div>
        <span className={`text-xs font-bold ${healthColor(connected?'healthy':'down')}`}>{healthLabel(connected?'healthy':'down')}</span>
        {product.defaultUrl && <a href={product.defaultUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-brand-500 hover:underline">Open <ExternalLink size={12}/></a>}
      </div>

      {metricEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {metricEntries.map(([k, v]) => (
            <div key={k} className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
              <div className="text-[10px] text-surface-400 uppercase tracking-wider">{k.replace(/_/g, ' ')}</div>
              <div className="font-display font-bold text-xl mt-1 dark:text-surface-200">{typeof v === 'number' ? (v > 1000 ? fmt.number(v) : v) : safeStr(v)}</div>
            </div>
          ))}
        </div>
      )}

      {s.recentActivity && (s.recentActivity||[]).length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-surface-400 uppercase mb-2">Recent Activity</div>
          <div className="space-y-1">{(s.recentActivity||[]).slice(0,5).map((a,i) => (
            <div key={i} className="text-xs p-2 bg-surface-50 dark:bg-surface-700 rounded-lg text-surface-500 dark:text-surface-400">{safeStr(a)}</div>
          ))}</div>
        </div>
      )}

      <button onClick={() => onAskAI(product)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold mt-2"><Brain size={14}/> AI Analysis of {product.name}</button>
      <p className="text-[10px] text-surface-400 mt-2">Last fetched: {s.lastFetched ? new Date(s.lastFetched).toLocaleString() : 'Never'}</p>
    </div>
  );
}

export default function CommandHubPage() {
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [period, setPeriod] = useState('30d');
  const { data, loading, refetch } = useApi('/hub/products', {}, []);
  const toast = useToast();
  const products = (data?.products || []);
  const connected = products.filter(p => p.stats?.connected).length;
  const down = products.filter(p => p.stats?.connected === false && p.stats?.error && !p.stats?.error.includes('not configured')).length;
  const selectedProduct = products.find(p => p.id === selected);

  const pieData = products.filter(p => p.stats?.connected).map((p,i) => ({ name: p.name, value: Object.values(p.stats?.metrics||{}).find(v => typeof v === 'number') || 1 }));

  const askAI = async (product) => {
    setAiLoading(true); setAiResult(null);
    try {
      const { data: d } = await api.post('/ai/analyze', { question: 'Analyze the current situation of ' + product.name + '. Here is its live data: ' + JSON.stringify(product.stats?.metrics || {}) + '. Give a health score out of 10, list what is going well, what needs attention, and give 3 specific action items. Be specific with numbers.' });
      setAiResult({ product: product.name, ...d });
    } catch(e) { toast.error('AI analysis failed: ' + (e.response?.data?.error || e.message)); }
    finally { setAiLoading(false); }
  };

  const sendDigest = async () => {
    setSending(true);
    try { const { data: d } = await api.post('/hub/weekly-digest'); toast.success('Weekly digest sent to ' + d.recipients + ' recipients'); }
    catch(e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader title="Command Hub" subtitle={connected + ' of ' + products.length + ' products live' + (down > 0 ? ' · ' + down + ' down' : '')}>
        <PeriodPicker value={period} onChange={setPeriod} />
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><RefreshCw size={14}/> Refresh All</button>
        <button onClick={sendDigest} disabled={sending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{sending ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} Weekly Digest</button>
      </PageHeader>

      {loading ? <SkeletonCards count={6}/> : (<>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4"><div className="text-xs text-surface-400 uppercase">Live Products</div><div className="font-display font-bold text-3xl text-emerald-600">{connected}</div><div className="text-xs text-surface-400">of {products.length} total</div></div>
          <div className={`rounded-2xl border p-4 ${down > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}><div className="text-xs text-surface-400 uppercase">Down</div><div className={`font-display font-bold text-3xl ${down > 0 ? 'text-red-600' : 'text-surface-300'}`}>{down}</div><div className="text-xs text-surface-400">{down > 0 ? 'needs attention' : 'all healthy'}</div></div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4"><div className="text-xs text-surface-400 uppercase">Not Connected</div><div className="font-display font-bold text-3xl text-surface-400">{products.length - connected}</div><div className="text-xs text-surface-400">pending setup</div></div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4"><div className="text-xs text-surface-400 uppercase">System Status</div><div className="font-display font-bold text-xl text-indigo-600 mt-1">{down === 0 && connected > 0 ? 'All Systems Go' : connected === 0 ? 'Setup Needed' : 'Issues Detected'}</div></div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {products.map((p, i) => {
            const s = p.stats || {};
            const isConnected = s.connected;
            const metrics = s.metrics || {};
            const metricEntries = Object.entries(metrics);
            return (
              <button key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                className={`w-full text-left rounded-2xl border transition-all p-4 ${selected === p.id ? 'ring-2 ring-brand-500 border-brand-500' : ''} ${healthBg(isConnected ? 'healthy' : s.error ? 'down' : 'off')}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1 min-w-0"><div className="font-display font-bold text-sm dark:text-surface-200">{p.name}</div><div className="text-[11px] text-surface-400 truncate">{p.desc}</div></div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${healthColor(isConnected?'healthy':s.error?'down':'off')}`}>{healthLabel(isConnected?'healthy':s.error?'down':'off')}</span>
                </div>
                {isConnected && metricEntries.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {metricEntries.slice(0,3).map(([k,v]) => (
                      <div key={k} className="text-center bg-white/60 dark:bg-surface-800/60 rounded-lg p-1.5">
                        <div className="text-[9px] text-surface-400 uppercase truncate">{k.replace(/_/g,' ')}</div>
                        <div className="font-mono font-bold text-sm dark:text-surface-200">{typeof v==='number'?(v>1000?fmt.compact(v):v):safeStr(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!isConnected && <div className="text-[11px] text-surface-400 mt-1">Configure in Settings → Hub Connections</div>}
              </button>
            );
          })}
        </div>

        {/* Selected Product Detail */}
        {selectedProduct && <ProductDetail product={selectedProduct} onAskAI={askAI} />}

        {/* AI Analysis Result */}
        {aiLoading && <div className="flex items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 mt-4"><RefreshCw size={16} className="animate-spin text-indigo-500"/><span className="text-sm">Claude is analyzing {selectedProduct?.name}...</span></div>}
        {aiResult && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 mt-4">
            <div className="flex items-center gap-2 mb-3"><Brain size={18} className="text-indigo-500"/><span className="font-display font-bold text-sm dark:text-surface-200">AI Analysis: {aiResult.product}</span></div>
            <div className="text-sm leading-relaxed whitespace-pre-line dark:text-surface-300">{aiResult.answer}</div>
            <p className="text-[10px] text-surface-400 mt-3">{new Date(aiResult.generatedAt).toLocaleString()}</p>
          </div>
        )}

        {/* Setup Guide */}
        {connected === 0 && (
          <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 mt-6">
            <h3 className="font-display font-bold text-sm mb-3 dark:text-surface-200">Setup Guide</h3>
            <div className="text-sm text-surface-500 dark:text-surface-400 space-y-2">
              <p>1. Add the hub connector to each product backend (use the HUB_CONNECTOR_PROMPT.md file)</p>
              <p>2. Deploy the updated product to Railway</p>
              <p>3. Go to Settings → scroll to "Hub:" cards → enter URL + API key</p>
              <p>4. Come back here → click Refresh All</p>
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
