import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonChart } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ForecastPage() {
  const { data, loading } = useApi('/forecasts');

  return (
    <div>
      <PageHeader title="Forecast" subtitle="12-month revenue projection based on historical trends" />
      {loading ? <SkeletonChart /> : !data?.forecasts?.length ? (
        <EmptyState icon={LineChart} title="Not enough data" description="Need at least 2 months of sales data to generate forecasts. Sync your WooCommerce data first." />
      ) : (
        <>
          {data.avgGrowthRate != null && (
            <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6">
              <span className="text-sm text-surface-500">Average monthly growth rate: </span>
              <span className={`text-lg font-display font-bold ${data.avgGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{(data.avgGrowthRate * 100).toFixed(1)}%</span>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="font-display font-bold text-surface-800 mb-4">Projected Revenue (Next 12 Months)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.forecasts} margin={{top:5,right:5,left:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>'M'+v} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>fmt.compact(v)} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>fmt.currency(v)} />
                <Legend />
                <Area type="monotone" dataKey="optimistic" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" name="Optimistic" />
                <Area type="monotone" dataKey="base" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2.5} name="Base" />
                <Area type="monotone" dataKey="pessimistic" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" name="Conservative" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
