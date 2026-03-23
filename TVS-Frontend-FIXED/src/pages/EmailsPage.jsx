import { useState } from 'react';
import api, { fmt } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, DollarSign, TrendingUp, ShoppingCart, RefreshCw, Eye, Send, ChevronDown, ChevronRight } from 'lucide-react';

const typeLabels = { winback:'Win-Back', post_purchase:'Post-Purchase', upsell:'Upsell', welcome:'Welcome', referral:'Referral', educational:'Educational', affiliate:'Affiliate', review:'Reviews', lifecycle:'Lifecycle', recovery:'Recovery', lead_gen:'Lead Gen', transactional:'Transactional' };
const typeColors = { winback:'border-red-200 bg-red-50', post_purchase:'border-blue-200 bg-blue-50', upsell:'border-purple-200 bg-purple-50', welcome:'border-emerald-200 bg-emerald-50', referral:'border-amber-200 bg-amber-50', educational:'border-teal-200 bg-teal-50', affiliate:'border-indigo-200 bg-indigo-50', review:'border-pink-200 bg-pink-50', lifecycle:'border-orange-200 bg-orange-50', recovery:'border-rose-200 bg-rose-50', lead_gen:'border-cyan-200 bg-cyan-50', transactional:'border-gray-200 bg-gray-50' };

