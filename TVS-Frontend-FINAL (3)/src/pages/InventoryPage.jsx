import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import { Package, AlertTriangle, Edit3, Check, X, Boxes } from 'lucide-react';

export default function InventoryPage() {
  const { data, loading, refetch } = useApi('/inventory/overview');
  const toast = useToast();
  const [editId, setEditId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [editReorder, setEditReorder] = useState('');

  const save = async (id) => {
    try {
      await api.put(`/products/${id}/inventory`, { stock_quantity: +editStock, reorder_point: +editReorder });
      toast.success('Inventory updated');
      setEditId(null); refetch();
    } catch (e) { toast.error(e.message); }
  };

  const products = data?.products || [];
  const totals = data?.totals || {};

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock levels, reorder alerts, and inventory valuation" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Units</div>
          <div className="text-2xl font-display font-bold text-surface-800 dark:text-surface-200">{fmt.number(totals.total_units)}</div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Inventory Value</div>
          <div className="text-2xl font-display font-bold text-brand-600">{fmt.currency(totals.total_value)}</div>
        </div>
        <div className={`rounded-2xl border p-5 ${+totals.low_stock_count > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-surface-800 border-surface-100'}`}>
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-1">Low Stock Alerts</div>
          <div className={`text-2xl font-display font-bold ${+totals.low_stock_count > 0 ? 'text-red-600' : 'text-surface-800 dark:text-surface-200'}`}>{totals.low_stock_count || 0}</div>
        </div>
      </div>

      {loading ? <SkeletonTable /> : products.length > 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-surface-100 bg-surface-50/50 dark:bg-surface-900/50">
              {['Product','Stock','Reorder At','Avg Daily Sales','Days Left','Value',''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {products.map(p => {
                const danger = +p.days_of_stock > 0 && +p.days_of_stock < 14;
                const editing = editId === p.id;
                return (
                  <tr key={p.id} className={`border-b border-surface-50 ${danger ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-surface-50/50'}`}>
                    <td className="px-4 py-3 text-sm font-medium">{p.name}{danger && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}</td>
                    <td className="px-4 py-3">{editing ? <input type="number" value={editStock} onChange={e=>setEditStock(e.target.value)} className="w-20 px-2 py-1 border rounded-lg text-sm" autoFocus /> : <span className="font-mono text-sm">{fmt.number(p.stock_quantity)}</span>}</td>
                    <td className="px-4 py-3">{editing ? <input type="number" value={editReorder} onChange={e=>setEditReorder(e.target.value)} className="w-20 px-2 py-1 border rounded-lg text-sm" /> : <span className="text-sm text-surface-500">{p.reorder_point}</span>}</td>
                    <td className="px-4 py-3 font-mono text-sm">{(+p.avg_daily_sales).toFixed(1)}/day</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${danger ? 'bg-red-100 text-red-700' : +p.days_of_stock > 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.days_of_stock || '—'} days</span></td>
                    <td className="px-4 py-3 font-mono text-sm">{fmt.currency(p.inventory_value)}</td>
                    <td className="px-4 py-3">{editing ? (
                      <div className="flex gap-1"><button onClick={()=>save(p.id)} className="p-1 text-emerald-600"><Check size={14}/></button><button onClick={()=>setEditId(null)} className="p-1 text-surface-400"><X size={14}/></button></div>
                    ) : (
                      <button onClick={()=>{setEditId(p.id);setEditStock(p.stock_quantity||'');setEditReorder(p.reorder_point||10)}} className="p-1 text-surface-400 hover:text-brand-600"><Edit3 size={14}/></button>
                    )}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-surface-400">
          <Boxes size={48} className="mx-auto mb-4 opacity-30" />
          <div className="text-lg font-display font-bold mb-2">No inventory data yet</div>
          <p className="text-sm">Go to Products and click Edit on each product to set stock quantities.</p>
        </div>
      )}
    </div>
  );
}
