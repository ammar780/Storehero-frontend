import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import { SkeletonCards } from '../components/Skeleton';
import AiReportPanel from '../components/AiReportPanel';
import { ArrowLeft, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PIE = ['#f1c349', '#6366f1', '#16a34a', '#ef4444', '#0ea5e9', '#a855f7', '#f97316', '#14b8a6', '#eab308', '#ec4899', '#22c55e', '#3b82f6'];
const compact = (n) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const nf = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

// Any range string a plugin sends back is honored as-is -- this is only the
// fallback list shown before we know what the plugin supports.
const DEFAULT_RANGES = ['24h', '7d', '30d', '90d', '180d', '365d', 'all'];

function SeriesChart({ s, i }) {
  const d = (s.points || []).map(p => ({ x: p.x, y: +p.y || 0 }));
  const kind = s.chart === 'line' ? 'line' : 'area'; // plugin can request 'line'; default stays 'area'
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 mb-4">
      <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">{s.name}</h3>
      <ResponsiveContainer width="100%" height={240}>
        {kind === 'line' ? (
          <LineChart data={d} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line type="monotone" dataKey="y" name={s.name} stroke={s.color || '#f1c349'} strokeWidth={2.5} dot={false} />
          </LineChart>
        ) : (
          <AreaChart data={d} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <defs><linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color || '#f1c349'} stopOpacity={0.35} /><stop offset="100%" stopColor={s.color || '#f1c349'} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="y" name={s.name} stroke={s.color || '#f1c349'} strokeWidth={2.5} fill={`url(#g${i})`} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownChart({ b }) {
  const d = (b.data || []).map(x => ({ label: x.label, value: +x.value || 0 }));
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">{b.title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        {b.chart === 'pie' ? (
          <PieChart>
            <Pie data={d} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} label={(e) => e.label}>
              {d.map((e, j) => <Cell key={j} fill={PIE[j % PIE.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          </PieChart>
        ) : (
          <BarChart data={d} layout="vertical" margin={{ left: 4, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={compact} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>{d.map((e, j) => <Cell key={j} fill={PIE[j % PIE.length]} />)}</Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ComparisonBlock({ c }) {
  const items = c.items || [];
  const max = Math.max(1, ...items.map(x => +x.value || 0));
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">{c.title}</h3>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1"><span className={`font-medium ${it.highlight ? 'text-amber-600' : 'text-surface-500'}`}>{it.label}</span><span className="text-surface-400">{typeof it.value === 'number' ? nf(it.value) : it.value}{c.unit || ''}</span></div>
            <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(4, (+it.value || 0) / max * 100)}%`, background: it.highlight ? '#f1c349' : '#94a3b8' }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Optional: a plugin can send { "tables": [{ "title":"...", "columns":["A","B"], "rows":[["x","y"]] }] }
function DataTable({ t }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 overflow-x-auto">
      <h3 className="font-display font-bold text-sm mb-4 dark:text-surface-100">{t.title}</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] text-surface-400 uppercase tracking-wide border-b border-surface-100 dark:border-surface-700">{(t.columns || []).map((c, i) => <th key={i} className="pb-2 pr-4 font-semibold">{c}</th>)}</tr></thead>
        <tbody>{(t.rows || []).map((row, ri) => <tr key={ri} className="border-b border-surface-50 dark:border-surface-700 last:border-0">{row.map((cell, ci) => <td key={ci} className="py-2 pr-4 dark:text-surface-200">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function PluginViewPage() {
  const { slug } = useParams();
  const [range, setRange] = useState('30d');
  const { data, loading, error } = useApi(`/plugins/${slug}/stats`, { range }, [slug, range]);
  const { data: audit } = useApi(`/plugins/${slug}/audit`, {}, [slug]);

  // A plugin can tell us which ranges it actually supports via availableRanges: ["7d","30d","365d",...].
  // Falls back to the standard list, and always includes whatever range is currently loaded.
  const ranges = useMemo(() => {
    const fromPlugin = Array.isArray(data?.availableRanges) && data.availableRanges.length ? data.availableRanges : DEFAULT_RANGES;
    return fromPlugin.includes(range) ? fromPlugin : [...fromPlugin, range];
  }, [data, range]);

  if (loading) return <div><PageHeader title="Plugin" /><SkeletonCards count={4} /></div>;
  if (error || !data || data.connected === false) return (
    <div>
      <Link to="/plugins" className="text-sm text-surface-400 flex items-center gap-1 mb-3"><ArrowLeft size={14} /> All plugins</Link>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">Couldn't load this plugin. Open <b>Add / Manage Plugins</b> and hit <b>Test</b> to check its URL &amp; key.</div>
    </div>
  );

  // Render EVERYTHING the plugin sends -- no hardcoded limits on count or type.
  const kpis = data.kpis || [];
  const series = data.series || [];
  const breakdowns = data.breakdowns || [];
  const comparisons = data.comparisons || [];
  const tables = data.tables || [];
  const activity = data.recentActivity || [];

  return (
    <div>
      <Link to="/plugins" className="text-sm text-surface-400 flex items-center gap-1 mb-2"><ArrowLeft size={14} /> All plugins</Link>
      <PageHeader title={`${data.icon || '🔌'} ${data.name || slug}`} subtitle="Live data from your plugin">
        <div className="flex flex-wrap bg-surface-100 dark:bg-surface-700 rounded-xl p-1 gap-0.5">
          {ranges.map(r => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${range === r ? 'bg-white dark:bg-surface-800 shadow-sm dark:text-surface-100' : 'text-surface-400'}`}>{r}</button>)}
        </div>
      </PageHeader>

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {kpis.map((k, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-4">
              <div className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide truncate">{k.label}</div>
              <div className="text-2xl font-display font-bold mt-1 dark:text-surface-100">{k.unit === '$' ? '$' : ''}{typeof k.value === 'number' ? nf(k.value) : k.value}{k.unit && k.unit !== '$' ? k.unit : ''}</div>
              {typeof k.changePct === 'number' && <div className={`text-xs mt-1 flex items-center gap-1 ${k.changePct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{k.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(k.changePct)}%</div>}
            </div>
          ))}
        </div>
      )}

      {series.map((s, i) => <SeriesChart key={i} s={s} i={i} />)}

      {breakdowns.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {breakdowns.map((b, i) => <BreakdownChart key={i} b={b} />)}
        </div>
      )}

      {comparisons.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {comparisons.map((c, i) => <ComparisonBlock key={i} c={c} />)}
        </div>
      )}

      {tables.length > 0 && (
        <div className="grid lg:grid-cols-1 gap-4 mb-4">
          {tables.map((t, i) => <DataTable key={i} t={t} />)}
        </div>
      )}

      <div className="mb-4">
        <AiReportPanel endpoint={`/plugins/${slug}/ai-report`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {audit && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
            <h3 className="font-display font-bold text-sm mb-3 dark:text-surface-100 flex items-center gap-2"><ShieldCheck size={16} className="text-surface-400" /> Health — {audit.score}/100 · {audit.status}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">{audit.summary}</p>
            {(audit.findings || []).map((f, i) => <div key={i} className="flex items-start gap-2 text-xs mb-1.5"><AlertTriangle size={13} className={`flex-shrink-0 mt-0.5 ${f.severity === 'high' ? 'text-red-500' : f.severity === 'medium' ? 'text-amber-500' : 'text-surface-400'}`} /><span className="dark:text-surface-300"><b>{f.title}</b> — {f.detail}</span></div>)}
          </div>
        )}
        {activity.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
            <h3 className="font-display font-bold text-sm mb-3 dark:text-surface-100">Recent activity</h3>
            {activity.map((a, i) => <div key={i} className="text-xs text-surface-500 dark:text-surface-400 py-1.5 border-b border-surface-50 dark:border-surface-700 last:border-0">{a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
