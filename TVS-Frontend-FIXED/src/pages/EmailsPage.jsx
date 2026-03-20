import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Mail, DollarSign, TrendingUp, ShoppingCart, RefreshCw, Percent, Eye, Send, MousePointer, AlertTriangle } from 'lucide-react';

const COLORS = ['#f1c349','#6366f1','#22c55e','#ef4444','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#14b8a6'];
const clean = (v) => (v||'unknown').replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase());
const healthBadge = (h) => {
  const s = { good:'bg-emerald-100 text-emerald-700', average:'bg-blue-100 text-blue-700', low:'bg-amber-100 text-amber-700', poor:'bg-red-100 text-red-700', likely_spam:'bg-red-200 text-red-800' };
  const l = { good:'Inbox', average:'Mixed', low:'Promo Tab', poor:'Poor', likely_spam:'Spam' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s[h]||s.average}`}>{l[h]||h}</span>;
};

export default function EmailsPage() {
  const [period, setPeriod] = useState('12m');
  const [tab, setTab] = useState('overview');
  const { data: emailData, loading: l1 } = useApi('/analytics/emails', { period }, [period]);
  const { data: perfData, loading: l2 } = useApi('/analytics/email-performance', { period }, [period]);
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const loading = l1 || l2;

  const s = perfData?.summary || {};
  const es = emailData?.summary || {};
  const eo = emailData?.emailOrders || {};

  const doSync = async () => {
    setSyncing(true);
    try {
      const { data: d } = await api.post('/sync/enginemailer');
      toast.success(d.message || 'Synced');
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div>
      <PageHeader title="Email Analytics" subtitle="Complete email performance: campaigns, individual emails, revenue, deliverability">
        <button onClick={doSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Enginemailer'}
        </button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6 flex-wrap">
        {[['overview','Overview'],['campaigns','By Campaign'],['emails','Individual Emails'],['cta','Sales by CTA'],['deliverability','Deliverability']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={6}/><SkeletonTable/></> : (<>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 stagger">
          <MetricCard label="Emails Sent" value={s.total_sends} format="number" icon={Send} color="bg-surface-50 text-surface-600" />
          <MetricCard label="Opens" value={s.unique_openers} format="number" icon={Eye} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Open Rate" value={s.open_rate} format="pct" icon={Percent} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Email Orders" value={s.total_email_orders||eo.orders} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Email Revenue" value={s.total_email_revenue||es.total_email_revenue} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Email Profit" value={s.total_email_profit} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
        </div>

        {/* Alerts */}
        {perfData?.alerts?.length > 0 && (
          <div className="space-y-2 mb-6">{perfData.alerts.map((a,i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.type==='spam'?'bg-red-50 border-red-300':'bg-amber-50 border-amber-300'}`}>
              <AlertTriangle size={16} className={a.type==='spam'?'text-red-500 mt-0.5':'text-amber-500 mt-0.5'} />
              <span className="text-sm">{a.message}</span>
            </div>
          ))}</div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (<div className="space-y-6">
          {/* Funnel */}
          <div className="bg-gradient-to-r from-surface-50 to-purple-50 dark:from-surface-800 dark:to-purple-900/20 rounded-2xl border border-surface-200 p-6">
            <h3 className="font-display font-bold text-sm mb-4">Email Funnel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div><div className="text-xs text-surface-400 uppercase mb-1">Sent</div><div className="text-2xl font-display font-bold">{fmt.number(s.total_sends||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Opened</div><div className="text-2xl font-display font-bold text-amber-600">{fmt.number(s.unique_openers||0)}</div><div className="text-xs text-surface-400">{s.open_rate||0}%</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Clicked</div><div className="text-2xl font-display font-bold text-blue-600">{fmt.number(s.total_clicks||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Purchased</div><div className="text-2xl font-display font-bold text-purple-600">{fmt.number(s.total_email_orders||eo.orders||0)}</div></div>
              <div><div className="text-xs text-surface-400 uppercase mb-1">Revenue</div><div className="text-2xl font-display font-bold text-emerald-600">{fmt.currency(s.total_email_revenue||es.total_email_revenue||0)}</div></div>
            </div>
          </div>

          {/* Provider split */}
          {perfData?.byProvider?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-3">Revenue by Provider</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={perfData.byProvider} dataKey="revenue" nameKey="provider" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {perfData.byProvider.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie><Tooltip formatter={v=>fmt.currency(v)} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-3">Provider Breakdown</h3>
                <div className="space-y-3">{perfData.byProvider.map((p,i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                    <div><div className="font-semibold text-sm capitalize">{p.provider}</div><div className="text-xs text-surface-400">{fmt.number(p.orders)} orders · AOV {fmt.currency(p.aov)}</div></div>
                    <div className="font-display font-bold text-emerald-600">{fmt.currency(p.revenue)}</div>
                  </div>
                ))}</div>
              </div>
            </div>
          )}

          {/* Daily trend */}
          {perfData?.daily?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Daily Email Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={perfData.daily}>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                  <Tooltip formatter={v=>fmt.currency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly trend from enginemailer */}
          {emailData?.monthly?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Monthly Email Revenue vs Total</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={emailData.monthly}>
                  <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5,7)} />
                  <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                  <Tooltip formatter={v=>fmt.currency(v)} /><Legend />
                  <Bar dataKey="email_revenue" fill="#8b5cf6" name="Email Revenue" radius={[4,4,0,0]} />
                  <Bar dataKey="total_revenue" fill="#e2e8f0" name="Total Revenue" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>)}

        {/* ═══ BY CAMPAIGN ═══ */}
        {tab === 'campaigns' && (<div className="space-y-6">
          {/* Synced campaign stats from Enginemailer API */}
          {perfData?.syncedCampaigns?.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 mb-6">
              <h3 className="font-display font-bold text-sm mb-3">Enginemailer Campaign Stats (from API)</h3>
              {perfData.syncedTotals && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 text-center">
                  <div><div className="text-xs text-surface-400 uppercase">Total Sent</div><div className="text-xl font-display font-bold">{fmt.number(perfData.syncedTotals.sent)}</div></div>
                  <div><div className="text-xs text-surface-400 uppercase">Opens</div><div className="text-xl font-display font-bold text-amber-600">{fmt.number(perfData.syncedTotals.opens)}</div></div>
                  <div><div className="text-xs text-surface-400 uppercase">Open Rate</div><div className="text-xl font-display font-bold text-blue-600">{perfData.syncedTotals.open_rate}%</div></div>
                  <div><div className="text-xs text-surface-400 uppercase">Clicks</div><div className="text-xl font-display font-bold text-purple-600">{fmt.number(perfData.syncedTotals.clicks)}</div></div>
                  <div><div className="text-xs text-surface-400 uppercase">Bounce Rate</div><div className="text-xl font-display font-bold text-red-600">{perfData.syncedTotals.bounce_rate}%</div></div>
                </div>
              )}
              <DataTable columns={[
                {key:'campaign_name',label:'Series',render:v=><span className="font-semibold text-sm">{v}</span>},
                {key:'sent',label:'Sent',align:'right',render:v=>fmt.number(v)},
                {key:'unique_opens',label:'Opens',align:'right',render:v=>fmt.number(v)},
                {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
                {key:'bounces',label:'Bounces',align:'right',render:v=><span className={+v>0?'text-red-500':''}>{fmt.number(v)}</span>},
                {key:'unsubscribes',label:'Unsubs',align:'right',render:v=><span className={+v>0?'text-amber-500':''}>{fmt.number(v)}</span>},
                {key:'sent',label:'Open %',align:'right',render:(v,row)=>{const r=+v>0?Math.round(+row.unique_opens/+v*1000)/10:0; return <span className={`font-mono font-bold ${r>30?'text-emerald-600':r>15?'text-blue-600':r>5?'text-amber-600':'text-red-600'}`}>{r}%</span>}},
                {key:'sent',label:'Health',align:'center',render:(v,row)=>{const r=+v>0?+row.unique_opens/+v*100:0; return healthBadge(r>30?'good':r>15?'average':r>5?'low':r>0?'poor':'likely_spam')}},
              ]} data={perfData.syncedCampaigns} searchable={['campaign_name']} />
            </div>
          )}

          {/* Individual emails within series */}
          {perfData?.syncedEmails?.length > 0 && tab === 'emails' && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
              <h3 className="font-display font-bold text-sm mb-3">Individual Emails (from Enginemailer)</h3>
              <DataTable columns={[
                {key:'parent_campaign',label:'Series',render:v=>{const p=perfData.syncedCampaigns?.find(c=>c.campaign_id===v); return <span className="text-xs text-surface-400">{p?.campaign_name||v}</span>}},
                {key:'campaign_name',label:'Email Subject',render:v=><span className="font-semibold text-sm">{v}</span>},
                {key:'sent',label:'Sent',align:'right',render:v=>fmt.number(v)},
                {key:'unique_opens',label:'Opens',align:'right',render:v=>fmt.number(v)},
                {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
                {key:'sent',label:'Open %',align:'right',render:(v,row)=>{const r=+v>0?Math.round(+row.unique_opens/+v*1000)/10:0; return <span className="font-mono font-bold">{r}%</span>}},
                {key:'sent',label:'Health',align:'center',render:(v,row)=>{const r=+v>0?+row.unique_opens/+v*100:0; return healthBadge(r>30?'good':r>15?'average':r>5?'low':r>0?'poor':'likely_spam')}},
              ]} data={perfData.syncedEmails} searchable={['campaign_name','parent_campaign']} />
            </div>
          )}

          {perfData?.byCampaign?.length > 0 ? (<>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Campaign Performance — Full Funnel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={perfData.byCampaign.slice(0,12)}>
                  <XAxis dataKey="campaign" tick={{fontSize:9}} tickFormatter={v=>clean(v).slice(0,18)} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{fontSize:10}} /><Tooltip /><Legend />
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
            ]} data={perfData.byCampaign} searchable={['campaign']} />
          </>) : <div className="text-center py-16 text-surface-400"><Mail size={48} className="mx-auto mb-4 opacity-30" /><div className="text-lg font-display font-bold mb-2">No campaign tracking data yet</div><p className="text-sm max-w-md mx-auto">Add tracking pixels to your email templates. The pixel reports sends and opens per campaign.</p></div>}
        </div>)}

        {/* ═══ INDIVIDUAL EMAILS ═══ */}
        {tab === 'emails' && (<div className="space-y-6">
          {perfData?.syncedEmails?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-3">Individual Emails per Series (Enginemailer)</h3>
              <DataTable columns={[
                {key:'parent_campaign',label:'Series',render:v=>{const p=perfData.syncedCampaigns?.find(c=>c.campaign_id===v); return <span className="text-xs">{p?.campaign_name||clean(v||'')}</span>}},
                {key:'campaign_name',label:'Email Subject',render:v=><span className="font-semibold text-sm">{v}</span>},
                {key:'sent',label:'Sent',align:'right',render:v=>fmt.number(v)},
                {key:'unique_opens',label:'Opens',align:'right',render:v=>fmt.number(v)},
                {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
                {key:'sent',label:'Open %',align:'right',render:(v,row)=>{const r=+v>0?Math.round(+row.unique_opens/+v*1000)/10:0; return <span className={`font-mono font-bold ${r>30?'text-emerald-600':r>15?'text-blue-600':r>5?'text-amber-600':'text-red-600'}`}>{r}%</span>}},
                {key:'sent',label:'Health',align:'center',render:(v,row)=>{const r=+v>0?+row.unique_opens/+v*100:0; return healthBadge(r>30?'good':r>15?'average':r>5?'low':r>0?'poor':'likely_spam')}},
              ]} data={perfData.syncedEmails} searchable={['campaign_name','parent_campaign']} />
            </div>
          )}
          {perfData?.byEmail?.length > 0 ? (
            <DataTable columns={[
              {key:'campaign',label:'Campaign',render:v=><span className="font-semibold text-xs">{clean(v)}</span>},
              {key:'email_id',label:'Email',render:v=><span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{clean(v)}</span>},
              {key:'sends',label:'Sent',align:'right',render:v=>fmt.number(v)},
              {key:'opens',label:'Opens',align:'right',render:v=>fmt.number(v)},
              {key:'unique_openers',label:'Unique',align:'right',render:v=>fmt.number(v)},
              {key:'open_rate',label:'Open %',align:'right',render:v=><span className="font-mono font-bold">{v}%</span>},
              {key:'health',label:'Placement',align:'center',render:v=>healthBadge(v)},
            ]} data={perfData.byEmail} searchable={['campaign','email_id']} />
          ) : <div className="text-center py-16 text-surface-400"><Eye size={48} className="mx-auto mb-4 opacity-30" /><div className="text-lg font-display font-bold mb-2">No individual email data yet</div><p className="text-sm max-w-md mx-auto">Each tracking pixel has a unique email_id. You'll see per-email open rates for A/B testing here.</p></div>}
        </div>)}

        {/* ═══ SALES BY CTA ═══ */}
        {tab === 'cta' && (<div className="space-y-6">
          {perfData?.byCTA?.length > 0 ? (
            <DataTable columns={[
              {key:'campaign',label:'Campaign',render:v=><span className="font-semibold text-xs">{clean(v)}</span>},
              {key:'cta',label:'CTA Button',render:v=><span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{clean(v)}</span>},
              {key:'provider',label:'Provider',render:v=><span className="text-xs capitalize">{v}</span>},
              {key:'orders',label:'Sales',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
              {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span>},
              {key:'profit',label:'Profit',align:'right',render:v=><span className="font-mono">{fmt.currency(v)}</span>},
              {key:'aov',label:'AOV',align:'right',render:v=>fmt.currency(v)},
            ]} data={perfData.byCTA} searchable={['campaign','cta','provider']} />
          ) : <div className="text-center py-16 text-surface-400"><ShoppingCart size={48} className="mx-auto mb-4 opacity-30" /><div className="text-lg font-display font-bold mb-2">No CTA sales data yet</div><p className="text-sm max-w-md mx-auto">When customers click UTM-tagged email links and buy, each sale is attributed to the exact CTA they clicked.</p></div>}
        </div>)}

        {/* ═══ DELIVERABILITY ═══ */}
        {tab === 'deliverability' && (<div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
            <h3 className="font-display font-bold text-sm mb-2">Inbox Placement Estimate</h3>
            <p className="text-xs text-surface-400 mb-4">Based on open rates: Inbox ({'>'}30%) · Mixed (15-30%) · Promotions (5-15%) · Spam ({'<'}5%)</p>
            {perfData?.syncedCampaigns?.length > 0 ? (
              <div className="space-y-2">{perfData.syncedCampaigns.map((c,i) => {
                const rate = +c.sent > 0 ? Math.round(+c.unique_opens/+c.sent*1000)/10 : 0;
                const h = rate>30?'good':rate>15?'average':rate>5?'low':rate>0?'poor':'likely_spam';
                return (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{c.campaign_name}</div><div className="text-xs text-surface-400">{fmt.number(c.sent)} sent · {fmt.number(c.unique_opens)} opened · {fmt.number(c.bounces)} bounced</div></div>
                  <div className="text-right mr-3"><div className="font-mono text-sm font-bold">{rate}%</div></div>
                  {healthBadge(h)}
                </div>
              )})}</div>
            ) : perfData?.byCampaign?.length > 0 ? (
              <div className="space-y-2">{perfData.byCampaign.map((c,i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{clean(c.campaign)}</div><div className="text-xs text-surface-400">{fmt.number(c.sends)} sent · {fmt.number(c.unique_openers)} opened</div></div>
                  <div className="text-right mr-3"><div className="font-mono text-sm font-bold">{c.open_rate}%</div></div>
                  {healthBadge(c.health)}
                </div>
              ))}</div>
            ) : <p className="text-center py-8 text-surface-400 text-sm">Click "Sync Enginemailer" to pull campaign stats, or add tracking pixels for real-time tracking.</p>}
          </div>
          {perfData?.alerts?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-3">Deliverability Alerts</h3>
              <div className="space-y-2">{perfData.alerts.map((a,i) => (
                <div key={i} className={`p-3 rounded-xl border ${a.type==='spam'?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2"><AlertTriangle size={14} className={a.type==='spam'?'text-red-500':'text-amber-500'} /><span className="text-sm font-semibold">{a.type==='spam'?'🔴 Likely Spam':'🟡 Low Opens'}</span></div>
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
