import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw, DollarSign, Users, TrendingUp, TrendingDown, Percent, ShoppingCart } from 'lucide-react';

export default function SubscriptionsPage() {
  const [period, setPeriod] = useState('12m');
  const { data, loading } = useApi('/analytics/subscriptions', { period }, [period]);
  const s = data?.summary || {};

  return (
    <div>
      <PageHeader title="Subscription Analytics" subtitle="MRR, churn, subscriber growth, and subscription vs one-time performance">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={6}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 stagger">
          <MetricCard label="Est. MRR" value={s.est_mrr} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Subscribers" value={s.unique_subscribers} format="number" icon={Users} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Churn Rate" value={s.churn_rate} format="pct" icon={TrendingDown} color="bg-red-50 text-red-600" />
          <MetricCard label="Sub Revenue %" value={s.sub_revenue_pct} format="pct" icon={Percent} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Sub AOV" value={s.sub_aov} icon={ShoppingCart} color="bg-amber-50 text-amber-600" />
          <MetricCard label="One-Time AOV" value={s.onetime_aov} icon={ShoppingCart} color="bg-surface-50 text-surface-600" />
        </div>

        {/* Sub vs One-time revenue trend */}
        {data?.monthly?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">Subscription vs One-Time Revenue</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthly}>
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(0,7)} />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                <Tooltip formatter={v=>fmt.currency(v)} />
                <Legend />
                <Bar dataKey="sub_revenue" fill="#8b5cf6" name="Subscription" radius={[4,4,0,0]} />
                <Bar dataKey="onetime_revenue" fill="#e2e8f0" name="One-Time" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Churn chart */}
          {data?.churn?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Subscriber Growth & Churn</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.churn}>
                  <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5,7)} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new_subs" fill="#22c55e" name="New" radius={[4,4,0,0]} />
                  <Bar dataKey="churned" fill="#ef4444" name="Churned" radius={[4,4,0,0]} />
                  <Bar dataKey="active" fill="#6366f1" name="Active" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Active by product */}
          {data?.activeByProduct?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Subscriptions by Product</h3>
              <div className="space-y-3">
                {data.activeByProduct.map((p,i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                    <div><div className="font-semibold text-sm">{p.product}</div><div className="text-xs text-surface-400">{fmt.number(p.active_subs)} subscriptions</div></div>
                    <div className="text-right"><div className="font-display font-bold text-emerald-600">{fmt.currency(p.avg_monthly_revenue)}</div><div className="text-xs text-surface-400">avg/month</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(!data?.monthly?.length && !data?.churn?.length) && (
          <div className="text-center py-16 text-surface-400">
            <RefreshCw size={48} className="mx-auto mb-4 opacity-30" />
            <div className="text-lg font-display font-bold mb-2">No subscription data yet</div>
            <p className="text-sm max-w-md mx-auto">Sync your WooCommerce orders. Orders with order_type='subscription' will appear here automatically.</p>
          </div>
        )}
      </>)}
    </div>
  );
}
