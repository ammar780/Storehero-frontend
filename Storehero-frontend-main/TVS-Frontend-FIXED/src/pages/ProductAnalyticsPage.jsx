import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, PlugZap } from 'lucide-react';

const RANGES = [{ k: '7d', l: '7d' }, { k: '30d', l: '30d' }, { k: '90d', l: '90d' }];
const PALETTE = ['#f1c349', '#6366f1', '#16a34a', '#ef4444', '#0ea5e9', '#a855f7', '#f59e0b', '#14b8a6'];

const fmtKpi = (v, unit) => {
  if (typeof v !== 'number') return v ?? '—';
  if (unit === '$') return fmt.currency(v);
  if (unit === '%') return fmt.pct(v);
  if (unit === 'x') return fmt.x(v);
  return fmt.number(v);
};
const fmtDate = (x) => {
  const d = new Date(x);
  return isNaN(d) ? String(x) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const tip = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 };

function ChartCard({ title, children, height = 240 }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

export default function ProductAnalyticsPage() {
  const { id } = useParams();
  const [range, setRange] = useState('30d');
  const { data, loading } = useApi(`/hub/product/${id}/analytics`, { range }, [id, range]);

  const kpis = data?.kpis || [];
  const series = (data?.series || []).filter(s => (s.points || []).length);
  const breakdowns = (data?.breakdowns || []).filter(b => (b.data || []).length);
  const comparisons = (data?.comparisons || []).filter(c => (c.items || []).length);
  const name = data?.product?.name || 'Product';
  const icon = data?.product?.icon || '📊';

  return (
    <div>
      <PageHeader title={`${icon} ${name}`} subtitle={data?.generatedAt ? `Last synced ${new Date(data.generatedAt).toLocaleString()}` : 'Analytics'}>
        <Link to="/command-hub" className="flex items-center gap-1.5 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200 dark:text-surface-200"><ArrowLeft size={14} /> Hub</Link>
        <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
          {RANGES.map(r => (
            <button key={r.k} onClick={() => setRange(r.k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r.k ? 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 shadow-sm' : 'text-surface-400'}`}>{r.l}</button>
          ))}
        </div>
      </PageHeader>

      {loading ? <SkeletonCards count={6} /> : data && data.connected === false ? (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-10 text-center">
          <PlugZap size={36} className="mx-auto mb-3 text-surface-300" />
          <p className="text-surface-600 dark:text-surface-300 font-semibold mb-1">{name} isn't connected</p>
          <p className="text-sm text-surface-400 mb-1">{data.error || 'No data available.'}</p>
          <p className="text-xs text-surface-400">Add its Backend URL + Hub Key in Settings → Integrations → "Hub: {name}".</p>
        </div>
      ) : !kpis.length && !series.length && !breakdowns.length ? (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-10 text-center">
          <RefreshCw size={32} className="mx-auto mb-3 text-surface-300" />
          <p className="text-surface-600 dark:text-surface-300 font-semibold mb-1">No analytics yet</p>
          <p className="text-sm text-surface-400">This product is connected but hasn't reported detailed metrics for this range.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
              {kpis.map((k, i) => {
                const up = typeof k.changePct === 'number' && k.changePct > 0;
                const down = typeof k.changePct === 'number' && k.changePct < 0;
                return (
                  <div key={k.key || i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4">
                    <div className="text-[10px] text-surface-400 uppercase tracking-wider truncate">{k.label || k.key}</div>
                    <div className="font-display font-bold text-2xl mt-1 dark:text-surface-100">{fmtKpi(k.value, k.unit)}</div>
                    {typeof k.changePct === 'number' && (
                      <div className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${up ? 'text-emerald-600' : down ? 'text-red-500' : 'text-surface-400'}`}>
                        {up ? <TrendingUp size={11} /> : down ? <TrendingDown size={11} /> : null}{Math.abs(k.changePct).toFixed(0)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Trend series */}
          {series.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              {series.map((s, i) => {
                const color = s.color || PALETTE[i % PALETTE.length];
                const d = s.points.map(p => ({ label: fmtDate(p.x), y: +p.y || 0 }));
                return (
                  <ChartCard key={i} title={s.name || `Series ${i + 1}`}>
                    <AreaChart data={d} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt.compact(v)} width={44} />
                      <Tooltip contentStyle={tip} formatter={v => fmt.number(v)} />
                      <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#g${i})`} name={s.name} />
                    </AreaChart>
                  </ChartCard>
                );
              })}
            </div>
          )}

          {/* Breakdowns */}
          {breakdowns.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              {breakdowns.map((b, i) => (
                <ChartCard key={i} title={b.title || 'Breakdown'}>
                  {b.chart === 'pie' || b.chart === 'donut' ? (
                    <PieChart>
                      <Pie data={b.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} innerRadius={b.chart === 'donut' ? 50 : 0} label={(e) => e.label}>
                        {b.data.map((e, j) => <Cell key={j} fill={PALETTE[j % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tip} formatter={v => fmt.number(v)} />
                    </PieChart>
                  ) : (
                    <BarChart data={b.data} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt.compact(v)} />
                      <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tip} formatter={v => fmt.number(v)} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>{b.data.map((e, j) => <Cell key={j} fill={PALETTE[j % PALETTE.length]} />)}</Bar>
                    </BarChart>
                  )}
                </ChartCard>
              ))}
            </div>
          )}

          {/* Comparisons */}
          {comparisons.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {comparisons.map((c, i) => (
                <ChartCard key={i} title={c.title || 'Comparison'} height={Math.max(180, c.items.length * 40)}>
                  <BarChart data={c.items} layout="vertical" margin={{ left: 4, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt.compact(v)} />
                    <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tip} formatter={v => (c.unit === '$' ? fmt.currency(v) : fmt.number(v))} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {c.items.map((e, j) => <Cell key={j} fill={e.highlight ? '#f1c349' : '#cbd5e1'} />)}
                    </Bar>
                  </BarChart>
                </ChartCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
