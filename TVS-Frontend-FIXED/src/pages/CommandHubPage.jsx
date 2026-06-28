import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonCards } from '../components/Skeleton';
import { Globe, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertTriangle, Send, Brain, ChevronDown, ChevronUp } from 'lucide-react';

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
  if (k.includes('revenue') || k.includes('amount') || k.includes('ltv') || k.includes('recovered')) return '$' + v.toLocaleString();
  if (k.includes('pct') || k.includes('rate')) return v + '%';
  return v > 10000 ? fmt.compact(v) : v.toLocaleString();
}

export default function CommandHubPage() {
  const [expanded, setExpanded] = useState(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [period, setPeriod] = useState('30d');
  const { data, loading, refetch } = useApi('/hub/products', {}, []);
  const toast = useToast();
  const products = data?.products || [];
  const connected = products.filter(p => p.stats?.connected).length;
  const down = products.filter(p => !p.stats?.connected && p.stats?.error && !p.stats?.error.includes('not configured')).length;

  const askAI = async (product) => {
    setAiLoading(product.id);
    try {
      const { data: d } = await api.post('/ai/analyze', { question: 'You are analyzing "' + product.name + '" (' + product.desc + '). Live data: ' + JSON.stringify(product.stats?.metrics || {}) + '. Give: 1) Health score /10 with one-line verdict. 2) What is going well (be specific with numbers). 3) What needs attention. 4) Top 3 action items for this week. Use bullet points.' });
      setAiResults(prev => ({ ...prev, [product.id]: d }));
    } catch(e) { toast.error('AI failed: ' + (e.response?.data?.error || e.message)); }
    finally { setAiLoading(null); }
  };

  const sendDigest = async () => {
    setSending(true);
    try { const { data: d } = await api.post('/hub/weekly-digest'); toast.success('Digest sent to ' + d.recipients + ' recipients'); }
    catch(e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader title="Command Hub" subtitle={connected + ' of ' + products.length + ' products live' + (down > 0 ? ' · ' + down + ' down' : '')}>
        <PeriodPicker value={period} onChange={setPeriod} />
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><RefreshCw size={14}/> Refresh</button>
        <button onClick={sendDigest} disabled={sending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">{sending ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} Weekly Digest</button>
      </PageHeader>

      {loading ? <SkeletonCards count={6}/> : (<>
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4"><div className="text-[10px] text-surface-400 uppercase">Live</div><div className="font-display font-bold text-3xl text-emerald-600">{connected}</div><div className="text-xs text-surface-400">of {products.length}</div></div>
          <div className={`rounded-2xl border p-4 ${down>0?'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800':'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}><div className="text-[10px] text-surface-400 uppercase">Down</div><div className={`font-display font-bold text-3xl ${down>0?'text-red-600':'text-surface-300'}`}>{down}</div></div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4"><div className="text-[10px] text-surface-400 uppercase">Pending</div><div className="font-display font-bold text-3xl text-surface-400">{products.length - connected - down}</div></div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4"><div className="text-[10px] text-surface-400 uppercase">Status</div><div className={`font-display font-bold text-lg mt-1 ${down===0&&connected>0?'text-emerald-600':'text-amber-600'}`}>{down===0&&connected>0?'All Systems Go':connected===0?'Setup Needed':'Issues Detected'}</div></div>
        </div>

        {/* Products — Accordion style */}
        <div className="space-y-3">
          {products.map((p, i) => {
            const s = p.stats || {};
            const isConnected = s.connected;
            const isDown = !isConnected && s.error && !s.error.includes('not configured');
            const isExpanded = expanded === p.id;
            const metrics = s.metrics || {};
            const metricEntries = Object.entries(metrics);
            const ai = aiResults[p.id];

            return (
              <div key={p.id} className={`rounded-2xl border overflow-hidden transition-all ${isConnected ? 'bg-white dark:bg-surface-800 border-emerald-200 dark:border-emerald-800' : isDown ? 'bg-white dark:bg-surface-800 border-red-200 dark:border-red-800' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
                {/* Header — always visible */}
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm dark:text-surface-200">{p.name}</div>
                    <div className="text-[11px] text-surface-400">{p.desc}</div>
                  </div>
                  {/* Inline metrics preview */}
                  {isConnected && metricEntries.length > 0 && (
                    <div className="hidden sm:flex gap-4">
                      {metricEntries.slice(0, 3).map(([k, v]) => (
                        <div key={k} className="text-right"><div className="text-[9px] text-surface-400 uppercase">{k.replace(/_/g,' ')}</div><div className="font-mono font-bold text-sm dark:text-surface-200">{fmtVal(k, v)}</div></div>
                      ))}
                    </div>
                  )}
                  <span className={`text-xs font-bold whitespace-nowrap ml-2 ${isConnected ? 'text-emerald-500' : isDown ? 'text-red-500' : 'text-surface-400'}`}>
                    {isConnected ? '● Live' : isDown ? '● Down' : '○ Setup'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-surface-400 ml-1"/> : <ChevronDown size={16} className="text-surface-400 ml-1"/>}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-surface-100 dark:border-surface-700 p-4 sm:p-6 bg-surface-50/50 dark:bg-surface-900/30">
                    {!isConnected ? (
                      <div className="text-center py-6">
                        <AlertTriangle size={28} className="mx-auto mb-2 text-surface-300"/>
                        <p className="text-sm text-surface-400 mb-2">{isDown ? 'Cannot reach this product.' : 'Not configured yet.'}</p>
                        {s.error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 inline-block">{safeStr(s.error)}</p>}
                        <p className="text-xs text-surface-400 mt-3">Go to Settings → "Hub: {p.name}" → enter Backend URL + API Key</p>
                      </div>
                    ) : (
                      <>
                        {/* All Metrics Grid */}
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

                        {/* Recent Activity */}
                        {(s.recentActivity || []).length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-bold text-surface-400 uppercase mb-2">Recent Activity</div>
                            <div className="space-y-1">{(s.recentActivity || []).slice(0, 8).map((a, j) => (
                              <div key={j} className="text-xs p-2.5 bg-white dark:bg-surface-800 rounded-lg border border-surface-100 dark:border-surface-700 text-surface-600 dark:text-surface-400">{safeStr(a)}</div>
                            ))}</div>
                          </div>
                        )}

                        {/* Actions row */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <button onClick={() => askAI(p)} disabled={aiLoading === p.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                            {aiLoading === p.id ? <RefreshCw size={14} className="animate-spin"/> : <Brain size={14}/>}
                            {aiLoading === p.id ? 'Analyzing...' : 'AI Situation Report'}
                          </button>
                          {p.defaultUrl && <a href={p.defaultUrl} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-300 dark:text-surface-200">Open App <ExternalLink size={12}/></a>}
                        </div>

                        {/* AI Result */}
                        {ai && (
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
                            <div className="flex items-center gap-2 mb-2"><Brain size={16} className="text-indigo-500"/><span className="font-display font-bold text-xs">AI Situation Report</span></div>
                            <div className="text-sm leading-relaxed whitespace-pre-line dark:text-surface-300">{ai.answer}</div>
                            <p className="text-[10px] text-surface-400 mt-2">{new Date(ai.generatedAt).toLocaleString()}</p>
                          </div>
                        )}

                        <p className="text-[10px] text-surface-400 mt-3">Endpoint: {s.endpoint || '/api/hub/stats'} · Last fetched: {s.lastFetched ? new Date(s.lastFetched).toLocaleString() : 'Never'}</p>
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
