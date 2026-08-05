import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import { SkeletonCards } from '../components/Skeleton';
import { Brain, Send, FileText, RefreshCw, Zap, TrendingUp, MessageCircle } from 'lucide-react';

export default function AIPage() {
  const [tab, setTab] = useState('brief');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [report, setReport] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { data: pricingData } = useApi('/ai/pricing', {}, []);
  const { data: insightsData } = useApi('/ai/weekly-insights', {}, []);

  useEffect(() => {
    api.get('/ai/daily-brief').then(r => setBrief(r.data)).catch(() => {});
  }, []);

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/analyze', { question });
      setAnswer(data);
    } catch(e) { toast.error(e.response?.data?.error || 'Failed to analyze'); }
    finally { setLoading(false); }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/weekly-report');
      setReport(data);
      toast.success('Weekly report generated');
    } catch(e) { toast.error(e.response?.data?.error || 'Failed to generate report'); }
    finally { setLoading(false); }
  };

  const QUICK = [
    "How is our revenue trending? Should I be worried?",
    "Which ad platform gives us the best ROAS?",
    "What should I focus on this week to grow revenue?",
    "How can we reduce our customer acquisition cost?",
    "Which product has the best margins?",
    "Are our email campaigns driving enough sales?",
  ];

  return (
    <div>
      <PageHeader title="AI Command Center" subtitle="Claude-powered analysis, reports, and recommendations" />

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-1 mb-6 flex-wrap gap-0.5">
        {[['brief','Daily Brief'],['ask','Ask AI'],['report','Weekly Report'],['pricing','Pricing AI'],['insights','Insights']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {/* ═══ DAILY BRIEF ═══ */}
      {tab === 'brief' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex items-center gap-2 mb-3"><Brain size={20} className="text-indigo-500"/><h3 className="font-display font-bold text-sm">Today's AI Brief</h3></div>
            {brief?.brief ? <p className="text-sm leading-relaxed dark:text-surface-300 whitespace-pre-line">{brief.brief}</p> : <p className="text-sm text-surface-400">Loading daily brief...</p>}
            {brief?.generatedAt && <p className="text-[10px] text-surface-400 mt-3">Generated: {new Date(brief.generatedAt).toLocaleString()}</p>}
          </div>
          <button onClick={() => api.get('/ai/daily-brief').then(r => setBrief(r.data))} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"><RefreshCw size={14}/> Refresh Brief</button>
        </div>
      )}

      {/* ═══ ASK AI ═══ */}
      {tab === 'ask' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-sm mb-3">Ask anything about your business</h3>
            <div className="flex gap-2">
              <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAI()} placeholder="e.g. Which product should I push harder?" className="flex-1 px-4 py-3 border border-surface-200 dark:border-surface-600 rounded-xl text-sm bg-surface-50 dark:bg-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
              <button onClick={askAI} disabled={loading} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"><Send size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">{QUICK.map((q,i) => (
              <button key={i} onClick={() => { setQuestion(q); }} className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-lg text-[11px] text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-200 transition-colors">{q}</button>
            ))}</div>
          </div>
          {loading && <div className="flex items-center gap-3 p-5 bg-surface-50 dark:bg-surface-800 rounded-2xl"><RefreshCw size={16} className="animate-spin text-indigo-500"/><span className="text-sm text-surface-400">Claude is analyzing your data...</span></div>}
          {answer && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <div className="flex items-center gap-2 mb-3"><MessageCircle size={16} className="text-indigo-500"/><span className="text-xs text-surface-400">{answer.question}</span></div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line">{answer.answer}</div>
              <p className="text-[10px] text-surface-400 mt-3">{new Date(answer.generatedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ WEEKLY REPORT ═══ */}
      {tab === 'report' && (
        <div className="space-y-4">
          <button onClick={generateReport} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {loading ? <RefreshCw size={16} className="animate-spin"/> : <FileText size={16}/>}
            {loading ? 'Generating...' : 'Generate Weekly Report'}
          </button>
          {report && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 sm:p-4 sm:p-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-display font-bold text-lg dark:text-surface-200">Weekly Business Report</h2>
                <span className="text-[10px] text-surface-400">{new Date(report.generatedAt).toLocaleString()}</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-line text-sm">{report.report}</div>
            </div>
          )}
          {!report && !loading && <p className="text-sm text-surface-400">Click the button to generate a comprehensive AI-powered weekly business report using your actual data.</p>}
        </div>
      )}

      {/* ═══ PRICING AI ═══ */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          {pricingData?.products?.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm">AI Pricing Recommendations</h3>
              {(pricingData?.products||[]).map((p,i) => (
                <div key={i} className={`p-4 rounded-xl border ${p.suggestion?.action==='increase_price'?'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800':p.suggestion?.action==='decrease_price'?'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800':'bg-surface-50 dark:bg-surface-700 border-surface-200 dark:bg-surface-800 dark:border-surface-700'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-semibold text-sm dark:text-surface-200">{p.name}</div>
                    <span className="font-mono text-xs">${((+p.price)||0).toFixed(2)} · {p.margin}% margin</span>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{p.suggestion?.reason}</p>
                  {p.suggestion?.target && <p className="text-xs font-mono font-semibold text-emerald-600 mt-1">Suggested: ${p.suggestion.target}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-surface-400">Sync products to get AI pricing recommendations.</p>}
        </div>
      )}

      {/* ═══ INSIGHTS ═══ */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {insightsData?.insights?.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm">This Week's AI Analysis</h3>
              {(insightsData?.insights||[]).map((ins,i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-100">
                  <span className="text-lg">{ins.type==='positive'?'📈':ins.type==='negative'?'📉':ins.type==='warning'?'⚠️':'💡'}</span>
                  <span className="text-sm dark:text-surface-300 leading-relaxed">{ins.text}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-surface-400">Not enough data for insights yet.</p>}
          {insightsData?.changes && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center"><div className="text-[10px] text-surface-400 uppercase">Revenue</div><div className={`font-display font-bold ${insightsData.changes.revenue>=0?'text-emerald-600':'text-red-600'}`}>{insightsData.changes.revenue>=0?'+':''}{insightsData.changes.revenue}%</div></div>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center"><div className="text-[10px] text-surface-400 uppercase">Profit</div><div className={`font-display font-bold ${insightsData.changes.profit>=0?'text-emerald-600':'text-red-600'}`}>{insightsData.changes.profit>=0?'+':''}{insightsData.changes.profit}%</div></div>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center"><div className="text-[10px] text-surface-400 uppercase">Orders</div><div className={`font-display font-bold ${insightsData.changes.orders>=0?'text-emerald-600':'text-red-600'}`}>{insightsData.changes.orders>=0?'+':''}{insightsData.changes.orders}%</div></div>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center"><div className="text-[10px] text-surface-400 uppercase">New Cust.</div><div className={`font-display font-bold ${insightsData.changes.newCust>=0?'text-emerald-600':'text-red-600'}`}>{insightsData.changes.newCust>=0?'+':''}{insightsData.changes.newCust}%</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
