import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import { SkeletonCards, SkeletonChart } from '../components/Skeleton';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, Users, Target, ArrowUpDown, BarChart3, RefreshCw, CheckCircle, Circle, ArrowRight, Zap, Brain, Activity, AlertTriangle, Bell } from 'lucide-react';

function LiveTicker({ data }) {
  if (!data) return null;
  const t = data.today || {};
  const y = data.yesterday || {};
  const revPct = +y.revenue > 0 ? ((+t.revenue - +y.revenue) / +y.revenue * 100).toFixed(0) : 0;
  return (
    <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-4 mb-6 text-white flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2"><Activity size={18} className="animate-pulse" /><span className="text-xs font-semibold uppercase tracking-wider opacity-80">Today Live</span></div>
      <div><span className="text-2xl font-display font-bold">{fmt.currency(t.revenue)}</span><span className="text-xs opacity-70 ml-1">revenue</span></div>
      <div><span className="text-2xl font-display font-bold">{fmt.currency(t.gross_profit)}</span><span className="text-xs opacity-70 ml-1">profit</span></div>
      <div><span className="text-xl font-display font-bold">{t.orders}</span><span className="text-xs opacity-70 ml-1">orders</span></div>
      {+revPct !== 0 && <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${+revPct > 0 ? 'bg-white/20' : 'bg-red-500/30'}`}>{+revPct > 0 ? '↑' : '↓'} {Math.abs(revPct)}% vs yesterday</div>}
    </div>
  );
}

function AIInsights({ onGenerate, insight, loading }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Brain size={18} className="text-purple-500" /><h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm">AI Profit Insights</h3></div>
        <button onClick={onGenerate} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />} {loading ? 'Analyzing...' : 'Generate'}
        </button>
      </div>
      {insight ? (
        <div className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line">{insight}</div>
      ) : (
        <div className="text-sm text-surface-400 italic">Click Generate to get AI-powered analysis of your business performance.</div>
      )}
    </div>
  );
}

function SmartAlerts({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="space-y-2 mb-6">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'}`}>
          {a.type === 'danger' ? <AlertTriangle size={16} /> : <Bell size={16} />}
          <div><span className="font-semibold">{a.title}:</span> {a.message}</div>
        </div>
      ))}
    </div>
  );
}

