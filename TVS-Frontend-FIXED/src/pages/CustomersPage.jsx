import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { SkeletonTable } from '../components/Skeleton';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;
  const { data, loading } = useApi('/customers', { limit, offset: page * limit, type }, [type, page]);

  const cols = [
    { key:'email', label:'Customer', render:(v,r)=><div><div className="font-medium text-sm">{r.first_name} {r.last_name}</div><div className="text-xs text-surface-400">{v}</div></div> },
    { key:'total_orders', label:'Orders', align:'right', render:v=>fmt.number(v) },
    { key:'total_revenue', label:'Revenue', align:'right', render:v=>fmt.currency(v) },
    { key:'aov', label:'AOV', align:'right', render:v=>fmt.currency(v) },
    { key:'ltv', label:'LTV', align:'right', render:v=><span className="font-bold text-brand-700">{fmt.currency(v)}</span> },
    { key:'cohort_month', label:'Cohort', render:v=>v||'--' },
    { key:'country', label:'Country', render:v=>v||'--' },
  ];
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  // #39 Export
  const exportCsv = () => {
    if (!data?.customers?.length) return;
    let csv = 'Email,Name,Orders,Revenue,AOV,LTV,Cohort,Country\n';
    data.customers.forEach(c => { csv += `${c.email},${c.first_name||''} ${c.last_name||''},${c.total_orders},${c.total_revenue},${c.aov},${c.ltv},${c.cohort_month||''},${c.country||''}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'TVS_Customers.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle={data?`${data.total} customers`:'Loading...'}>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-surface-800 text-white rounded-xl text-xs font-semibold"><Download size={14}/> Export</button>
        <div className="inline-flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm">
          {[['','All'],['new','New'],['returning','Returning']].map(([k,l])=>(
            <button key={k} onClick={()=>{setType(k);setPage(0)}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${type===k?'bg-brand-900 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
          ))}
        </div>
      </PageHeader>
      {loading ? <SkeletonTable /> : <>
        <DataTable columns={cols} data={data?.customers} searchable={['email','first_name','last_name']} />
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} className="p-2 rounded-xl border border-surface-200 disabled:opacity-30"><ChevronLeft size={16}/></button>
            <span className="text-sm text-surface-500">Page {page+1} of {totalPages}</span>
            <button onClick={()=>setPage(Math.min(totalPages-1,page+1))} disabled={page>=totalPages-1} className="p-2 rounded-xl border border-surface-200 disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
        )}
      </>}
    </div>
  );
}
