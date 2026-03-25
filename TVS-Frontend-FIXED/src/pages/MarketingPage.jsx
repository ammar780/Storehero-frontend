import { useState } from 'react';
import api, { fmt } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, Target, MousePointer, RefreshCw, Award, TrendingDown } from 'lucide-react';

export default function MarketingPage() {
  const [period, setPeriod] = useState('30d');
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();
  const { data, loading } = useApi('/marketing/detailed', { period }, [period]);
  const { data: overview } = useApi('/marketing/overview', { period }, [period]);
  const o = overview || {};

  const syncAds = async () => { setSyncing(true); try { await api.post('/sync/ad-spend'); toast.success('Ad spend synced'); } catch(e) { toast.error(e.response?.data?.error||e.message); } finally { setSyncing(false); } };
  const totalSpend = data?.byPlatform?.reduce((s,r)=>s+(+r.spend||0),0)||0;
  const totalConv = data?.byPlatform?.reduce((s,r)=>s+(+r.conversions||0),0)||0;

  return (
    <div>
      <PageHeader title="Marketing & Ads" subtitle="Ad spend, ROAS, CAC, and platform performance">
        <button onClick={syncAds} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing?'animate-spin':''}/> Sync Ad Spend
        </button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <MetricCard label="Ad Spend" value={totalSpend} icon={DollarSign} color="bg-red-50 text-red-600" />
          <MetricCard label="MER" value={+(o.mer||0)} format="number" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Conversions" value={totalConv} format="number" icon={Target} color="bg-purple-50 text-purple-600" />
          <MetricCard label="CAC" value={+(o.cac||0)} icon={MousePointer} color="bg-amber-50 text-amber-600" />
        </div>

        {data?.revVsAds?.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">Revenue vs Ad Spend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.revVsAds}>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/><Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} name="Revenue"/>
                <Area type="monotone" dataKey="ad_spend" stroke="#ef4444" fill="#ef444420" strokeWidth={2} name="Ad Spend"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {data?.byPlatform?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Spend by Platform</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byPlatform}>
                  <XAxis dataKey="platform" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/><Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                  <Bar dataKey="spend" fill="#ef4444" name="Spend" radius={[4,4,0,0]}/>
                  <Bar dataKey="conversion_value" fill="#22c55e" name="Conv. Value" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {data?.cacTrend?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">CAC Trend (Weekly)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.cacTrend}>
                  <XAxis dataKey="week" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+v}/>
                  <Tooltip formatter={v=>fmt.currency(v)}/><Area type="monotone" dataKey="cac" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {data?.byPlatform?.length > 0 && (
          <DataTable columns={[
            {key:'platform',label:'Platform',render:v=><span className="font-semibold text-sm capitalize">{v}</span>},
            {key:'spend',label:'Spend',align:'right',render:v=><span className="font-mono text-red-500">{fmt.currency(v)}</span>},
            {key:'impressions',label:'Impressions',align:'right',render:v=>fmt.number(v)},
            {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
            {key:'ctr',label:'CTR',align:'right',render:v=><span className="font-mono">{v}%</span>},
            {key:'cpc',label:'CPC',align:'right',render:v=>fmt.currency(v)},
            {key:'conversions',label:'Conv.',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
            {key:'roas',label:'ROAS',align:'right',render:v=><span className={`font-mono font-bold ${+v>=3?'text-emerald-600':+v>=1?'text-blue-600':'text-red-600'}`}>{(+v).toFixed(1)}x</span>},
          ]} data={data.byPlatform} />
        )}

        {(data?.bestDay || data?.worstDay) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {data.bestDay && <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><Award size={16} className="text-emerald-600"/><span className="font-bold text-sm text-emerald-700">Best Day</span></div><div className="text-xs text-surface-500">{data.bestDay.date?.split('T')[0]}</div><div className="font-display font-bold text-lg text-emerald-600">{fmt.currency(data.bestDay.revenue)}</div><div className="text-xs">{data.bestDay.orders_count} orders · {fmt.currency(data.bestDay.ad_spend)} ad spend</div></div>}
            {data.worstDay && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-red-600"/><span className="font-bold text-sm text-red-700">Worst Day</span></div><div className="text-xs text-surface-500">{data.worstDay.date?.split('T')[0]}</div><div className="font-display font-bold text-lg text-red-600">{fmt.currency(data.worstDay.revenue)}</div><div className="text-xs">{data.worstDay.orders_count} orders</div></div>}
          </div>
        )}
      </>)}
    </div>
  );
}
