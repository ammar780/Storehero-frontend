import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Facebook, Brain, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';

const RANGES = [
  { key: 7, label: '7d' },
  { key: 30, label: '30d' },
  { key: 90, label: '90d' },
];

function Stat({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4">
      <div className="text-[10px] text-surface-400 uppercase tracking-wider">{label}</div>
      <div className={`font-display font-bold text-2xl mt-1 ${accent || 'text-surface-800 dark:text-surface-100'}`}>{value}</div>
      {sub && <div className="text-[11px] text-surface-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MetaAdsPage() {
  const [days, setDays] = useState(30);
  const { data, loading } = useApi('/ads/meta', { days }, [days]);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const toast = useToast();

  const t = data?.totals || {};
  const daily = (data?.daily || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: Math.round(+d.spend),
    revenue: Math.round(+d.revenue),
  }));
  const latest = daily[daily.length - 1];
  const prevD = daily[daily.length - 2];
  const dayRoas = latest && latest.spend > 0 ? latest.revenue / latest.spend : 0;
  const campaigns = (data?.campaigns || []).map(c => ({
    ...c,
    spend: +c.spend, revenue: +c.revenue, clicks: +c.clicks, conversions: +c.conversions,
    roas: +c.spend > 0 ? +c.revenue / +c.spend : 0,
    cpa: +c.conversions > 0 ? +c.spend / +c.conversions : 0,
  }));
  const hasData = daily.length > 0 || campaigns.length > 0;

  const runAi = async () => {
    setAiLoading(true);
    try { const { data: d } = await api.post('/ads/meta/ai'); setAi(d); }
    catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Meta Ads" subtitle="Facebook & Instagram performance, campaigns, and AI strategy">
        <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setDays(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${days === r.key ? 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 shadow-sm' : 'text-surface-400'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={runAi} disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />} AI Analysis
        </button>
      </PageHeader>

      {loading ? <SkeletonCards count={6} /> : !hasData ? (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-10 text-center">
          <Facebook size={36} className="mx-auto mb-3 text-[#1877F2]" />
          <p className="text-surface-600 dark:text-surface-300 font-semibold mb-1">No Meta Ads data yet</p>
          <p className="text-sm text-surface-400">Connect Meta in Settings → Integrations and run a sync. Data appears here once spend is pulled.</p>
        </div>
      ) : (
        <>
          {latest && (
            <div className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-x-8 gap-y-2">
              <div className="text-xs font-bold text-[#1877F2] uppercase tracking-wide">Latest day · {latest.date}</div>
              <div><span className="text-[11px] text-surface-400">Spend </span><span className="font-display font-bold dark:text-surface-100">{fmt.currency(latest.spend)}</span></div>
              <div><span className="text-[11px] text-surface-400">Revenue </span><span className="font-display font-bold text-emerald-600">{fmt.currency(latest.revenue)}</span></div>
              <div><span className="text-[11px] text-surface-400">ROAS </span><span className={`font-display font-bold ${dayRoas >= 2 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt.x(dayRoas)}</span></div>
              {prevD && <div className="text-[11px] text-surface-400">prev day: {fmt.currency(prevD.spend)} spend · {fmt.currency(prevD.revenue)} rev</div>}
            </div>
          )}
          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            <Stat label="Spend" value={fmt.currency(t.spend)} />
            <Stat label="Revenue" value={fmt.currency(t.revenue)} accent="text-emerald-600" />
            <Stat label="ROAS" value={fmt.x(t.roas)} accent={t.roas >= 2 ? 'text-emerald-600' : 'text-red-500'} sub="revenue / spend" />
            <Stat label="CPA" value={fmt.currency(t.cpa)} sub={`${fmt.number(t.conversions)} conv.`} />
            <Stat label="CTR" value={fmt.pct(t.ctr)} sub={`${fmt.number(t.clicks)} clicks`} />
            <Stat label="CPC" value={fmt.currencyExact(t.cpc)} sub={`${fmt.compact(t.impressions)} impr.`} />
          </div>

          {/* AI analysis */}
          {ai && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 mb-6">
              <div className="flex items-center gap-2 mb-2"><Brain size={16} className="text-indigo-500" /><span className="font-display font-bold text-sm dark:text-surface-100">Meta Ads — AI Strategy</span></div>
              <div className="text-sm leading-relaxed whitespace-pre-line text-surface-700 dark:text-surface-300">{ai.answer}</div>
            </div>
          )}

          {/* Spend vs Revenue chart */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-surface-400" /><h3 className="font-display font-bold text-sm dark:text-surface-100">Spend vs Revenue</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1877F2" stopOpacity={0.3} /><stop offset="100%" stopColor="#1877F2" stopOpacity={0} /></linearGradient>
                  <linearGradient id="mRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + fmt.compact(v)} />
                <Tooltip formatter={v => fmt.currency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fill="url(#mRev)" name="Revenue" />
                <Area type="monotone" dataKey="spend" stroke="#1877F2" strokeWidth={2} fill="url(#mSpend)" name="Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign table */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-700"><h3 className="font-display font-bold text-sm dark:text-surface-100">Campaigns by Spend</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase text-surface-400 border-b border-surface-100 dark:border-surface-700">
                    <th className="text-left font-semibold px-5 py-2.5">Campaign</th>
                    <th className="text-right font-semibold px-3 py-2.5">Spend</th>
                    <th className="text-right font-semibold px-3 py-2.5">Revenue</th>
                    <th className="text-right font-semibold px-3 py-2.5">ROAS</th>
                    <th className="text-right font-semibold px-3 py-2.5">CPA</th>
                    <th className="text-right font-semibold px-5 py-2.5">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 dark:divide-surface-700">
                  {campaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-700/40">
                      <td className="px-5 py-3 font-medium text-surface-700 dark:text-surface-200 max-w-[240px] truncate">{c.campaign_name || 'Unnamed'}</td>
                      <td className="px-3 py-3 text-right text-surface-600 dark:text-surface-300">{fmt.currency(c.spend)}</td>
                      <td className="px-3 py-3 text-right text-emerald-600">{fmt.currency(c.revenue)}</td>
                      <td className={`px-3 py-3 text-right font-bold ${c.roas >= 2 ? 'text-emerald-600' : c.roas > 0 ? 'text-amber-600' : 'text-surface-300'}`}>{c.roas ? fmt.x(c.roas) : '—'}</td>
                      <td className="px-3 py-3 text-right text-surface-600 dark:text-surface-300">{c.cpa ? fmt.currency(c.cpa) : '—'}</td>
                      <td className="px-5 py-3 text-right text-surface-600 dark:text-surface-300">{fmt.number(c.conversions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
