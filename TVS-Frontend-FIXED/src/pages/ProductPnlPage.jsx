import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, DollarSign, TrendingUp, Percent, ShoppingCart } from 'lucide-react';

export default function ProductPnlPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading } = useApi('/analytics/product-pnl', { period }, [period]);
  const products = data?.products || [];
  const totals = products.reduce((t,p) => ({ revenue:t.revenue+(+p.revenue||0), cogs:t.cogs+(+p.cogs||0), profit:t.profit+(+p.gross_profit||0), units:t.units+(+p.units_sold||0), orders:t.orders+(+p.orders||0) }), {revenue:0,cogs:0,profit:0,units:0,orders:0});

  return (
    <div>
      <PageHeader title="Product P&L" subtitle="Revenue, cost, and profit breakdown by individual product">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 stagger">
          <MetricCard label="Total Revenue" value={totals.revenue} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Total COGS" value={totals.cogs} icon={Package} color="bg-red-50 text-red-600" />
          <MetricCard label="Gross Profit" value={totals.profit} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Avg Margin" value={totals.revenue>0?Math.round(totals.profit/totals.revenue*1000)/10:0} format="pct" icon={Percent} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Units Sold" value={totals.units} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
        </div>

        {products.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">Revenue & Profit by Product</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={products.filter(p=>+p.revenue>0).slice(0,10)}>
                <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                <Tooltip formatter={v=>fmt.currency(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4,4,0,0]} />
                <Bar dataKey="gross_profit" fill="#22c55e" name="Gross Profit" radius={[4,4,0,0]} />
                <Bar dataKey="cogs" fill="#ef4444" name="COGS" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {products.length > 0 ? (
          <DataTable columns={[
            {key:'name',label:'Product',render:v=><span className="font-semibold text-sm">{v}</span>},
            {key:'units_sold',label:'Units',align:'right',render:v=>fmt.number(v)},
            {key:'orders',label:'Orders',align:'right',render:v=>fmt.number(v)},
            {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono font-bold">{fmt.currency(v)}</span>},
            {key:'cogs',label:'COGS',align:'right',render:v=><span className="font-mono text-red-500">-{fmt.currency(v)}</span>},
            {key:'gross_profit',label:'Gross Profit',align:'right',render:v=><span className={`font-mono font-bold ${+v>=0?'text-emerald-600':'text-red-600'}`}>{fmt.currency(v)}</span>},
            {key:'margin_pct',label:'Margin',align:'right',render:v=><span className={`font-mono ${+v>=50?'text-emerald-600':+v>=30?'text-blue-600':'text-amber-600'}`}>{v}%</span>},
            {key:'sub_orders',label:'Sub',align:'right',render:v=><span className="text-xs text-purple-600">{fmt.number(v)}</span>},
            {key:'onetime_orders',label:'One-Time',align:'right',render:v=><span className="text-xs text-surface-400">{fmt.number(v)}</span>},
          ]} data={products} searchable={['name','sku']} />
        ) : (
          <div className="text-center py-16 text-surface-400">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <div className="text-lg font-display font-bold mb-2">No product data yet</div>
            <p className="text-sm">Sync WooCommerce orders and set product costs in Products page.</p>
          </div>
        )}
      </>)}
    </div>
  );
}
