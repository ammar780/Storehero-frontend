import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import { SkeletonCards } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Users, TrendingUp, Target, Percent, ShoppingCart, Clock, Zap } from 'lucide-react';

export default function UnitEconomicsPage() {
  const [period, setPeriod] = useState('90d');
  const { data: d, loading } = useApi('/analytics/unit-economics', { period }, [period]);
  const { data: anomalies } = useApi('/analytics/anomalies', {}, []);

  return (
    <div>
      <PageHeader title="Unit Economics" subtitle="CAC, LTV, payback period, and margins">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <SkeletonCards count={8}/> : !d ? (
        <div className="text-center py-16 text-surface-400 dark:text-surface-500"><DollarSign size={48} className="mx-auto mb-4 opacity-30"/><div className="text-lg font-display font-bold mb-2">No unit economics data yet</div><p className="text-sm">Sync WooCommerce orders to calculate CAC, LTV, and margins.</p></div>
      ) : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <MetricCard label="CAC" value={d.cac} icon={DollarSign} color="bg-red-50 text-red-600" />
          <MetricCard label="Avg LTV" value={d.avgLtv} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="LTV:CAC Ratio" value={d.ltvCacRatio+'x'} format="text" icon={Target} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Payback Period" value={d.paybackMonths+' mo'} format="text" icon={Clock} color="bg-amber-50 text-amber-600" />
          <MetricCard label="AOV" value={d.aov} icon={ShoppingCart} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Gross Margin" value={d.grossMargin} format="pct" icon={Percent} color="bg-teal-50 text-teal-600" />
          <MetricCard label="Net Margin" value={d.netMargin} format="pct" icon={Percent} color="bg-indigo-50 text-indigo-600" />
          <MetricCard label="Avg Orders/Customer" value={d.avgOrdersPerCustomer} format="number" icon={Users} color="bg-orange-50 text-orange-600" />
        </div>

        {/* Health indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-2xl p-5 border ${d.ltvCacRatio>=3?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}>
            <div className="text-xs font-bold uppercase mb-1">{d.ltvCacRatio>=3?'Healthy':'Needs Improvement'}</div>
            <div className="text-2xl font-display font-bold">{d.ltvCacRatio}x LTV:CAC</div>
            <div className="text-xs mt-1">{d.ltvCacRatio>=3?'Your customers are worth 3x+ what you pay to acquire them':'Target 3x or higher. Reduce CAC or increase retention.'}</div>
          </div>
          <div className={`rounded-2xl p-5 border ${d.paybackMonths<=3?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}>
            <div className="text-xs font-bold uppercase mb-1">{d.paybackMonths<=3?'Fast Payback':'Slow Payback'}</div>
            <div className="text-2xl font-display font-bold">{d.paybackMonths} months</div>
            <div className="text-xs mt-1">{d.paybackMonths<=3?'You recover acquisition costs within 3 months':'Takes more than 3 months to recover CAC. Push subscriptions.'}</div>
          </div>
          <div className={`rounded-2xl p-5 border ${d.netMargin>=15?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}>
            <div className="text-xs font-bold uppercase mb-1">{d.netMargin>=15?'Strong Margin':'Thin Margin'}</div>
            <div className="text-2xl font-display font-bold">{d.netMargin}%</div>
            <div className="text-xs mt-1">{d.netMargin>=15?'Healthy net margin for DTC supplements':'DTC supplements should target 15-25% net margin.'}</div>
          </div>
        </div>

        {d.monthly?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">CAC & AOV Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={d.monthly}>
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5,7)}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+v}/>
                <Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                <Bar dataKey="cac" fill="#ef4444" name="CAC" radius={[4,4,0,0]}/>
                <Bar dataKey="aov" fill="#3b82f6" name="AOV" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Anomaly alerts */}
        {anomalies?.anomalies?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><Zap size={16} className="text-amber-500"/> AI Anomaly Detection</h3>
            <div className="space-y-2">{anomalies.anomalies.map((a,i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${a.direction==='up'?'bg-emerald-50 dark:bg-emerald-900/20':'bg-red-50 dark:bg-red-900/20'}`}>
                <span className={`text-lg ${a.direction==='up'?'text-emerald-600':'text-red-600'}`}>{a.direction==='up'?'📈':'📉'}</span>
                <div><div className="font-semibold text-sm">{a.label}</div><div className="text-xs text-surface-400">Current: {fmt.currency(a.value)} · 30d avg: {fmt.currency(a.average)}</div></div>
              </div>
            ))}</div>
          </div>
        )}
      </>)}
    </div>
  );
}
