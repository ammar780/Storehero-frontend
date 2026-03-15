import { useState, useRef, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { Brain, Send, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Percent, ArrowRight, Zap, RefreshCw } from 'lucide-react';

function ChatMessage({ role, content }) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : ''}`}>
      {role === 'ai' && <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0"><Brain size={16} className="text-purple-600" /></div>}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${role === 'user' ? 'bg-brand-500 text-white rounded-br-md' : 'bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-bl-md'}`}>
        {content}
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = [
  "What's my breakeven ROAS?",
  "Should I scale or cut ad spend?",
  "Which product is most profitable?",
  "What if I raise prices 10%?",
  "Am I making money this week?",
  "What's my customer acquisition cost?",
];

export default function AIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chat');
  const { data: rx, loading: rxLoading, refetch: rxRefetch } = useApi('/ai/prescriptions');
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (q) => {
    const question = q || input;
    if (!question.trim()) return;
    setMessages(m => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { question });
      setMessages(m => [...m, { role: 'ai', content: data.answer }]);
    } catch (e) { setMessages(m => [...m, { role: 'ai', content: 'Error: ' + e.message }]); }
    finally { setLoading(false); }
  };

  const r = rx || {};

  return (
    <div>
      <PageHeader title="AI Profit Advisor" subtitle="Pentane-style prescriptive intelligence for TVS" />

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6">
        {[['chat','Ask AI'],['prescriptions','Prescriptions']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden" style={{ height: 'calc(100vh - 260px)' }}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Brain size={48} className="mx-auto mb-4 text-purple-300" />
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-lg mb-2">Ask anything about your business</h3>
                  <p className="text-sm text-surface-400 mb-6">I have access to all your revenue, profit, product, and marketing data.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => ask(q)} className="px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-xs text-surface-600 dark:text-surface-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 transition-all">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => <ChatMessage key={i} role={m.role} content={m.content} />)}
              {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center"><Brain size={16} className="text-purple-600 animate-pulse" /></div><div className="bg-surface-50 rounded-2xl px-4 py-3 rounded-bl-md"><div className="flex gap-1"><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" /><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{animationDelay:'0.1s'}} /><div className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{animationDelay:'0.2s'}} /></div></div></div>}
              <div ref={chatEnd} />
            </div>
            <div className="p-4 border-t border-surface-100 dark:border-surface-700">
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
                  placeholder="Ask about profit, ROAS, pricing, inventory..." disabled={loading}
                  className="flex-1 px-4 py-3 border border-surface-200 dark:border-surface-600 rounded-xl text-sm bg-white dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-purple-400/30 disabled:opacity-50" />
                <button onClick={() => ask()} disabled={loading || !input.trim()} className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"><Send size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-6">
          {/* Main recommendation */}
          <div className={`rounded-2xl p-6 border-2 ${r.recommendation==='SCALE'?'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700':r.recommendation==='REDUCE'?'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700':'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Zap size={24} className={r.recommendation==='SCALE'?'text-emerald-600':r.recommendation==='REDUCE'?'text-red-600':'text-amber-600'} />
              <span className={`text-2xl font-display font-bold ${r.recommendation==='SCALE'?'text-emerald-700':r.recommendation==='REDUCE'?'text-red-700':'text-amber-700'}`}>{r.recommendation || '...'}</span>
              <button onClick={rxRefetch} className="ml-auto p-2 rounded-xl bg-white/50 hover:bg-white/80"><RefreshCw size={14} className={rxLoading?'animate-spin':''} /></button>
            </div>
            <p className="text-sm leading-relaxed">{r.summary || 'Loading prescriptions...'}</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Breakeven ROAS', value: r.breakeven_roas ? r.breakeven_roas + 'x' : '--', icon: Target },
              { label: 'Current ROAS', value: r.current_roas ? r.current_roas + 'x' : '--', icon: TrendingUp },
              { label: 'ROAS Headroom', value: r.roas_headroom ? (r.roas_headroom > 0 ? '+' : '') + r.roas_headroom + 'x' : '--', icon: r.roas_headroom > 0 ? TrendingUp : TrendingDown },
              { label: 'Optimal Daily Spend', value: r.optimal_daily_ad_spend ? '$' + r.optimal_daily_ad_spend : '--', icon: DollarSign },
            ].map((m, i) => (
              <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-4">
                <div className="flex items-center gap-2 mb-2"><m.icon size={14} className="text-surface-400" /><span className="text-[10px] text-surface-400 uppercase tracking-wider">{m.label}</span></div>
                <div className="text-xl font-display font-bold text-surface-800 dark:text-surface-200">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Discount scenarios */}
          {r.discount_scenarios?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3 flex items-center gap-2"><Percent size={16} className="text-brand-500" /> Discount Impact Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-surface-100">
                    {['Discount','New AOV','Orders Needed','Volume Increase Needed'].map(h => <th key={h} className="py-2 px-3 text-left text-[10px] font-semibold text-surface-400 uppercase">{h}</th>)}
                  </tr></thead>
                  <tbody>{r.discount_scenarios.map((s,i) => (
                    <tr key={i} className="border-b border-surface-50">
                      <td className="py-2 px-3 font-semibold">{s.discount_pct}% off</td>
                      <td className="py-2 px-3 font-mono">${s.new_aov}</td>
                      <td className="py-2 px-3 font-mono">{s.orders_needed_for_same_profit}</td>
                      <td className="py-2 px-3"><span className={`font-semibold ${s.volume_increase_needed_pct>50?'text-red-500':s.volume_increase_needed_pct>20?'text-amber-500':'text-emerald-600'}`}>+{s.volume_increase_needed_pct}%</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing recommendations */}
          {r.pricing_recommendations?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3 flex items-center gap-2"><DollarSign size={16} className="text-brand-500" /> Pricing Recommendations</h3>
              <div className="space-y-3">
                {r.pricing_recommendations.map((p,i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900 rounded-xl">
                    <div>
                      <span className="font-semibold text-sm">{p.name}</span>
                      <div className="text-xs text-surface-400">Price: ${p.price} | Cost: ${p.cost} | Margin: {p.margin}%</div>
                    </div>
                    <div className="text-xs text-right max-w-[200px] text-surface-600 dark:text-surface-400">{p.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
