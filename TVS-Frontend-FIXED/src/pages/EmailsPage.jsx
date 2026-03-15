import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, DollarSign, TrendingUp, ShoppingCart, RefreshCw, Percent } from 'lucide-react';

export default function EmailsPage() {
  const [period, setPeriod] = useState('12m');
  const { data, loading, refetch } = useApi('/analytics/emails', { period }, [period]);
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const s = data?.summary || {};
  const eo = data?.emailOrders || {};

  const doSync = async () => {
    setSyncing(true);
    try {
      const { data: d } = await api.post('/sync/enginemailer');
      toast.success(d.message || 'Email data synced');
      refetch();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div>
      <PageHeader title="Email Campaigns" subtitle="Email-attributed revenue and campaign performance">
        <button onClick={doSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Enginemailer'}
        </button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={4}/></> : (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            <MetricCard label="Email Revenue" value={s.total_email_revenue} icon={DollarSign} color="bg-purple-50 text-purple-600" />
            <MetricCard label="Total Revenue" value={s.total_revenue} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
            <MetricCard label="Email Share %" value={+(s.email_share_pct || 0)} format="pct" icon={Percent} color="bg-amber-50 text-amber-600" />
            <MetricCard label="Email Orders" value={eo.orders} format="number" icon={ShoppingCart} color="bg-emerald-50 text-emerald-600" />
          </div>

          {/* Email-attributed orders detail */}
          {+(eo.orders || 0) > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Email-Attributed Orders (UTM tracked)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Orders</div>
                  <div className="text-2xl font-display font-bold text-purple-600">{fmt.number(eo.orders)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Revenue</div>
                  <div className="text-2xl font-display font-bold text-emerald-600">{fmt.currency(eo.revenue)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Profit</div>
                  <div className="text-2xl font-display font-bold text-blue-600">{fmt.currency(eo.profit)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">AOV</div>
                  <div className="text-2xl font-display font-bold text-amber-600">{fmt.currency(eo.aov)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly email revenue trend */}
          {data?.monthly?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Monthly Email Revenue</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthly}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5, 7)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                  <Tooltip formatter={v => fmt.currency(v)} />
                  <Bar dataKey="email_revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Email Revenue" />
                  <Bar dataKey="total_revenue" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Total Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily email revenue */}
          {data?.revenue?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Daily Email Revenue</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.revenue}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                  <Tooltip formatter={v => typeof v === 'number' && v < 1 ? v.toFixed(1) + '%' : fmt.currency(v)} />
                  <Area type="monotone" dataKey="email_revenue" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} name="Email Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Empty state */}
          {(!data?.revenue || data.revenue.length === 0) && +(s.total_email_revenue || 0) === 0 && +(eo.orders || 0) === 0 && (
            <div className="text-center py-16 text-surface-400">
              <Mail size={48} className="mx-auto mb-4 opacity-30" />
              <div className="text-lg font-display font-bold mb-2">No email campaign data yet</div>
              <p className="text-sm max-w-md mx-auto mb-4">Connect Enginemailer in Settings → Integrations, then click "Sync Enginemailer" to pull email campaign revenue. Orders with email UTM parameters will also appear here automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
