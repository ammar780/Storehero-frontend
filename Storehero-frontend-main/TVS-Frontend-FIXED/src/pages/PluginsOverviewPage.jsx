import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import { Plus, Boxes, Wifi, WifiOff, ArrowRight, Sparkles } from 'lucide-react';
import AiReportPanel from '../components/AiReportPanel';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE = ['#f1c349', '#6366f1', '#16a34a', '#ef4444', '#0ea5e9', '#a855f7', '#f97316', '#14b8a6', '#eab308', '#ec4899', '#22c55e', '#3b82f6'];
const compact = (n) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const nf = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

export default function PluginsOverviewPage() {
  const [range, setRange] = useState('30d');
  const { data, loading } = useApi('/plugins/overview', { range }, [range]);
  const plugins = data?.plugins || [];
  const connected = plugins.filter(p => p.connected);

  const activityPie = connected
    .map((p, i) => ({ label: p.name, value: Math.max(0, +(p.kpis?.[0]?.value) || 0), color: PIE[i % PIE.length] }))
    .filter(x => x.value > 0);
  const statusPie = [
    { label: 'Live', value: connected.length, color: '#16a34a' },
    { label: 'Down / Untested', value: plugins.length - connected.length, color: '#cbd5e1' },
  ].filter(x => x.value > 0);

  return (
    <div>
      <PageHeader title="All Plugins" subtitle={`${connected.length}/${plugins.length} live · every plugin in one place`}>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap bg-surface-100 dark:bg-surface-700 rounded-xl p-1 gap-0.5">{['24h', '7d', '30d', '90d', '180d', '365d'].map(r => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${range === r ? 'bg-white dark:bg-surface-800 shadow-sm dark:text-surface-100' : 'text-surface-400'}`}>{r}</button>)}</div>
          <Link to="/plugins/manage" className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold"><Plus size={14} /> Add</Link>
        </div>
      </PageHeader>
      {plugins.length > 0 && (
        <div className="mb-5">
          <AiReportPanel endpoint="/plugins/ai-report" label="Get Portfolio AI Report" />
        </div>
      )}

      {loading ? <SkeletonCards count={6} /> : plugins.length === 0 ? (
        <div className="text-center py-16">
          <Boxes size={40} className="mx-auto text-surface-300 mb-3" />
          <div className="text-surface-500 mb-3">No plugins connected yet.</div>
          <Link to="/plugins/manage" className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold"><Plus size={14} /> Add your first plugin</Link>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
              <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">Activity share by plugin</h3>
              {activityPie.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={activityPie} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label={(e) => e.label}>
                      {activityPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => nf(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[260px] flex items-center justify-center text-sm text-surface-400">No activity yet</div>}
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
              <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">Connection status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label={(e) => `${e.label} ${e.value}`}>
                    {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plugins.map((p) => (
              <Link to={`/plugin/${p.slug}`} key={p.slug} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4 hover:shadow-md transition-shadow group block">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-display font-bold text-sm dark:text-surface-100 flex-1 truncate">{p.name}</span>
                  {p.connected ? <Wifi size={13} className="text-emerald-500" /> : <WifiOff size={13} className="text-surface-300" />}
                  <ArrowRight size={14} className="text-surface-300 group-hover:text-amber-500 transition-colors" />
                </div>
                {!p.connected ? (
                  <div className="h-[120px] flex items-center justify-center text-xs text-surface-400 text-center px-2">{p.error || 'Not connected'}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(p.kpis || []).slice(0, 2).map((k, i) => (
                        <div key={i}><div className="text-[10px] text-surface-400 uppercase truncate">{k.label}</div><div className="text-lg font-display font-bold dark:text-surface-100">{k.unit === '$' ? '$' : ''}{typeof k.value === 'number' ? compact(k.value) : k.value}</div></div>
                      ))}
                    </div>
                    {p.series?.[0]?.points?.length ? (
                      <ResponsiveContainer width="100%" height={90}>
                        <AreaChart data={p.series[0].points.map(pt => ({ x: pt.x, y: +pt.y || 0 }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs><linearGradient id={`mini-${p.slug}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.series[0].color || '#f1c349'} stopOpacity={0.4} /><stop offset="100%" stopColor={p.series[0].color || '#f1c349'} stopOpacity={0} /></linearGradient></defs>
                          <Area type="monotone" dataKey="y" stroke={p.series[0].color || '#f1c349'} strokeWidth={2} fill={`url(#mini-${p.slug})`} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : p.breakdowns?.[0]?.data?.length ? (
                      <ResponsiveContainer width="100%" height={90}>
                        <PieChart>
                          <Pie data={p.breakdowns[0].data.map(x => ({ label: x.label, value: +x.value || 0 }))} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={38}>
                            {(p.breakdowns[0].data || []).map((e, j) => <Cell key={j} fill={PIE[j % PIE.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[90px] flex items-center justify-center text-[11px] text-surface-300">Connected</div>}
                  </>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
