import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, DollarSign, MousePointer, Eye, ShoppingCart, TrendingUp, AlertTriangle, Send, Percent } from 'lucide-react';

const healthBadge = (h) => {
  const styles = { good:'bg-emerald-100 text-emerald-700', average:'bg-blue-100 text-blue-700', low:'bg-amber-100 text-amber-700', poor:'bg-red-100 text-red-700', likely_spam:'bg-red-200 text-red-800' };
  const labels = { good:'Inbox', average:'Mixed', low:'Promotions', poor:'Poor', likely_spam:'Spam' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[h]||styles.average}`}>{labels[h]||h}</span>;
};
const clean = (v) => (v||'unknown').replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());

export default function EmailPerformancePage() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('campaigns');
  const { data, loading } = useApi('/analytics/email-performance', { period }, [period]);
  const s = data?.summary || {};

  return (
    <div>
      <PageHeader title="Email Performance" subtitle="Sent → Opened → Clicked → Purchased → Revenue">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6 flex-wrap">
        {[['campaigns','Campaigns'],['emails','Individual Emails'],['sales','Sales by CTA'],['deliverability','Deliverability']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={6}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 stagger">
          <MetricCard label="Emails Sent" value={s.total_sends} format="number" icon={Send} color="bg-surface-50 text-surface-600" />
          <MetricCard label="Opened" value={s.unique_openers} format="number" icon={Eye} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Open Rate" value={s.open_rate} format="pct" icon={Percent} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Email Orders" value={s.total_email_orders} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Email Revenue" value={s.total_email_revenue} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Email Profit" value={s.total_email_profit} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
        </div>

        {data?.alerts?.length > 0 && (
          <div className="space-y-2 mb-6">{data.alerts.map((a,i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.type==='spam'?'bg-red-50 border-red-300':'bg-amber-50 border-amber-300'}`}>
              <AlertTriangle size={16} className={a.type==='spam'?'text-red-500 mt-0.5':'text-amber-500 mt-0.5'} />
              <span className="text-sm">{a.message}</span>
            </div>
          ))}</div>
        )}

        {tab === 'campaigns' && (<div className="space-y-6">
          {data?.byCampaign?.length > 0 ? (<>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Campaign Performance</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byCampaign.slice(0,12)}>
                  <XAxis dataKey="campaign" tick={{fontSize:9}} tickFormatter={v=>clean(v).slice(0,15)} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip formatter={(v,n) => [n==='revenue'?fmt.currency(v):v, n]} />
                  <Bar dataKey="sends" fill="#94a3b8" name="Sent" />
                  <Bar dataKey="unique_openers" fill="#f1c349" name="Opened" />
                  <Bar dataKey="orders" fill="#22c55e" name="Purchased" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable columns={[
              {key:'campaign',label:'Campaign',render:v=><span className="font-semibold text-sm">{clean(v)}</span>},
              {key:'sends',label:'Sent',align:'right',render:v=>fmt.number(v)},
              {key:'unique_openers',label:'Opened',align:'right',render:v=>fmt.number(v)},
              {key:'open_rate',label:'Open %',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'orders',label:'Sales',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
              {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span>},
              {key:'conversion_rate',label:'Conv%',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'health',label:'Placement',align:'center',render:v=>healthBadge(v)},
            ]} data={data.byCampaign} searchable={['campaign']} />
          </>) : (
            <div className="text-center py-16 text-surface-400">
              <Mail size={48} className="mx-auto mb-4 opacity-30" />
              <div className="text-lg font-display font-bold mb-2">No campaign data yet</div>
              <p className="text-sm max-w-md mx-auto">Install TVS UTM Tracker plugin + add tracking pixels to your email templates.</p>
            </div>
          )}
          {data?.byProvider?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-3">Revenue by Provider</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.byProvider.map((p,i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                    <div><div className="font-semibold text-sm capitalize">{p.provider}</div><div className="text-xs text-surface-400">{fmt.number(p.orders)} orders · AOV {fmt.currency(p.aov)}</div></div>
                    <div className="font-display font-bold text-emerald-600">{fmt.currency(p.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>)}

        {tab === 'emails' && (<div className="space-y-6">
          {data?.byEmail?.length > 0 ? (
            <DataTable columns={[
              {key:'campaign',label:'Campaign',render:v=><span className="font-semibold text-xs">{clean(v)}</span>},
              {key:'email_id',label:'Email',render:v=><span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{clean(v)}</span>},
              {key:'sends',label:'Sent',align:'right',render:v=>fmt.number(v)},
              {key:'opens',label:'Opens',align:'right',render:v=>fmt.number(v)},
              {key:'unique_openers',label:'Unique',align:'right',render:v=>fmt.number(v)},
              {key:'open_rate',label:'Open %',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'health',label:'Placement',align:'center',render:v=>healthBadge(v)},
            ]} data={data.byEmail} searchable={['campaign','email_id']} />
          ) : (
            <div className="text-center py-16 text-surface-400">
              <Eye size={48} className="mx-auto mb-4 opacity-30" />
              <div className="text-lg font-display font-bold mb-2">No individual email data yet</div>
              <p className="text-sm max-w-md mx-auto">Each tracking pixel has a unique email_id. This tab shows open rates per individual email for A/B testing.</p>
            </div>
          )}
        </div>)}

        {tab === 'sales' && (<div className="space-y-6">
          {data?.daily?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Daily Email Revenue</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.daily}>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                  <Tooltip formatter={v=>fmt.currency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {data?.byCTA?.length > 0 ? (
            <DataTable columns={[
              {key:'campaign',label:'Campaign',render:v=><span className="font-semibold text-xs">{clean(v)}</span>},
              {key:'cta',label:'CTA Button',render:v=><span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{clean(v)}</span>},
              {key:'provider',label:'Provider',render:v=><span className="text-xs capitalize">{v}</span>},
              {key:'orders',label:'Sales',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
              {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span>},
              {key:'profit',label:'Profit',align:'right',render:v=><span className="font-mono">{fmt.currency(v)}</span>},
              {key:'aov',label:'AOV',align:'right',render:v=>fmt.currency(v)},
            ]} data={data.byCTA} searchable={['campaign','cta','provider']} />
          ) : (
            <div className="text-center py-16 text-surface-400">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
              <div className="text-lg font-display font-bold mb-2">No email sales yet</div>
              <p className="text-sm max-w-md mx-auto">When customers click UTM links and buy, sales are attributed to the exact CTA button.</p>
            </div>
          )}
        </div>)}

        {tab === 'deliverability' && (<div className="space-y-6">
          <div className="bg-gradient-to-r from-surface-50 to-blue-50 dark:from-surface-800 dark:to-blue-900/20 rounded-2xl border border-surface-200 p-6">
            <h3 className="font-display font-bold text-sm mb-4">Email Funnel Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div><div className="text-xs text-surface-400 uppercase mb-1">Sent</div><div className="text-2xl font-display font-bold">{fmt.number(s.total_sends||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Opened</div><div className="text-2xl font-display font-bold text-amber-600">{fmt.number(s.unique_openers||0)}</div><div className="text-xs text-surface-400">{s.open_rate||0}%</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Clicked</div><div className="text-2xl font-display font-bold text-blue-600">{fmt.number(s.total_clicks||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Purchased</div><div className="text-2xl font-display font-bold text-purple-600">{fmt.number(s.total_email_orders||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Revenue</div><div className="text-2xl font-display font-bold text-emerald-600">{fmt.currency(s.total_email_revenue||0)}</div></div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-sm mb-2">Inbox Placement Estimate</h3>
            <p className="text-xs text-surface-400 mb-4">Open rate indicates where emails land: Inbox ({'>'}30%), Mixed (15-30%), Promotions (5-15%), Spam ({'<'}5%)</p>
            {data?.byCampaign?.length > 0 ? (
              <div className="space-y-2">{data.byCampaign.map((c,i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{clean(c.campaign)}</div><div className="text-xs text-surface-400">{fmt.number(c.sends)} sent · {fmt.number(c.unique_openers)} opened</div></div>
                  <div className="text-right mr-3"><div className="font-mono text-sm font-bold">{c.open_rate}%</div></div>
                  {healthBadge(c.health)}
                </div>
              ))}</div>
            ) : <p className="text-center py-8 text-surface-400 text-sm">Add tracking pixels to see deliverability data.</p>}
          </div>
          {data?.alerts?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-3">Alerts</h3>
              <div className="space-y-2">{data.alerts.map((a,i) => (
                <div key={i} className={`p-3 rounded-xl border ${a.type==='spam'?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2"><AlertTriangle size={14} className={a.type==='spam'?'text-red-500':'text-amber-500'} /><span className="text-sm font-semibold">{a.type==='spam'?'Spam Alert':'Low Engagement'}</span></div>
                  <p className="text-xs text-surface-500 mt-1">{a.message}</p>
                </div>
              ))}</div>
            </div>
          )}
        </div>)}
      </>)}
    </div>
  );
}
