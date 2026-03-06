import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { TrendingUp, Users, Repeat, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LTVPage() {
  const { data: ltv, loading } = useApi('/customers/ltv-overview');
  const { data: cohorts } = useApi('/customers/cohorts');
  const { data: retention } = useApi('/customers/product-retention');

  const o = ltv?.overview;

  const cohortCols = [
    { key:'cohort_month', label:'Cohort', render:v=><span className="font-semibold text-brand-700">{v}</span> },
    { key:'customers', label:'Customers', align:'right', render:v=>fmt.number(v) },
    { key:'avg_ltv', label:'Avg LTV', align:'right', render:v=>fmt.currency(v) },
    { key:'avg_orders', label:'Avg Orders', align:'right', render:v=>(+(v)||0).toFixed(1) },
    { key:'avg_aov', label:'AOV', align:'right', render:v=>fmt.currency(v) },
    { key:'repeat_rate', label:'Repeat %', align:'right', render:v=><span className={`font-semibold ${+(v)>20?'text-emerald-600':'text-amber-600'}`}>{(+(v)||0).toFixed(1)}%</span> },
  ];

  const retCols = [
    { key:'product_name', label:'First Product', render:v=><span className="font-medium truncate max-w-[250px] block">{v}</span> },
    { key:'first_buyers', label:'First Buyers', align:'right', render:v=>fmt.number(v) },
    { key:'repeat_buyers', label:'Repeat', align:'right', render:v=>fmt.number(v) },
    { key:'retention_rate', label:'Retention', align:'right', render:v=><span className={`font-bold ${+(v)>25?'text-emerald-600':+(v)>10?'text-amber-600':'text-red-500'}`}>{v}%</span> },
  ];

  return (
    <div>
      <PageHeader title="LTV & Cohorts" subtitle="Customer lifetime value analytics" />
      {loading ? <><SkeletonCards /><SkeletonTable /></> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <MetricCard label="Avg LTV" value={o?.avg_ltv} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="Repeat Rate" value={o?.repeat_rate} format="pct" icon={Repeat} color="bg-blue-50 text-blue-600" />
            <MetricCard label="Avg Orders" value={o?.avg_orders} format="number" icon={TrendingUp} color="bg-purple-50 text-purple-600" />
            <MetricCard label="Total Customers" value={o?.total_customers} format="number" icon={Users} color="bg-amber-50 text-amber-600" />
          </div>

          {/* LTV Distribution */}
          {ltv?.distribution?.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-100 p-6 mt-6">
              <h3 className="font-display font-bold text-surface-800 mb-4">LTV Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ltv.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="bucket" tick={{fontSize:11,fill:'#a1a1aa'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:'#a1a1aa'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} />
                  <Bar dataKey="count" fill="#22c55e" radius={[6,6,0,0]} name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cohorts */}
          {cohorts?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-bold text-surface-800 mb-4">Monthly Cohorts</h3>
              <DataTable columns={cohortCols} data={cohorts} />
            </div>
          )}

          {/* Product Retention */}
          {retention?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-bold text-surface-800 mb-4">Retention by First Product Purchased</h3>
              <DataTable columns={retCols} data={retention} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
