import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonChart } from '../components/Skeleton';
import { Megaphone, DollarSign, MousePointer, Target, TrendingUp, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export default function MarketingPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading } = useApi('/marketing/overview', { period }, [period]);
  const { data: camps } = useApi('/marketing/campaigns', { period }, [period]);
  const { data: advisor } = useApi('/marketing/spend-advisor');
  if (loading||!data) return <div><PageHeader title="Marketing" subtitle="Unified ad performance"><PeriodPicker value={period} onChange={setPeriod}/></PageHeader><SkeletonCards/><SkeletonChart/></div>;
  const b = data.blended;
  const recColor = advisor?.recommendation==='scale'?'border-emerald-200 bg-emerald-50':advisor?.recommendation==='reduce'?'border-red-200 bg-red-50':'border-amber-200 bg-amber-50';
  const campCols = [
    {key:'campaign_name',label:'Campaign',render:v=><span className="text-sm font-medium truncate max-w-[200px] block">{v||'Unknown'}</span>},
    {key:'platform',label:'Platform',render:v=><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v==='meta'?'bg-blue-50 text-blue-600':v==='google'?'bg-red-50 text-red-600':'bg-surface-100 text-surface-600'}`}>{v}</span>},
    {key:'spend',label:'Spend',align:'right',render:v=>fmt.currency(v)},
    {key:'roas',label:'ROAS',align:'right',render:v=><span className={`font-semibold ${+(v)>=2?'text-emerald-600':+(v)>=1?'text-amber-600':'text-red-500'}`}>{(+(v)||0).toFixed(1)}x</span>},
    {key:'cpa',label:'CPA',align:'right',render:v=>fmt.currency(v)},
  ];
  return (
    <div><PageHeader title="Marketing" subtitle="Unified ad performance"><PeriodPicker value={period} onChange={setPeriod}/></PageHeader>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
      <MetricCard label="Ad Spend" value={b.total_spend} icon={DollarSign} color="bg-purple-50 text-purple-600"/>
      <MetricCard label="Blended ROAS" value={b.blended_roas} format="x" icon={TrendingUp} color="bg-emerald-50 text-emerald-600"/>
      <MetricCard label="MER" value={b.mer} format="x" icon={Target} color="bg-blue-50 text-blue-600"/>
      <MetricCard label="Avg CPA" value={b.avg_cpa} icon={MousePointer} color="bg-amber-50 text-amber-600"/>
    </div>
    {advisor&&<div className={`mt-6 rounded-2xl border-2 p-6 ${recColor}`}><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">{advisor.recommendation==='scale'?<TrendingUp className="text-emerald-600" size={20}/>:<Eye className="text-amber-600" size={20}/>}</div><div><h3 className="font-display font-bold text-surface-800 capitalize">{advisor.recommendation} Spend</h3><p className="text-sm text-surface-600 mt-1">{advisor.reason}</p></div></div></div>}
    <div className="bg-white rounded-2xl border border-surface-100 p-6 mt-6">
      <h3 className="font-display font-bold text-surface-800 mb-4">Daily Ad Spend</h3>
      <ResponsiveContainer width="100%" height={250}><AreaChart data={data.trend}>
        <defs><linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5"/><XAxis dataKey="date" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>v?.slice(5)} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>'$'+fmt.compact(v)} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>fmt.currency(v)}/><Area type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={2} fill="url(#gSpend)"/>
      </AreaChart></ResponsiveContainer>
    </div>
    {data.byPlatform?.length>0&&<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">{data.byPlatform.map(p=><div key={p.platform} className="bg-white rounded-2xl border border-surface-100 p-5 hover:shadow-cardHover transition-shadow"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 ${p.platform==='meta'?'bg-blue-100 text-blue-700':p.platform==='google'?'bg-red-100 text-red-700':'bg-surface-100 text-surface-700'}`}>{p.platform}</span><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-surface-500">Spend</span><span className="font-semibold">{fmt.currency(p.spend)}</span></div><div className="flex justify-between text-sm"><span className="text-surface-500">ROAS</span><span className={`font-semibold ${+(p.roas)>=2?'text-emerald-600':'text-amber-600'}`}>{(+(p.roas)||0).toFixed(1)}x</span></div><div className="flex justify-between text-sm"><span className="text-surface-500">Conv.</span><span className="font-semibold">{fmt.number(p.conversions)}</span></div></div></div>)}</div>}
    {camps?.length>0&&<div className="mt-6"><h3 className="font-display font-bold text-surface-800 mb-4">Campaigns</h3><DataTable columns={campCols} data={camps} searchable={['campaign_name']}/></div>}
    </div>
  );
}
