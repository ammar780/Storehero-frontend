import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import { SkeletonCards, SkeletonChart } from '../components/Skeleton';
import { DollarSign, ShoppingCart, TrendingUp, Users, Package, BarChart3, Target, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading } = useApi('/dashboard/overview', { period }, [period]);
  if (loading || !data) return <div><PageHeader title="Dashboard" subtitle="Your profit command center"><PeriodPicker value={period} onChange={setPeriod} /></PageHeader><SkeletonCards /><SkeletonChart /></div>;
  const c = data.current, p = data.previous;
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your profit command center"><PeriodPicker value={period} onChange={setPeriod} /></PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <MetricCard label="Revenue" value={c.revenue} prev={p.revenue} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Gross Profit" value={c.gross_profit} prev={p.gross_profit} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
        <MetricCard label="Net Profit" value={c.net_profit} prev={p.net_profit} icon={Target} color={+c.net_profit>=0?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-600'} />
        <MetricCard label="Orders" value={c.orders} prev={p.orders} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 stagger">
        <MetricCard label="AOV" value={c.aov} prev={p.aov} icon={Package} color="bg-amber-50 text-amber-600" />
        <MetricCard label="MER" value={c.mer} prev={p.mer} format="x" icon={BarChart3} color="bg-indigo-50 text-indigo-600" />
        <MetricCard label="New Customers" value={c.new_customers} prev={p.new_customers} format="number" icon={Users} color="bg-teal-50 text-teal-600" />
        <MetricCard label="Gross Margin" value={c.gross_margin_pct} format="pct" icon={ArrowUpRight} color="bg-pink-50 text-pink-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-cardHover transition-shadow">
          <h3 className="font-display font-bold text-surface-800 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={data.trend} margin={{top:5,right:5,left:5,bottom:5}}>
            <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.15}/><stop offset="100%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5"/><XAxis dataKey="date" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>v?.slice(5)} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>fmt.compact(v)} axisLine={false} tickLine={false} width={50}/>
            <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>[fmt.currency(v),'Revenue']}/>
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#gRev)"/>
          </AreaChart></ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-cardHover transition-shadow">
          <h3 className="font-display font-bold text-surface-800 mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={data.trend} margin={{top:5,right:5,left:5,bottom:5}}>
            <defs><linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={+c.net_profit>=0?"#22c55e":"#ef4444"} stopOpacity={0.15}/><stop offset="100%" stopColor={+c.net_profit>=0?"#22c55e":"#ef4444"} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5"/><XAxis dataKey="date" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>v?.slice(5)} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>fmt.compact(v)} axisLine={false} tickLine={false} width={50}/>
            <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>[fmt.currency(v),'Net Profit']}/>
            <Area type="monotone" dataKey="net_profit" stroke={+c.net_profit>=0?"#22c55e":"#ef4444"} strokeWidth={2.5} fill="url(#gProf)"/>
          </AreaChart></ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-surface-100 p-6 mt-6 hover:shadow-cardHover transition-shadow">
        <h3 className="font-display font-bold text-surface-800 mb-4">Revenue vs Costs</h3>
        <ResponsiveContainer width="100%" height={280}><BarChart data={data.trend} margin={{top:5,right:5,left:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5"/><XAxis dataKey="date" tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>v?.slice(5)} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#a1a1aa'}} tickFormatter={v=>fmt.compact(v)} axisLine={false} tickLine={false} width={50}/>
          <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #e4e4e7',fontSize:'13px'}} formatter={v=>fmt.currency(v)}/><Legend/>
          <Bar dataKey="revenue" fill="#22c55e" radius={[4,4,0,0]} name="Revenue"/><Bar dataKey="cogs" fill="#f59e0b" radius={[4,4,0,0]} name="COGS"/><Bar dataKey="ad_spend" fill="#8b5cf6" radius={[4,4,0,0]} name="Ad Spend"/>
        </BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}
