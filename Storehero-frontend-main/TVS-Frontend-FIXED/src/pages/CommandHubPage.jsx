import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, PieChart, Pie, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { RefreshCw, ExternalLink, AlertTriangle, Send, Brain, ChevronDown, ChevronUp, ShieldCheck, Sparkles, Activity, Play, BarChart3 } from 'lucide-react';

function safeStr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.text) return val.text;
    if (val.message) return val.message;
    if (val.name && val.timestamp) return val.name + ' — ' + new Date(val.timestamp).toLocaleDateString();
    if (val.label) return val.label;
    return Object.values(val).filter(v => typeof v === 'string' || typeof v === 'number').join(' · ');
  }
  return String(val);
}

function fmtVal(k, v) {
  if (typeof v !== 'number') return safeStr(v);
  if (k.includes('revenue') || k.includes('amount') || k.includes('ltv') || k.includes('recovered') || k.includes('profit') || k.includes('spend')) return '$' + v.toLocaleString();
  if (k.includes('pct') || k.includes('rate')) return v + '%';
  return v > 10000 ? fmt.compact(v) : v.toLocaleString();
}

const scoreColor = (s) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';
const sevColor = { high: '#dc2626', medium: '#d97706', low: '#64748b' };

export default function CommandHubPage() {
  const [expanded, setExpanded] = useState(null);
  const [range, setRange] = useState('30d');
  const [sending, setSending] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [chat, setChat] = useState([]);
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const { data, loading, refetch } = useApi('/hub/products', {}, []);
  const { data: auditData, refetch: refetchAudit } = useApi('/hub/audit-history', {}, []);
  const { data: storeAnalytics } = useApi('/hub/product/tvs_store/analytics', { range }, [range]);
  const toast = useToast();

  const products = data?.products || [];
  const apps = products.filter(p => p.id !== 'tvs_store');
  const store = products.find(p => p.id === 'tvs_store');
  const connected = products.filter(p => p.stats?.connected).length;
  const down = products.filter(p => !p.stats?.connected && p.stats?.error && !p.stats.error.includes('not configured')).length;

  const latestAudits = auditData?.latest || [];
  const auditByProduct = Object.fromEntries(latestAudits.map(a => [a.product_id, a]));
  const avgScore = latestAudits.length ? Math.round(latestAudits.reduce((s, a) => s + (+a.score || 0), 0) / latestAudits.length) : null;

  // Chart data
  const scoreBars = latestAudits.map(a => ({ name: a.product_name, score: +a.score || 0 }));
  const revenueBars = products
    .map(p => {
      const m = p.stats?.metrics || {};
      const key = Object.keys(m).find(k => /revenue|sales|mrr/.test(k) && typeof m[k] === 'number');
      return key ? { name: p.name, revenue: Math.round(m[key]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.revenue - a.revenue);

  // Average portfolio score over time
  const trendMap = {};
  (auditData?.history || []).forEach(h => {
    const d = new Date(h.audited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trendMap[d]) trendMap[d] = { sum: 0, n: 0 };
    trendMap[d].sum += +h.score || 0; trendMap[d].n += 1;
  });
  const scoreTrend = Object.entries(trendMap).map(([date, v]) => ({ date, score: Math.round(v.sum / v.n) }));

  // Store time-series for the hub trend charts
  const sSeries = storeAnalytics?.series || [];
  const sBy = (name) => (sSeries.find(s => s.name === name)?.points || []);
  const trend = sBy('Revenue').map((pt, i) => ({
    date: new Date(pt.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: +pt.y || 0,
    profit: +(sBy('Net Profit')[i]?.y) || 0,
    orders: +(sBy('Orders')[i]?.y) || 0,
    adspend: +(sBy('Ad Spend')[i]?.y) || 0,
  }));
  const setupCount = Math.max(0, products.length - connected - down);
  const statusDonut = [
    { label: 'Live', value: connected, color: '#16a34a' },
    { label: 'Down', value: down, color: '#dc2626' },
    { label: 'Setup', value: setupCount, color: '#cbd5e1' },
  ].filter(d => d.value > 0);

  const runAudit = async () => {
    setAuditing(true);
    try { const { data: d } = await api.post('/hub/audit-all'); toast.success(`Audited ${d.audited}/${d.total} products`); refetchAudit(); }
    catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setAuditing(false); }
  };

  const askAI = async (product) => {
    setAiLoading(product.id);
    try {
      const { data: d } = await api.post('/ai/analyze', { question: 'You are analyzing "' + product.name + '" (' + product.desc + '). Live data: ' + JSON.stringify(product.stats?.metrics || {}) + '. Give: 1) Health score /10 with one-line verdict. 2) What is going well (be specific with numbers). 3) What needs attention. 4) Top 3 action items for this week. Use bullet points.' });
      setAiResults(prev => ({ ...prev, [product.id]: d }));
    } catch (e) { toast.error('AI failed: ' + (e.response?.data?.error || e.message)); }
    finally { setAiLoading(null); }
  };

  const sendDigest = async () => {
    setSending(true);
    try { const { data: d } = await api.post('/hub/weekly-digest'); toast.success('Digest sent to ' + d.recipients + ' recipient(s)'); }
    catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSending(false); }
  };

  const ask = async () => {
    const question = q.trim();
    if (!question || asking) return;
    setChat(prev => [...prev, { role: 'user', text: question }]);
    setQ(''); setAsking(true);
    try { const { data: d } = await api.post('/hub/ask', { question }); setChat(prev => [...prev, { role: 'ai', text: d.answer }]); }
    catch (e) { setChat(prev => [...prev, { role: 'ai', text: '⚠️ ' + (e.response?.data?.error || e.message) }]); }
    finally { setAsking(false); }
  };

  return (
    <div>
      <PageHeader title="Command Hub" subtitle={connected + ' of ' + products.length + ' products live' + (down > 0 ? ' · ' + down + ' down' : '')}>
        <button onClick={() => { refetch(); refetchAudit(); }} className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><RefreshCw size={14} /> Refresh</button>
        <button onClick={runAudit} disabled={auditing} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{auditing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Run Full Audit</button>
        <button onClick={sendDigest} disabled={sending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Weekly Digest</button>
      </PageHeader>

      {loading ? <SkeletonCards count={6} /> : (<>
        {/* Executive strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Portfolio Health</div>
            <div className="font-display font-bold text-3xl mt-1" style={{ color: avgScore == null ? '#64748b' : scoreColor(avgScore) }}>{avgScore == null ? '—' : avgScore}</div>
            <div className="text-[11px] text-slate-400">{avgScore == null ? 'Run an audit' : 'avg score'}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4"><div className="text-[10px] text-surface-400 uppercase">Live</div><div className="font-display font-bold text-3xl text-emerald-600">{connected}</div><div className="text-xs text-surface-400">of {products.length}</div></div>
          <div className={`rounded-2xl border p-4 ${down > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}><div className="text-[10px] text-surface-400 uppercase">Down</div><div className={`font-display font-bold text-3xl ${down > 0 ? 'text-red-600' : 'text-surface-300'}`}>{down}</div></div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4"><div className="text-[10px] text-surface-400 uppercase">Store Rev 30d</div><div className="font-display font-bold text-2xl text-surface-800 dark:text-surface-100 mt-1">{fmt.compact(store?.stats?.metrics?.revenue_30d || 0)}</div><div className="text-[11px] text-surface-400">{fmt.number(store?.stats?.metrics?.orders_30d || 0)} orders</div></div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4"><div className="text-[10px] text-surface-400 uppercase">Store Profit 30d</div><div className={`font-display font-bold text-2xl mt-1 ${(store?.stats?.metrics?.net_profit_30d || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt.compact(store?.stats?.metrics?.net_profit_30d || 0)}</div></div>
        </div>

        {/* Charts */}
        <div className="space-y-4 mb-6">
          {/* Hero: Revenue & Profit trend */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2"><Activity size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Store Revenue & Profit</h3></div>
              <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
                {['7d', '30d', '90d'].map(r => (
                  <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 shadow-sm' : 'text-surface-400'}`}>{r}</button>
                ))}
              </div>
            </div>
            {trend.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1c349" stopOpacity={0.35} /><stop offset="100%" stopColor="#f1c349" stopOpacity={0} /></linearGradient>
                    <linearGradient id="hPro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + fmt.compact(v)} width={48} />
                  <Tooltip formatter={(v, n) => [fmt.currency(v), n]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f1c349" strokeWidth={2.5} fill="url(#hRev)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#16a34a" strokeWidth={2} fill="url(#hPro)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[280px] flex items-center justify-center text-sm text-surface-400">No store data for this range yet</div>}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Orders & Ad spend */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
              <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Orders & Ad Spend</h3></div>
              {trend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={trend} margin={{ top: 5, right: 6, left: -10, bottom: 0 }}>
                    <defs><linearGradient id="hOrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={28} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + fmt.compact(v)} width={44} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area yAxisId="l" type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2} fill="url(#hOrd)" />
                    <Line yAxisId="r" type="monotone" dataKey="adspend" name="Ad Spend" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="h-[220px] flex items-center justify-center text-sm text-surface-400">No data</div>}
            </div>

            {/* Product status donut */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
              <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Product Status</h3></div>
              {statusDonut.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusDonut} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} label={(e) => `${e.label} ${e.value}`}>
                      {statusDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[220px] flex items-center justify-center text-sm text-surface-400">No products</div>}
            </div>
          </div>

          {(scoreBars.length > 0 || revenueBars.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-4">
              {scoreBars.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
                  <div className="flex items-center gap-2 mb-4"><ShieldCheck size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Audit Scores</h3></div>
                  <ResponsiveContainer width="100%" height={Math.max(180, scoreBars.length * 30)}>
                    <BarChart data={scoreBars} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]}>{scoreBars.map((e, i) => <Cell key={i} fill={scoreColor(e.score)} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {revenueBars.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
                  <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Revenue by Product</h3></div>
                  <ResponsiveContainer width="100%" height={Math.max(180, revenueBars.length * 30)}>
                    <BarChart data={revenueBars} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + fmt.compact(v)} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={v => fmt.currency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill="#f1c349" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ask about all businesses */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/10 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-indigo-500" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Ask about all your businesses</h3></div>
          {chat.length > 0 && (
            <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
              {chat.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm max-w-[90%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 text-surface-700 dark:text-surface-200 whitespace-pre-line text-left'}`}>{m.text}</div>
                </div>
              ))}
              {asking && <div className="text-xs text-surface-400 flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Thinking across all products…</div>}
            </div>
          )}
          <div className="flex gap-2">
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="e.g. Which product needs my attention most this week?" className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button onClick={ask} disabled={asking || !q.trim()} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">Ask</button>
          </div>
        </div>

        {/* Products — Accordion with audit detail */}
        <div className="space-y-3">
          {products.map((p) => {
            const s = p.stats || {};
            const isConnected = s.connected;
            const isDown = !isConnected && s.error && !s.error.includes('not configured');
            const isExpanded = expanded === p.id;
            const metrics = s.metrics || {};
            const metricEntries = Object.entries(metrics);
            const ai = aiResults[p.id];
            const audit = auditByProduct[p.id];
            const findings = audit ? (Array.isArray(audit.findings) ? audit.findings : (() => { try { return JSON.parse(audit.findings || '[]'); } catch { return []; } })()) : [];
            const recs = audit ? (Array.isArray(audit.recommendations) ? audit.recommendations : (() => { try { return JSON.parse(audit.recommendations || '[]'); } catch { return []; } })()) : [];

            return (
              <div key={p.id} className={`rounded-2xl border overflow-hidden transition-all bg-white dark:bg-surface-800 ${isConnected ? 'border-emerald-200 dark:border-emerald-800' : isDown ? 'border-red-200 dark:border-red-800' : 'border-surface-200 dark:border-surface-700'}`}>
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm dark:text-surface-200">{p.name}</div>
                    <div className="text-[11px] text-surface-400">{p.desc}</div>
                  </div>
                  {audit && audit.score != null && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: scoreColor(audit.score) + '1a', color: scoreColor(audit.score) }}><ShieldCheck size={12} /> {audit.score}</span>
                  )}
                  {isConnected && metricEntries.length > 0 && (
                    <div className="hidden md:flex gap-4">
                      {metricEntries.slice(0, 3).map(([k, v]) => (
                        <div key={k} className="text-right"><div className="text-[9px] text-surface-400 uppercase">{k.replace(/_/g, ' ')}</div><div className="font-mono font-bold text-sm dark:text-surface-200">{fmtVal(k, v)}</div></div>
                      ))}
                    </div>
                  )}
                  <span className={`text-xs font-bold whitespace-nowrap ml-2 ${isConnected ? 'text-emerald-500' : isDown ? 'text-red-500' : 'text-surface-400'}`}>{isConnected ? '● Live' : isDown ? '● Down' : '○ Setup'}</span>
                  {isExpanded ? <ChevronUp size={16} className="text-surface-400 ml-1" /> : <ChevronDown size={16} className="text-surface-400 ml-1" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-surface-100 dark:border-surface-700 p-4 sm:p-6 bg-surface-50/50 dark:bg-surface-900/30">
                    {!isConnected ? (
                      <div className="text-center py-6">
                        <AlertTriangle size={28} className="mx-auto mb-2 text-surface-300" />
                        <p className="text-sm text-surface-400 mb-2">{isDown ? 'Cannot reach this product.' : 'Not configured yet.'}</p>
                        {s.error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 inline-block">{safeStr(s.error)}</p>}
                        <p className="text-xs text-surface-400 mt-3">Go to Settings → "Hub: {p.name}" → enter Backend URL + API Key</p>
                      </div>
                    ) : (
                      <>
                        {metricEntries.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                            {metricEntries.map(([k, v]) => (
                              <div key={k} className="bg-white dark:bg-surface-800 rounded-xl p-3 border border-surface-100 dark:border-surface-700">
                                <div className="text-[10px] text-surface-400 uppercase tracking-wider">{k.replace(/_/g, ' ')}</div>
                                <div className="font-display font-bold text-xl mt-1 dark:text-surface-200">{fmtVal(k, v)}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {audit && (
                          <div className="mb-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-100 dark:border-surface-700 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2"><ShieldCheck size={15} style={{ color: scoreColor(audit.score) }} /><span className="font-display font-bold text-xs dark:text-surface-100">Latest Audit</span></div>
                              <span className="text-[10px] text-surface-400">{new Date(audit.audited_at).toLocaleDateString()}</span>
                            </div>
                            {audit.summary && <p className="text-sm text-surface-600 dark:text-surface-300 mb-3">{audit.summary}</p>}
                            {findings.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {findings.slice(0, 5).map((f, j) => (
                                  <div key={j} className="flex items-start gap-2 text-xs">
                                    <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: (sevColor[f.severity] || '#64748b') + '1a', color: sevColor[f.severity] || '#64748b' }}>{f.severity || 'info'}</span>
                                    <span className="text-surface-600 dark:text-surface-300"><strong>{f.title}</strong>{f.detail ? ' — ' + f.detail : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {recs.length > 0 && (
                              <div className="bg-surface-50 dark:bg-surface-700/40 rounded-lg p-3">
                                <div className="text-[10px] uppercase text-surface-400 font-bold mb-1.5">Recommended actions</div>
                                <ul className="space-y-1">{recs.slice(0, 5).map((r, j) => <li key={j} className="text-xs text-surface-600 dark:text-surface-300 flex gap-2"><span className="text-amber-500">→</span>{safeStr(r)}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        )}

                        {(s.recentActivity || []).length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-bold text-surface-400 uppercase mb-2">Recent Activity</div>
                            <div className="space-y-1">{(s.recentActivity || []).slice(0, 8).map((a, j) => (
                              <div key={j} className="text-xs p-2.5 bg-white dark:bg-surface-800 rounded-lg border border-surface-100 dark:border-surface-700 text-surface-600 dark:text-surface-400">{safeStr(a)}</div>
                            ))}</div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Link to={`/hub/${p.id}`} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold"><BarChart3 size={14} /> View Analytics</Link>
                          <button onClick={() => askAI(p)} disabled={aiLoading === p.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                            {aiLoading === p.id ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                            {aiLoading === p.id ? 'Analyzing...' : 'AI Situation Report'}
                          </button>
                          {p.defaultUrl && <a href={p.defaultUrl} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-300 dark:text-surface-200">Open App <ExternalLink size={12} /></a>}
                        </div>

                        {ai && (
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
                            <div className="flex items-center gap-2 mb-2"><Brain size={16} className="text-indigo-500" /><span className="font-display font-bold text-xs">AI Situation Report</span></div>
                            <div className="text-sm leading-relaxed whitespace-pre-line dark:text-surface-300">{ai.answer}</div>
                            <p className="text-[10px] text-surface-400 mt-2">{new Date(ai.generatedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>)}
    </div>
  );
}
