import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { ShoppingCart, DollarSign, TrendingUp, BarChart3, Download, ChevronLeft, ChevronRight } from 'lucide-react';
export default function OrdersPage() {
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(0);
  const limit = 50;
  // #32 Fixed: pass period to API
  const { data, loading } = useApi('/orders', { limit, offset: page * limit, period }, [period, page]);
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
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  // #39 CSV export
  const exportCsv = () => {
    if (!data?.orders?.length) return;
    let csv = 'Order ID,Date,Customer,Revenue,Profit,Margin %,Country\n';
    data.orders.forEach(o => { csv += `${o.woo_order_id},${o.order_date?.split('T')[0]||''},${o.first_name||''} ${o.last_name||''},${o.revenue},${o.gross_profit},${(+(o.margin_pct)||0).toFixed(1)},${o.country||''}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'TVS_Orders.csv'; a.click();
  };
  return (
    <div><PageHeader title="Orders" subtitle="Per-order profitability">
      <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-surface-800 text-white rounded-xl text-xs font-semibold"><Download size={14}/> Export</button>
      <PeriodPicker value={period} onChange={p=>{setPeriod(p);setPage(0)}}/>
    </PageHeader>
    {loading?<><SkeletonCards/><SkeletonTable/></>:<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <MetricCard label="Total Orders" value={s?.total} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600"/>
        <MetricCard label="Revenue" value={s?.rev} icon={DollarSign} color="bg-emerald-50 text-emerald-600"/>
        <MetricCard label="Profit" value={s?.profit} icon={TrendingUp} color="bg-blue-50 text-blue-600"/>
        <MetricCard label="AOV" value={s?.aov} icon={BarChart3} color="bg-amber-50 text-amber-600"/>
      </div>
      <DataTable columns={cols} data={data?.orders} searchable={['woo_order_id','customer_email','first_name']}/>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} className="p-2 rounded-xl border border-surface-200 disabled:opacity-30"><ChevronLeft size={16}/></button>
          <span className="text-sm text-surface-500">Page {page+1} of {totalPages}</span>
          <button onClick={()=>setPage(Math.min(totalPages-1,page+1))} disabled={page>=totalPages-1} className="p-2 rounded-xl border border-surface-200 disabled:opacity-30"><ChevronRight size={16}/></button>
        </div>
      )}
    </>}</div>
  );
}