function CampaignRow({ camp }) {
  const [open, setOpen] = useState(false);
  const hasData = camp.sends > 0 || camp.orders > 0;
  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors text-left">
        <span className="text-surface-400">{open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{camp.name}</div>
          <div className="text-xs text-surface-400">{camp.emails} emails · {camp.provider}</div>
        </div>
        <div className="flex items-center gap-6 text-right">
          {camp.sends > 0 && <div><div className="text-xs text-surface-400">Sent</div><div className="font-mono text-sm font-bold">{fmt.number(camp.sends)}</div></div>}
          {camp.unique_opens > 0 && <div><div className="text-xs text-surface-400">Opens</div><div className="font-mono text-sm font-bold text-amber-600">{fmt.number(camp.unique_opens)}</div></div>}
          {camp.open_rate !== null && camp.open_rate > 0 && <div><div className="text-xs text-surface-400">Open %</div><div className={`font-mono text-sm font-bold ${camp.open_rate>30?'text-emerald-600':camp.open_rate>15?'text-blue-600':'text-amber-600'}`}>{camp.open_rate}%</div></div>}
          {camp.orders > 0 && <div><div className="text-xs text-surface-400">Sales</div><div className="font-mono text-sm font-bold text-purple-600">{fmt.number(camp.orders)}</div></div>}
          {camp.revenue > 0 && <div><div className="text-xs text-surface-400">Revenue</div><div className="font-mono text-sm font-bold text-emerald-600">{fmt.currency(camp.revenue)}</div></div>}
          {!hasData && <span className="text-xs text-surface-300 italic">No data yet</span>}
        </div>
      </button>
      {open && (
        <div className="border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center mb-3">
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Emails</div><div className="font-bold text-sm">{camp.emails}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Sent</div><div className="font-bold text-sm">{fmt.number(camp.sends)}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Opens</div><div className="font-bold text-sm text-amber-600">{fmt.number(camp.unique_opens)}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Clicks</div><div className="font-bold text-sm text-blue-600">{fmt.number(camp.clicks)}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Bounces</div><div className="font-bold text-sm text-red-500">{fmt.number(camp.bounces)}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Orders</div><div className="font-bold text-sm text-purple-600">{fmt.number(camp.orders)}</div></div>
            <div className="bg-white dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Revenue</div><div className="font-bold text-sm text-emerald-600">{fmt.currency(camp.revenue)}</div></div>
          </div>
          {camp.sends > 0 && camp.open_rate !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-xs text-surface-400">Open Rate:</div>
              <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${camp.open_rate>30?'bg-emerald-500':camp.open_rate>15?'bg-blue-500':'bg-amber-500'}`} style={{width: Math.min(100, camp.open_rate) + '%'}} />
              </div>
              <div className="text-xs font-mono font-bold">{camp.open_rate}%</div>
            </div>
          )}
          {camp.emails > 0 && (
            <div className="mt-3 text-xs text-surface-400">
              This campaign has {camp.emails} emails. Individual email tracking data will appear as emails are sent and opened.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  const [period, setPeriod] = useState('all');
  const [tab, setTab] = useState('campaigns');
  const { data: allCamps, loading: l1 } = useApi('/analytics/all-campaigns', { period }, [period]);
  const { data: perfData, loading: l2 } = useApi('/analytics/email-performance', { period }, [period]);
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const loading = l1 || l2;

  const campaigns = allCamps?.campaigns || [];
  const groups = allCamps?.groups || {};
  const s = perfData?.summary || {};

  const totalSends = campaigns.reduce((t,c) => t + c.sends, 0);
  const totalOpens = campaigns.reduce((t,c) => t + c.unique_opens, 0);
  const totalOrders = campaigns.reduce((t,c) => t + c.orders, 0);
  const totalRevenue = campaigns.reduce((t,c) => t + c.revenue, 0);

  const doSync = async () => {
    setSyncing(true);
    try {
      await api.post('/sync/woocommerce');
      try { await api.post('/sync/enginemailer'); } catch(e) {}
      toast.success('Synced WooCommerce + Enginemailer');
    } catch(e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSyncing(false); }
  };

  return (
    <div>
      <PageHeader title="Email Analytics" subtitle={"All " + campaigns.length + " campaigns — revenue, opens, deliverability"}>
        <button onClick={doSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing?'animate-spin':''}/> {syncing?'Syncing...':'Sync All'}
        </button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6 flex-wrap">
        {[['campaigns','All Campaigns'],['revenue','Revenue'],['funnel','Funnel']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          <MetricCard label="Total Sent" value={totalSends || +(s.total_sends||0)} format="number" icon={Send} color="bg-surface-50 text-surface-600" />
          <MetricCard label="Total Opens" value={totalOpens || +(s.unique_openers||0)} format="number" icon={Eye} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Email Orders" value={totalOrders || +(s.total_email_orders||0)} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Email Revenue" value={totalRevenue || +(s.total_email_revenue||0)} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        </div>

        {tab === 'campaigns' && (
          <div className="space-y-6">
            {Object.entries(groups).map(([type, camps]) => (
              <div key={type}>
                <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase mb-3 ${typeColors[type]||'bg-surface-100'} dark:bg-surface-800`}>
                  {typeLabels[type]||type} — {camps.length} campaigns
                </div>
                {camps.map((camp, i) => <CampaignRow key={camp.id||i} camp={camp} />)}
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center py-16 text-surface-400">
                <Mail size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Loading campaigns...</p>
              </div>
            )}
          </div>
        )}

        {tab === 'revenue' && (
          <div className="space-y-6">
            {perfData?.daily?.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Daily Email Revenue</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={perfData.daily}>
                    <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)} />
                    <YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)} />
                    <Tooltip formatter={v=>fmt.currency(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Top revenue campaigns */}
            <h3 className="font-display font-bold text-sm">Campaigns by Revenue</h3>
            {campaigns.filter(c=>c.revenue>0).sort((a,b)=>b.revenue-a.revenue).map((c,i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-surface-800 rounded-xl border border-surface-100">
                <div><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-surface-400">{c.orders} orders</div></div>
                <div className="font-display font-bold text-emerald-600">{fmt.currency(c.revenue)}</div>
              </div>
            ))}
            {campaigns.filter(c=>c.revenue>0).length === 0 && (
              <p className="text-center py-8 text-surface-400 text-sm">No email revenue tracked yet. After WooCommerce sync, orders with UTM email parameters will show revenue here.</p>
            )}
          </div>
        )}

        {tab === 'funnel' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-surface-50 to-purple-50 dark:from-surface-800 dark:to-purple-900/20 rounded-2xl border p-6">
              <h3 className="font-display font-bold text-sm mb-4">Email Funnel</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div><div className="text-xs text-surface-400 uppercase mb-1">Sent</div><div className="text-2xl font-display font-bold">{fmt.number(totalSends||+(s.total_sends||0))}</div></div>
                <div><div className="text-xs text-surface-400 uppercase mb-1">Opened</div><div className="text-2xl font-display font-bold text-amber-600">{fmt.number(totalOpens||+(s.unique_openers||0))}</div></div>
                <div><div className="text-xs text-surface-400 uppercase mb-1">Purchased</div><div className="text-2xl font-display font-bold text-purple-600">{fmt.number(totalOrders||+(s.total_email_orders||0))}</div></div>
                <div><div className="text-xs text-surface-400 uppercase mb-1">Revenue</div><div className="text-2xl font-display font-bold text-emerald-600">{fmt.currency(totalRevenue||+(s.total_email_revenue||0))}</div></div>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-3">Campaign Summary</h3>
              <div className="text-xs text-surface-400 mb-3">{campaigns.length} total campaigns · {campaigns.reduce((t,c)=>t+c.emails,0)} total emails</div>
              <div className="space-y-2">
                {Object.entries(groups).map(([type, camps]) => {
                  const gs = camps.reduce((t,c)=>t+c.sends,0);
                  const go = camps.reduce((t,c)=>t+c.unique_opens,0);
                  const gr = camps.reduce((t,c)=>t+c.revenue,0);
                  return (
                    <div key={type} className="flex items-center gap-3 p-2 rounded-lg bg-surface-50 dark:bg-surface-700">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[type]||''}`}>{typeLabels[type]||type}</span>
                      <div className="flex-1 text-xs text-surface-400">{camps.length} campaigns</div>
                      <div className="text-xs font-mono">{fmt.number(gs)} sent</div>
                      <div className="text-xs font-mono text-amber-600">{fmt.number(go)} opens</div>
                      <div className="text-xs font-mono font-bold text-emerald-600">{fmt.currency(gr)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
