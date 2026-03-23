import { useState } from 'react';
import api, { fmt } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Globe, Users, Eye, MousePointer, Search, Monitor, Smartphone, Tablet, RefreshCw, TrendingUp, Clock, ArrowUp } from 'lucide-react';

const COLORS = ['#f1c349','#6366f1','#22c55e','#ef4444','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#14b8a6','#f97316'];

export default function TrafficPage() {
  const [tab, setTab] = useState('analytics');
  const { data: gaData, loading: l1, refetch: refetchGA } = useApi('/analytics/ga-traffic', {}, []);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();
  const ga = gaData?.ga || {};
  const sc = gaData?.sc || {};

  const syncGA = async () => {
    setSyncing(true);
    try {
      await api.post('/sync/google-analytics');
      await api.post('/sync/search-console');
      toast.success('Google Analytics & Search Console synced');
      refetchGA();
    } catch(e) { toast.error(e.response?.data?.error || e.message); }
    finally { setSyncing(false); }
  };

  // GA4 totals
  const gaTotals = (ga?.daily||[]).reduce((t,r) => ({
    sessions: t.sessions+(r.sessions||0), users: t.users+(r.totalUsers||0),
    newUsers: t.newUsers+(r.newUsers||0), pageviews: t.pageviews+(r.screenPageViews||0),
    engaged: t.engaged+(r.engagedSessions||0)
  }), {sessions:0,users:0,newUsers:0,pageviews:0,engaged:0});
  const avgBounce = (ga?.daily||[]).length > 0 ? Math.round((ga.daily.reduce((s,r)=>s+(r.bounceRate||0),0)/ga.daily.length)*10)/10 : 0;

  // SC totals
  const scTotals = (sc?.daily||[]).reduce((t,r) => ({
    clicks: t.clicks+r.clicks, impressions: t.impressions+r.impressions
  }), {clicks:0,impressions:0});
  const avgCtr = scTotals.impressions > 0 ? Math.round(scTotals.clicks/scTotals.impressions*1000)/10 : 0;

  return (
    <div>
      <PageHeader title="Website Traffic" subtitle="Google Analytics + Search Console — real traffic data">
        <button onClick={syncGA} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing?'animate-spin':''} /> {syncing?'Syncing...':'Sync GA + SC'}
        </button>
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6 flex-wrap">
        {[['analytics','Google Analytics'],['search','Search Console'],['sources','Traffic Sources'],['pages','Top Pages']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {!ga?.daily?.length && !sc?.daily?.length ? (
        <div className="text-center py-16 text-surface-400">
          <Globe size={48} className="mx-auto mb-4 opacity-30" />
          <div className="text-lg font-display font-bold mb-2">No analytics data yet</div>
          <p className="text-sm max-w-lg mx-auto mb-4">Connect Google Analytics and Search Console in Settings, then click "Sync GA + SC" above. Data will auto-sync every 4 hours after that.</p>
          {gaData?.gaSyncedAt && <p className="text-xs text-surface-400">Last synced: {new Date(gaData.gaSyncedAt).toLocaleString()}</p>}
        </div>
      ) : (<>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 stagger">
          <MetricCard label="Sessions" value={gaTotals.sessions} format="number" icon={Eye} color="bg-blue-50 text-blue-600" />
          <MetricCard label="Users" value={gaTotals.users} format="number" icon={Users} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Pageviews" value={gaTotals.pageviews} format="number" icon={Globe} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="Bounce Rate" value={avgBounce} format="pct" icon={TrendingUp} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Search Clicks" value={scTotals.clicks} format="number" icon={Search} color="bg-orange-50 text-orange-600" />
          <MetricCard label="Search CTR" value={avgCtr} format="pct" icon={MousePointer} color="bg-rose-50 text-rose-600" />
        </div>

        {gaData?.gaSyncedAt && <p className="text-xs text-surface-400 mb-4">GA synced: {new Date(gaData.gaSyncedAt).toLocaleString()} {gaData.scSyncedAt ? ' · SC synced: '+new Date(gaData.scSyncedAt).toLocaleString() : ''}</p>}

        {/* ═══ GOOGLE ANALYTICS TAB ═══ */}
        {tab === 'analytics' && (<div className="space-y-6">
          {ga?.daily?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Daily Sessions & Users</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={ga.daily}>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(4,6)+'/'+v?.slice(6)} />
                  <YAxis tick={{fontSize:10}} /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} name="Sessions" />
                  <Area type="monotone" dataKey="totalUsers" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} name="Users" />
                  <Area type="monotone" dataKey="newUsers" stroke="#22c55e" fill="#22c55e20" strokeWidth={1} name="New Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ga?.devices?.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Device Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={ga.devices} dataKey="sessions" nameKey="deviceCategory" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {ga.devices.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {ga?.countries?.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Top Countries</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ga.countries.slice(0,8)} layout="vertical">
                    <XAxis type="number" tick={{fontSize:10}} />
                    <YAxis type="category" dataKey="country" tick={{fontSize:10}} width={80} />
                    <Tooltip /><Bar dataKey="sessions" fill="#f1c349" radius={[0,8,8,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>)}

        {/* ═══ SEARCH CONSOLE TAB ═══ */}
        {tab === 'search' && (<div className="space-y-6">
          {sc?.daily?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Search Performance (Daily)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={sc.daily}>
                  <XAxis dataKey="key" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis yAxisId="left" tick={{fontSize:10}} /><YAxis yAxisId="right" orientation="right" tick={{fontSize:10}} />
                  <Tooltip /><Legend />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} name="Clicks" />
                  <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#3b82f6" fill="#3b82f620" strokeWidth={1} name="Impressions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {sc?.queries?.length > 0 && (<>
            <h3 className="font-display font-bold text-sm">Top Search Keywords</h3>
            <DataTable columns={[
              {key:'key',label:'Keyword',render:v=><span className="font-semibold text-sm">{v}</span>},
              {key:'clicks',label:'Clicks',align:'right',render:v=><span className="font-bold text-emerald-600">{fmt.number(v)}</span>},
              {key:'impressions',label:'Impressions',align:'right',render:v=>fmt.number(v)},
              {key:'ctr',label:'CTR',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'position',label:'Position',align:'right',render:v=><span className={`font-mono font-bold ${v<=3?'text-emerald-600':v<=10?'text-blue-600':v<=20?'text-amber-600':'text-red-600'}`}>{v}</span>},
            ]} data={sc.queries} searchable={['key']} />
          </>)}
        </div>)}

        {/* ═══ TRAFFIC SOURCES TAB ═══ */}
        {tab === 'sources' && (<div className="space-y-6">
          {ga?.sources?.length > 0 ? (<>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Sessions by Channel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ga.sources}>
                  <XAxis dataKey="sessionDefaultChannelGroup" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{fontSize:10}} /><Tooltip /><Legend />
                  <Bar dataKey="sessions" fill="#6366f1" name="Sessions" radius={[4,4,0,0]} />
                  <Bar dataKey="conversions" fill="#22c55e" name="Conversions" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable columns={[
              {key:'sessionDefaultChannelGroup',label:'Channel',render:v=><span className="font-semibold text-sm">{v}</span>},
              {key:'sessions',label:'Sessions',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
              {key:'totalUsers',label:'Users',align:'right',render:v=>fmt.number(v)},
              {key:'engagedSessions',label:'Engaged',align:'right',render:v=>fmt.number(v)},
              {key:'conversions',label:'Conversions',align:'right',render:v=><span className="font-bold text-emerald-600">{fmt.number(v)}</span>},
            ]} data={ga.sources} searchable={['sessionDefaultChannelGroup']} />
          </>) : <p className="text-center py-12 text-surface-400">Sync Google Analytics to see traffic sources.</p>}
        </div>)}

        {/* ═══ TOP PAGES TAB ═══ */}
        {tab === 'pages' && (<div className="space-y-6">
          {ga?.landingPages?.length > 0 && (<>
            <h3 className="font-display font-bold text-sm">Landing Pages (GA4)</h3>
            <DataTable columns={[
              {key:'landingPage',label:'Page',render:v=><span className="text-sm font-mono">{v}</span>},
              {key:'sessions',label:'Sessions',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
              {key:'totalUsers',label:'Users',align:'right',render:v=>fmt.number(v)},
              {key:'bounceRate',label:'Bounce',align:'right',render:v=><span className="font-mono">{Math.round(v*10)/10}%</span>},
              {key:'conversions',label:'Conversions',align:'right',render:v=><span className="font-bold text-emerald-600">{fmt.number(v)}</span>},
            ]} data={ga.landingPages} searchable={['landingPage']} />
          </>)}
          {sc?.pages?.length > 0 && (<>
            <h3 className="font-display font-bold text-sm mt-6">Search Console Pages</h3>
            <DataTable columns={[
              {key:'key',label:'URL',render:v=><span className="text-xs font-mono">{v?.replace('https://thevitaminshots.com','')}</span>},
              {key:'clicks',label:'Clicks',align:'right',render:v=><span className="font-bold text-emerald-600">{fmt.number(v)}</span>},
              {key:'impressions',label:'Impressions',align:'right',render:v=>fmt.number(v)},
              {key:'ctr',label:'CTR',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'position',label:'Avg Position',align:'right',render:v=><span className="font-mono">{v}</span>},
            ]} data={sc.pages} searchable={['key']} />
          </>)}
          {!ga?.landingPages?.length && !sc?.pages?.length && <p className="text-center py-12 text-surface-400">Sync Google Analytics and Search Console to see page data.</p>}
        </div>)}
      </>)}
    </div>
  );
}