const CHANNEL_COLORS = ['#f1c349', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#ec4899'];

function OnboardingChecklist({ status }) {
  if (!status || (status.woocommerce_connected && status.products_with_cogs > 0 && status.orders_synced > 0)) return null;
  const steps = [
    { done: status.woocommerce_connected, label: 'Connect WooCommerce', desc: 'Settings → Integrations → WooCommerce', link: '/settings' },
    { done: status.orders_synced > 0, label: 'Run first sync', desc: 'Settings → Integrations → WooCommerce → Sync', link: '/settings' },
    { done: status.products_with_cogs > 0, label: 'Set product costs (COGS)', desc: `${status.products_with_cogs}/${status.products_total} products have costs`, link: '/products' },
  ];
  const completed = steps.filter(s => s.done).length;

  return (
    <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center"><Zap size={20} className="text-white" /></div>
        <div>
          <h3 className="font-display font-bold text-surface-800">Getting Started</h3>
          <p className="text-xs text-surface-500">{completed}/3 steps completed</p>
        </div>
        <div className="ml-auto w-24 h-2 bg-brand-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(completed/3)*100}%` }} />
        </div>
      </div>
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <a key={i} href={s.link} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${s.done ? 'bg-white/50' : 'bg-white shadow-sm hover:shadow-card'}`}>
            {s.done ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" /> : <Circle size={18} className="text-surface-300 flex-shrink-0" />}
            <div className="flex-1">
              <span className={`text-sm font-medium ${s.done ? 'text-surface-400 line-through' : 'text-surface-800'}`}>{s.label}</span>
              <div className="text-xs text-surface-400">{s.desc}</div>
            </div>
            {!s.done && <ArrowRight size={14} className="text-brand-500" />}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading, refetch } = useApi('/dashboard/overview', { period });
  const { data: channelData } = useApi('/dashboard/revenue-by-channel', { period });
  const { data: onboarding } = useApi('/onboarding/status');
  const { data: liveData } = useApi('/dashboard/today-live');
  const { data: alertsData } = useApi('/notifications/check');
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const toast = useToast();

  // Auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => refetch(), 60000);
    return () => clearInterval(timer);
  }, [period]);

  // Live ticker refreshes every 30s
  useEffect(() => {
    const timer = setInterval(() => {}, 30000);
    return () => clearInterval(timer);
  }, []);

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const { data: d } = await api.post('/insights/generate');
      setAiInsight(d.insight);
      if (d.type !== 'error') toast.success('AI insights generated');
    } catch (e) { toast.error(e.message); }
    finally { setAiLoading(false); }
  };

  // Auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => refetch(), 60000);
    return () => clearInterval(timer);
  }, [period]);

  const doRefresh = async () => { setRefreshing(true); await refetch(); setTimeout(() => setRefreshing(false), 500); };

  const c = data?.current || {};
  const p = data?.previous || {};
  const trend = data?.trend || [];

  const metrics = [
    { label: 'Revenue', value: c.revenue, prev: p.revenue, format: 'currency', icon: DollarSign, color: 'text-brand-500' },
    { label: 'Gross Profit', value: c.gross_profit, prev: p.gross_profit, format: 'currency', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Net Profit', value: c.net_profit, prev: p.net_profit, format: 'currency', icon: TrendingUp, color: +(c.net_profit)>=0?'text-emerald-500':'text-red-500' },
    { label: 'Orders', value: c.orders, prev: p.orders, format: 'number', icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'AOV', value: c.aov, prev: p.aov, format: 'currency', icon: Target, color: 'text-purple-500' },
    { label: 'MER', value: c.mer, prev: p.mer, format: 'x', icon: ArrowUpDown, color: 'text-indigo-500' },
    { label: 'New Customers', value: c.new_customers, prev: p.new_customers, format: 'number', icon: Users, color: 'text-teal-500' },
    { label: 'Gross Margin', value: c.gross_margin_pct, prev: null, format: 'pct', icon: BarChart3, color: 'text-brand-500' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-surface-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <div className="text-surface-500 mb-1">{label}</div>
        {payload.map((p, i) => <div key={i} className="font-mono font-semibold" style={{ color: p.color }}>{p.name}: {fmt.currency(p.value)}</div>)}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <PageHeader title="Dashboard" subtitle="Your profit command center" />
        <div className="flex items-center gap-3">
          <button onClick={doRefresh} className="p-2.5 rounded-xl bg-white border border-surface-200 hover:bg-surface-50 transition-all">
            <RefreshCw size={16} className={`text-surface-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      <OnboardingChecklist status={onboarding} />

      <LiveTicker data={liveData} />
      <SmartAlerts alerts={alertsData?.alerts} />
      <AIInsights onGenerate={generateAI} insight={aiInsight} loading={aiLoading} />

      {loading ? <SkeletonCards count={8} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
          {metrics.map((m, i) => (
            <MetricCard key={i} label={m.label} value={m.value} previous={m.prev} format={m.format} icon={m.icon} iconColor={m.color} delay={i * 0.04} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100 p-5">
          <h3 className="font-display font-bold text-surface-800 text-sm mb-4">Revenue Trend</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1c349" stopOpacity={0.3}/><stop offset="100%" stopColor="#f1c349" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt.compact(v)} /><Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#f1c349" strokeWidth={2} fill="url(#gr)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-surface-400 text-sm">No data yet. Run a WooCommerce sync first.</div>}
        </div>

        {/* Revenue by Channel */}
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <h3 className="font-display font-bold text-surface-800 text-sm mb-4">Revenue by Channel</h3>
          {channelData?.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart><Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="revenue" nameKey="channel" paddingAngle={2}>
                  {channelData.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                </Pie><Tooltip formatter={v => fmt.currency(v)} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {channelData.slice(0, 5).map((ch, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[i] }} /><span className="capitalize text-surface-600">{ch.channel}</span></div>
                    <span className="font-mono font-semibold">{fmt.currency(ch.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-[240px] flex items-center justify-center text-surface-400 text-sm">No channel data yet</div>}
        </div>
      </div>

      {/* Profit Trend + Revenue vs Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <h3 className="font-display font-bold text-surface-800 text-sm mb-4">Profit Trend</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}><defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt.compact(v)} /><Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="net_profit" stroke="#10b981" strokeWidth={2} fill="url(#gp)" name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm">No data yet</div>}
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <h3 className="font-display font-bold text-surface-800 text-sm mb-4">Revenue vs Costs</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt.compact(v)} /><Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#f1c349" name="Revenue" radius={[4,4,0,0]} />
                <Bar dataKey="cogs" fill="#ef4444" name="COGS" radius={[4,4,0,0]} />
                <Bar dataKey="ad_spend" fill="#3b82f6" name="Ad Spend" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm">No data yet</div>}
        </div>
      </div>
    </div>
  );
}
