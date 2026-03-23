import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Crown, Heart, AlertTriangle, UserX, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const SEG = {
  champion:{label:'Champions',color:'bg-emerald-100 text-emerald-700',fill:'#22c55e',icon:Crown,desc:'5+ orders, active recently'},
  loyal:{label:'Loyal',color:'bg-blue-100 text-blue-700',fill:'#3b82f6',icon:Heart,desc:'3+ orders, active last 90 days'},
  potential_loyal:{label:'Potential Loyal',color:'bg-purple-100 text-purple-700',fill:'#8b5cf6',icon:Star,desc:'2+ orders, active last 60 days'},
  new:{label:'New',color:'bg-cyan-100 text-cyan-700',fill:'#06b6d4',icon:Users,desc:'1 order in last 30 days'},
  at_risk:{label:'At Risk',color:'bg-amber-100 text-amber-700',fill:'#f59e0b',icon:AlertTriangle,desc:'Inactive 60-120 days'},
  hibernating:{label:'Hibernating',color:'bg-orange-100 text-orange-700',fill:'#f97316',desc:'Inactive 120-180 days'},
  lost:{label:'Lost',color:'bg-red-100 text-red-700',fill:'#ef4444',icon:UserX,desc:'Inactive 180+ days'},
  other:{label:'Other',color:'bg-surface-100 text-surface-700',fill:'#94a3b8',desc:'Uncategorized'},
};

export default function CustomersPage() {
  const [activeSeg, setActiveSeg] = useState(null);
  const { data, loading } = useApi('/analytics/customer-segments', {}, []);
  const { data: custData, loading: l2 } = useApi('/customers', { limit: 100 }, []);
  const segments = data?.segments || {};
  const pieData = Object.entries(segments).map(([k,v]) => ({name:SEG[k]?.label||k,value:v.count,fill:SEG[k]?.fill||'#94a3b8'})).filter(d=>d.value>0);
  const total = data?.totalCustomers || 0;
  const activeCustomers = activeSeg && segments[activeSeg] ? segments[activeSeg].customers : [];

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${total} customers segmented by behavior`} />

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <MetricCard label="Total Customers" value={total} format="number" icon={Users} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Champions" value={segments.champion?.count||0} format="number" icon={Crown} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="At Risk" value={segments.at_risk?.count||0} format="number" icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Lost" value={segments.lost?.count||0} format="number" icon={UserX} color="bg-red-50 text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {pieData.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Customer Segments</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-sm mb-4">Segment Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(segments).filter(([_,v])=>v.count>0).sort((a,b)=>b[1].revenue-a[1].revenue).map(([key,seg]) => (
                <button key={key} onClick={()=>setActiveSeg(activeSeg===key?null:key)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${activeSeg===key?'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/20':'bg-surface-50 dark:bg-surface-700 hover:bg-surface-100'}`}>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SEG[key]?.color||''}`}>{SEG[key]?.label||key}</span>
                  <div className="flex-1"><div className="text-xs text-surface-400">{SEG[key]?.desc}</div></div>
                  <div className="text-right"><div className="font-bold text-sm">{seg.count}</div><div className="text-xs text-surface-400">{fmt.currency(seg.revenue)}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeSeg && activeCustomers.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-3">{SEG[activeSeg]?.label} Customers (top 10)</h3>
            <DataTable columns={[
              {key:'first_name',label:'Name',render:(v,r)=><span className="font-semibold text-sm">{v} {r.last_name}</span>},
              {key:'email',label:'Email',render:v=><span className="text-xs">{v}</span>},
              {key:'order_count',label:'Orders',align:'right',render:v=><span className="font-bold">{v}</span>},
              {key:'total_spent',label:'Revenue',align:'right',render:v=><span className="font-mono text-emerald-600">{fmt.currency(v)}</span>},
              {key:'days_since_last',label:'Last Order',align:'right',render:v=><span className="text-xs">{Math.round(v)} days ago</span>},
            ]} data={activeCustomers} />
          </div>
        )}

        {custData?.customers?.length > 0 && (
          <DataTable columns={[
            {key:'first_name',label:'Name',render:(v,r)=><span className="font-semibold text-sm">{v} {r.last_name}</span>},
            {key:'email',label:'Email',render:v=><span className="text-xs">{v}</span>},
            {key:'total_orders',label:'Orders',align:'right',render:v=>fmt.number(v)},
            {key:'total_revenue',label:'Revenue',align:'right',render:v=><span className="font-mono">{fmt.currency(v)}</span>},
            {key:'ltv',label:'LTV',align:'right',render:v=><span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span>},
            {key:'country',label:'Country',render:v=><span className="text-xs">{v}</span>},
          ]} data={custData.customers} searchable={['first_name','last_name','email']} />
        )}
      </>)}
    </div>
  );
}
