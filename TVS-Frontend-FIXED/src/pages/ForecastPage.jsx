import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';

export default function ForecastPage() {
  const { data, loading , error } = useApi('/analytics/cash-flow', {}, []);
  const d = data || {};

  return (
    <div>
      <PageHeader title="Forecast & Cash Flow" subtitle="Revenue projections based on recent trends" />

      {loading ? <SkeletonCards count={4}/> : (!d?.historical?.length ? (
        <div className="text-center py-16 text-surface-400 dark:text-surface-500"><TrendingUp size={48} className="mx-auto mb-4 opacity-30"/><div className="text-lg font-display font-bold mb-2">No forecast data yet</div><p className="text-sm">Sync WooCommerce to generate revenue history and projections.</p></div>
      ) : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <MetricCard label="Avg Daily Revenue (30d)" value={d.avgRevenue30} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Avg Daily Revenue (7d)" value={d.avgRevenue7} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Projected 30-Day Revenue" value={d.projected30Revenue} icon={Calendar} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Break-Even Daily" value={d.breakEvenDailyRevenue} icon={Target} color="bg-amber-50 text-amber-600" />
        </div>

        {d.historical?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">Revenue History (90 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.historical}>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/>
                <Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e15" strokeWidth={2} name="Revenue"/>
                <Area type="monotone" dataKey="net_profit" stroke="#8b5cf6" fill="#8b5cf615" strokeWidth={1} name="Net Profit"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {d.projections?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">90-Day Revenue Projection</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.projections}>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/>
                <Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                <Area type="monotone" dataKey="cumulativeRevenue" stroke="#3b82f6" fill="#3b82f615" strokeWidth={2} name="Cumulative Revenue"/>
                <Area type="monotone" dataKey="cumulativeProfit" stroke="#22c55e" fill="#22c55e15" strokeWidth={1} name="Cumulative Profit"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-5 border border-blue-200">
            <div className="text-xs text-blue-600 font-bold uppercase mb-1">30-Day Projection</div>
            <div className="text-2xl font-display font-bold text-blue-700">{fmt.currency(d.projected30Revenue)}</div>
            <div className="text-xs text-blue-500 mt-1">Profit: {fmt.currency(d.projected30Profit)}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-5 border border-purple-200">
            <div className="text-xs text-purple-600 font-bold uppercase mb-1">60-Day Projection</div>
            <div className="text-2xl font-display font-bold text-purple-700">{fmt.currency((d.projected30Revenue||0)*2)}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-5 border border-emerald-200">
            <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Monthly Fixed Costs</div>
            <div className="text-2xl font-display font-bold text-emerald-700">{fmt.currency(d.monthlyFixed)}</div>
            <div className="text-xs text-emerald-500 mt-1">Break-even: {fmt.currency(d.breakEvenDailyRevenue)}/day</div>
          </div>
        </div>
      </>))}
    </div>
  );
}
