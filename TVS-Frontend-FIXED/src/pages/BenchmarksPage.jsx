import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Award, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Zap, ArrowRight } from 'lucide-react';

const statusStyles = {
  excellent: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Outperforming', icon: Award },
  good: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Above Average', icon: CheckCircle },
  average: { bg: 'bg-surface-50 dark:bg-surface-800', border: 'border-surface-200 dark:border-surface-700', text: 'text-surface-600 dark:text-surface-400', label: 'Average', icon: Target },
  needs_work: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Needs Work', icon: AlertTriangle },
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', label: 'Critical', icon: TrendingDown },
};

const fmtMetric = (key, val) => {
  if (['cac','aov'].includes(key)) return '$' + Math.round(val);
  if (['mer','ltv_cac_ratio'].includes(key)) return val.toFixed(1) + 'x';
  return val.toFixed(1) + '%';
};

export default function BenchmarksPage() {
  const [period, setPeriod] = useState('90d');
  const [tab, setTab] = useState('overview');
  const { data, loading } = useApi('/analytics/benchmarks', { period }, [period]);
  const comparisons = data?.comparisons || [];
  const recommendations = data?.recommendations || [];

  const excellent = comparisons.filter(c => c.status === 'excellent').length;
  const critical = comparisons.filter(c => c.status === 'critical').length;
  const score = comparisons.length > 0 ? Math.round(comparisons.reduce((s, c) => s + (c.status === 'excellent' ? 100 : c.status === 'good' ? 75 : c.status === 'average' ? 50 : c.status === 'needs_work' ? 25 : 0), 0) / comparisons.length) : 0;

  const radarData = comparisons.slice(0, 8).map(c => ({
    metric: c.label.length > 12 ? c.label.slice(0, 12) + '…' : c.label,
    yours: Math.min(100, Math.max(0, c.industry > 0 ? (c.higherBetter ? c.yours / c.industry * 50 : c.industry / Math.max(c.yours, 0.1) * 50) : 50)),
    industry: 50,
  }));

  return (
    <div>
      <PageHeader title="Industry Benchmarks" subtitle="How you compare to DTC health supplement industry averages">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6 flex-wrap">
        {[['overview','Overview'],['metrics','All Metrics'],['recommendations','AI Recommendations']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <SkeletonCards count={4} /> : (<>
        {/* Score card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <div className={`rounded-2xl p-5 border ${score >= 60 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : score >= 40 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'}`}>
            <div className="text-xs text-surface-400 uppercase">Overall Score</div>
            <div className="text-3xl font-display font-bold">{score}/100</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
            <div className="text-xs text-surface-400 uppercase">Outperforming</div>
            <div className="text-3xl font-display font-bold text-emerald-600">{excellent}</div>
            <div className="text-xs text-surface-400">metrics above industry</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
            <div className="text-xs text-surface-400 uppercase">Need Attention</div>
            <div className="text-3xl font-display font-bold text-red-600">{critical}</div>
            <div className="text-xs text-surface-400">metrics below industry</div>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700">
            <div className="text-xs text-surface-400 uppercase">Metrics Tracked</div>
            <div className="text-3xl font-display font-bold">{comparisons.length}</div>
            <div className="text-xs text-surface-400">vs industry benchmarks</div>
          </div>
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Performance vs Industry</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="You" dataKey="yours" stroke="#f1c349" fill="#f1c34940" strokeWidth={2} />
                    <Radar name="Industry" dataKey="industry" stroke="#94a3b8" fill="#94a3b820" strokeWidth={1} strokeDasharray="5 5" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 text-xs mt-2">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#f1c349]" /> Your Performance</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-300 border border-dashed" /> Industry Average</span>
                </div>
              </div>
            )}

            {/* Bar comparison */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">You vs Industry</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisons.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip formatter={(v, n) => [typeof v === 'number' ? v.toFixed(1) : v, n]} />
                  <Bar dataKey="yours" fill="#f1c349" name="You" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="industry" fill="#e2e8f0" name="Industry" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top recommendations */}
            {recommendations.filter(r => r.priority === 'high').length > 0 && (
              <div className="lg:col-span-2 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-5">
                <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><Zap size={16} className="text-red-500" /> Priority Improvements</h3>
                <div className="space-y-3">
                  {recommendations.filter(r => r.priority === 'high').map((rec, i) => (
                    <div key={i} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-red-100 dark:border-red-900">
                      <div className="font-semibold text-sm mb-1">{rec.title}</div>
                      <div className="text-xs text-surface-500 dark:text-surface-400">{rec.detail}</div>
                      {rec.impact && <div className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1"><ArrowRight size={12} /> {rec.impact}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ALL METRICS TAB ═══ */}
        {tab === 'metrics' && (
          <div className="space-y-3">
            {comparisons.map((comp, i) => {
              const st = statusStyles[comp.status] || statusStyles.average;
              const Icon = st.icon;
              return (
                <div key={i} className={`${st.bg} border ${st.border} rounded-xl p-4`}>
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={st.text} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm dark:text-surface-200">{comp.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${st.bg} ${st.text} border ${st.border}`}>{st.label}</span>
                      </div>
                      <div className="text-xs text-surface-400 mt-0.5">{comp.benchmark?.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-lg dark:text-surface-200">{fmtMetric(comp.metric, comp.yours)}</div>
                      <div className="text-xs text-surface-400">vs {fmtMetric(comp.metric, comp.industry)} industry</div>
                    </div>
                    <div className={`text-sm font-mono font-bold ml-2 ${comp.pctDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {comp.pctDifference >= 0 ? '+' : ''}{comp.pctDifference}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ AI RECOMMENDATIONS TAB ═══ */}
        {tab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length > 0 ? recommendations.map((rec, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${rec.priority === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : rec.priority === 'medium' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm dark:text-surface-200">{rec.title}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">{rec.detail}</div>
                    {rec.impact && (
                      <div className="mt-2 bg-white dark:bg-surface-800 rounded-lg p-2 text-xs font-semibold text-emerald-600 inline-block">
                        💰 {rec.impact}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-surface-400">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
                <div className="font-display font-bold">No urgent recommendations</div>
                <p className="text-sm">All metrics are at or above industry average.</p>
              </div>
            )}
          </div>
        )}
      </>)}
    </div>
  );
}
