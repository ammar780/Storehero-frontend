import { useState } from 'react';
import api, { fmt } from '../utils/api';
import { useApi } from '../hooks/useApi';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { ShoppingCart, ChevronLeft, ChevronRight, Download, Eye, X, Filter } from 'lucide-react';

function OrderModal({ order, onClose }) {
  const { data, loading } = useApi(order ? `/orders/${order.id}` : null, {}, [order?.id]);
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Order #{order.woo_order_id || order.id}</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-lg"><X size={20}/></button>
        </div>
        {loading ? <p className="text-sm text-surface-400">Loading...</p> : data && (<>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
              <div className="text-xs text-surface-400">Revenue</div>
              <div className="font-display font-bold text-emerald-600">{fmt.currency(data.order?.revenue)}</div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
              <div className="text-xs text-surface-400">Profit</div>
              <div className="font-display font-bold">{fmt.currency(data.order?.gross_profit)}</div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
              <div className="text-xs text-surface-400">Payment</div>
              <div className="font-semibold text-sm capitalize">{data.order?.payment_method || 'N/A'}</div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
              <div className="text-xs text-surface-400">Status</div>
              <div className="font-semibold text-sm capitalize">{data.order?.status}</div>
            </div>
          </div>
          {data.order?.utm_campaign && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="text-xs font-bold text-amber-700 mb-1">Email Attribution</div>
              <div className="text-xs">Campaign: <b>{data.order.utm_campaign}</b></div>
              {data.order.utm_content && <div className="text-xs">CTA: <b>{data.order.utm_content}</b></div>}
              {data.order.utm_source && <div className="text-xs">Source: {data.order.utm_source}</div>}
            </div>
          )}
          {data.customer && (
            <div className="mb-4">
              <div className="text-xs text-surface-400 mb-1">Customer</div>
              <div className="text-sm font-semibold">{data.customer.first_name} {data.customer.last_name}</div>
              <div className="text-xs text-surface-400">{data.customer.email} · {data.customer.total_orders} total orders · LTV {fmt.currency(data.customer.ltv)}</div>
            </div>
          )}
          {data.items?.length > 0 && (
            <div>
              <div className="text-xs text-surface-400 mb-2">Items</div>
              {data.items.map((it,i) => (
                <div key={i} className="flex justify-between p-2 bg-surface-50 dark:bg-surface-700 rounded-lg mb-1">
                  <div><div className="text-sm font-semibold">{it.product_name||'Product'}</div><div className="text-xs text-surface-400">SKU: {it.sku||'N/A'} × {it.quantity}</div></div>
                  <div className="text-sm font-mono">{fmt.currency(it.subtotal)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div><div className="text-[10px] text-surface-400">COGS</div><div className="text-xs font-mono">{fmt.currency(data.order?.cogs)}</div></div>
            <div><div className="text-[10px] text-surface-400">Shipping</div><div className="text-xs font-mono">{fmt.currency(data.order?.shipping_cost)}</div></div>
            <div><div className="text-[10px] text-surface-400">Fees</div><div className="text-xs font-mono">{fmt.currency(data.order?.payment_fees)}</div></div>
            <div><div className="text-[10px] text-surface-400">Tax</div><div className="text-xs font-mono">{fmt.currency(data.order?.tax)}</div></div>
          </div>
        </>)}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { data, loading } = useApi('/orders', { period, page, limit: 50, status: status==='all'?undefined:status, order_type: type==='all'?undefined:type }, [period, page, status, type]);
  const orders = data?.orders || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / 50);

  const exportCsv = () => {
    const hdr = 'Order ID,Date,Status,Revenue,COGS,Profit,Payment,Campaign\n';
    const rows = orders.map(o => `${o.woo_order_id},${o.order_date?.split('T')[0]},${o.status},${o.revenue},${o.cogs},${o.gross_profit},${o.payment_method},${o.utm_campaign||''}`).join('\n');
    const blob = new Blob([hdr+rows],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='orders.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} orders`}>
        <button onClick={exportCsv} className="flex items-center gap-1 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"><Download size={14}/> CSV</button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','completed','processing','refunded','cancelled'].map(s => (
          <button key={s} onClick={()=>{setStatus(s);setPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${status===s?'bg-brand-500 text-white':'bg-surface-100 dark:bg-surface-700 text-surface-500'}`}>{s==='all'?'All Status':s.charAt(0).toUpperCase()+s.slice(1)}</button>
        ))}
        <span className="border-l border-surface-200 mx-1"/>
        {['all','subscription','onetime'].map(t => (
          <button key={t} onClick={()=>{setType(t);setPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${type===t?'bg-purple-500 text-white':'bg-surface-100 dark:bg-surface-700 text-surface-500'}`}>{t==='all'?'All Types':t==='subscription'?'Subscription':'One-Time'}</button>
        ))}
      </div>

      {loading ? <SkeletonTable /> : (
        <DataTable columns={[
          {key:'woo_order_id',label:'#',render:(v,row)=><button onClick={()=>setSelectedOrder(row)} className="font-bold text-brand-500 hover:underline">#{v||row.id}</button>},
          {key:'order_date',label:'Date',render:v=><span className="text-xs">{v?.split('T')[0]}</span>},
          {key:'status',label:'Status',render:v=><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v==='completed'?'bg-emerald-100 text-emerald-700':v==='processing'?'bg-blue-100 text-blue-700':v==='refunded'?'bg-red-100 text-red-700':'bg-surface-100 text-surface-600'}`}>{v}</span>},
          {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono font-bold">{fmt.currency(v)}</span>},
          {key:'gross_profit',label:'Profit',align:'right',render:v=><span className={`font-mono ${+v>=0?'text-emerald-600':'text-red-600'}`}>{fmt.currency(v)}</span>},
          {key:'payment_method',label:'Payment',render:v=><span className="text-xs capitalize">{(v||'').replace(/_/g,' ')}</span>},
          {key:'utm_campaign',label:'Email Campaign',render:v=>v?<span className="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">{v.replace(/_/g,' ')}</span>:null},
          {key:'country',label:'Country',render:v=><span className="text-xs">{v}</span>},
        ]} data={orders} searchable={['woo_order_id','status','payment_method','utm_campaign']} />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 disabled:opacity-30"><ChevronLeft size={16}/></button>
          <span className="text-sm text-surface-400">Page {page} of {pages}</span>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 disabled:opacity-30"><ChevronRight size={16}/></button>
        </div>
      )}

      <OrderModal order={selectedOrder} onClose={()=>setSelectedOrder(null)} />
    </div>
  );
}
