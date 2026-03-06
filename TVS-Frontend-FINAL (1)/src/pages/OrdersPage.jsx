import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { ShoppingCart, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
export default function OrdersPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading } = useApi('/orders', { limit: 100 }, [period]);
  const cols = [
    {key:'woo_order_id',label:'Order',render:v=><span className="font-mono text-sm font-semibold text-brand-700">#{v}</span>},
    {key:'order_date',label:'Date',render:v=><span className="text-sm text-surface-600">{v?new Date(v).toLocaleDateString():''}</span>},
    {key:'customer_email',label:'Customer',render:(v,r)=><div><div className="text-sm font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-surface-400">{v}</div></div>},
    {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono text-sm">{fmt.currency(v)}</span>},
    {key:'gross_profit',label:'Profit',align:'right',render:v=><span className={`font-mono text-sm font-semibold ${+(v)>=0?'text-emerald-600':'text-red-500'}`}>{fmt.currency(v)}</span>},
    {key:'margin_pct',label:'Margin',align:'right',render:v=><span className={`text-xs font-semibold ${+(v)>0?'text-emerald-600':'text-red-500'}`}>{(+(v)||0).toFixed(1)}%</span>},
    {key:'country',label:'Country',render:v=>v||'--'},
  ];
  const s = data?.summary;
  return (
    <div><PageHeader title="Orders" subtitle="Per-order profitability"><PeriodPicker value={period} onChange={setPeriod}/></PageHeader>
    {loading?<><SkeletonCards/><SkeletonTable/></>:<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <MetricCard label="Total Orders" value={s?.total} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600"/>
        <MetricCard label="Revenue" value={s?.rev} icon={DollarSign} color="bg-emerald-50 text-emerald-600"/>
        <MetricCard label="Profit" value={s?.profit} icon={TrendingUp} color="bg-blue-50 text-blue-600"/>
        <MetricCard label="AOV" value={s?.aov} icon={BarChart3} color="bg-amber-50 text-amber-600"/>
      </div>
      <DataTable columns={cols} data={data?.orders} searchable={['woo_order_id','customer_email','first_name']}/>
    </>}</div>
  );
}
