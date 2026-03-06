import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { SkeletonTable } from '../components/Skeleton';

export default function CustomersPage() {
  const [type, setType] = useState('');
  const { data, loading } = useApi('/customers', { limit: 100, type }, [type]);

  const cols = [
    { key:'email', label:'Customer', render:(v,r)=><div><div className="font-medium text-sm">{r.first_name} {r.last_name}</div><div className="text-xs text-surface-400">{v}</div></div> },
    { key:'total_orders', label:'Orders', align:'right', render:v=>fmt.number(v) },
    { key:'total_revenue', label:'Revenue', align:'right', render:v=>fmt.currency(v) },
    { key:'aov', label:'AOV', align:'right', render:v=>fmt.currency(v) },
    { key:'ltv', label:'LTV', align:'right', render:v=><span className="font-bold text-brand-700">{fmt.currency(v)}</span> },
    { key:'cohort_month', label:'Cohort', render:v=>v||'--' },
    { key:'country', label:'Country', render:v=>v||'--' },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle={data?`${data.total} customers`:'Loading...'}>
        <div className="inline-flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm">
          {[['','All'],['new','New'],['returning','Returning']].map(([k,l])=>(
            <button key={k} onClick={()=>setType(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${type===k?'bg-brand-900 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
          ))}
        </div>
      </PageHeader>
      {loading ? <SkeletonTable /> : <DataTable columns={cols} data={data?.customers} searchable={['email','first_name','last_name']} />}
    </div>
  );
}
