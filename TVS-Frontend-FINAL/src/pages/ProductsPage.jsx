import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { SkeletonTable } from '../components/Skeleton';
import { Package, Edit3, Check, X } from 'lucide-react';
export default function ProductsPage() {
  const { data, loading, refetch } = useApi('/products', { limit: 200 });
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const saveCogs = async (id) => { try{await api.put('/products/'+id+'/cogs',{cogs:+editVal});setEditId(null);refetch()}catch(e){alert(e.message)} };
  const cols = [
    {key:'name',label:'Product',render:(v,r)=><div className="flex items-center gap-3">{r.image_url?<img src={r.image_url} className="w-10 h-10 rounded-xl object-cover border border-surface-100" alt=""/>:<div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center"><Package size={16} className="text-surface-400"/></div>}<div><div className="font-medium text-surface-800 truncate max-w-[200px]">{v}</div>{r.sku&&<div className="text-xs text-surface-400">{r.sku}</div>}</div></div>},
    {key:'price',label:'Price',align:'right',render:v=><span className="font-mono text-sm">{fmt.currencyExact(v)}</span>},
    {key:'cogs',label:'COGS',align:'right',render:(v,r)=>editId===r.id?<div className="flex items-center gap-1 justify-end"><input type="number" step="0.01" value={editVal} onChange={e=>setEditVal(e.target.value)} className="w-20 px-2 py-1 border border-brand-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-400/30" autoFocus/><button onClick={()=>saveCogs(r.id)} className="p-1 text-brand-600"><Check size={14}/></button><button onClick={()=>setEditId(null)} className="p-1 text-surface-400"><X size={14}/></button></div>:<button onClick={()=>{setEditId(r.id);setEditVal(v||'')}} className="group flex items-center gap-1 justify-end"><span className="font-mono text-sm">{v?fmt.currencyExact(v):<span className="text-surface-300">Set</span>}</span><Edit3 size={12} className="text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity"/></button>},
    {key:'calc_margin',label:'Margin',align:'right',render:v=>{const n=+(v)||0;const color=n>60?'text-emerald-600 bg-emerald-50':n>30?'text-amber-600 bg-amber-50':n>0?'text-red-600 bg-red-50':'text-surface-400 bg-surface-50';return n>0?<span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{n}%</span>:<span className="text-surface-300">--</span>}},
    {key:'total_sold',label:'Sold',align:'right',render:v=><span className="font-mono text-sm">{fmt.number(v)}</span>},
    {key:'total_revenue',label:'Revenue',align:'right',render:v=><span className="font-mono text-sm">{fmt.currency(v)}</span>},
    {key:'total_profit',label:'Profit',align:'right',render:v=><span className={`font-mono text-sm font-semibold ${+(v)>=0?'text-emerald-600':'text-red-500'}`}>{fmt.currency(v)}</span>},
  ];
  return <div><PageHeader title="Products" subtitle={data?data.total+' products':'Loading...'}/>{loading?<SkeletonTable/>:<DataTable columns={cols} data={data?.products} searchable={['name','sku']}/>}</div>;
}
