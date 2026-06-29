import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api, { fmt } from '../utils/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { DollarSign, TrendingUp, Target, MousePointer, Eye, RefreshCw, Zap, ArrowRight, AlertTriangle, PauseCircle, Play, Palette, Clock, } from 'lucide-react';

const COLORS = ['#3b82f6','#ef4444','#000000','#f59e0b','#8b5cf6','#ec4899','#22c55e'];
const platformColor = { meta:'#3b82f6', google:'#ef4444', tiktok:'#000000', pinterest:'#e60023', microsoft:'#00a4ef' };

export default function AdsHubPage() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('overview');
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();
  const { data, loading } = useApi('/ads/unified', { period }, [period]);
  const { data: copilot, loading: l2 } = useApi('/ads/ai-copilot', { period }, [period]);
  const { data: daypart } = useApi('/ads/dayparting', { period }, [period]);
  const t = data?.totals || {};

  const syncAds = async () => { setSyncing(true); try { await api.post('/sync/ad-spend'); toast.success('Ad spend synced'); } catch(e) { toast.error(e.response?.data?.error||e.message); } finally { setSyncing(false); } };
  const actionIcon = (type) => type==='pause'?<PauseCircle size={16} className="text-red-500"/>:type==='scale'?<Play size={16} className="text-emerald-500"/>:type==='creative'||type==='fatigue'?<Palette size={16} className="text-amber-500"/>:<ArrowRight size={16} className="text-blue-500"/>;

  return (
    <div>
      <PageHeader title="Ads Hub" subtitle="Unified ad management — all platforms, AI copilot, campaign optimization">
        <button onClick={syncAds} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <RefreshCw size={14} className={syncing?'animate-spin':''}/> Sync Ads
        </button>
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-1 mb-6 flex-wrap">
        {[['overview','Overview'],['platforms','Platforms'],['campaigns','Campaigns'],['copilot','AI Copilot'],['dayparting','Dayparting']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={6}/><SkeletonTable/></> : (!data?.platforms?.length && !copilot?.actions?.length ? (
        <div className="text-center py-16 text-surface-400 dark:text-surface-500"><Target size={48} className="mx-auto mb-4 opacity-30"/><div className="text-lg font-display font-bold mb-2">No ad data yet</div><p className="text-sm">Connect Meta, Google, or TikTok Ads in Settings, then click Sync Ads.</p></div>
      ) : (<>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 stagger">
          <MetricCard label="Total Spend" value={t.spend} icon={DollarSign} color="bg-red-50 text-red-600" />
          <MetricCard label="Revenue" value={t.revenue} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <MetricCard label="ROAS" value={t.roas+'x'} format="text" icon={Target} color="bg-purple-50 text-purple-600" />
          <MetricCard label="Clicks" value={t.clicks} format="number" icon={MousePointer} color="bg-blue-50 text-blue-600" />
          <MetricCard label="CPC" value={t.cpc} icon={DollarSign} color="bg-amber-50 text-amber-600" />
          <MetricCard label="Conversions" value={t.conversions} format="number" icon={Target} color="bg-indigo-50 text-indigo-600" />
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (<div className="space-y-6">
          {data?.dailyTotals?.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <h3 className="font-display font-bold text-sm mb-4">Daily Spend vs Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.dailyTotals}>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/>
                  <Tooltip formatter={v=>fmt.currency(v)}/><Legend/>
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e15" strokeWidth={2} name="Revenue"/>
                  <Area type="monotone" dataKey="spend" stroke="#ef4444" fill="#ef444415" strokeWidth={2} name="Spend"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:p-6">
            {data?.platforms?.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Spend by Platform</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={(data?.platforms||[]).map(p=>({...p,spend:+p.spend}))} dataKey="spend" nameKey="platform" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${((percent*100)||0).toFixed(0)}%`}>
                    {(data?.platforms||[]).map((p,i)=><Cell key={i} fill={platformColor[p.platform]||COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>fmt.currency(v)}/></PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {data?.platforms?.length > 1 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">ROAS by Platform</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.platforms}>
                    <XAxis dataKey="platform" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/>
                    <Tooltip/><Bar dataKey="roas" name="ROAS" radius={[8,8,0,0]}>
                      {(data?.platforms||[]).map((p,i)=><Cell key={i} fill={+p.roas>=3?'#22c55e':+p.roas>=1.5?'#3b82f6':'#ef4444'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {/* Quick AI insights */}
          {copilot?.insights?.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
              <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2"><Zap size={16} className="text-indigo-500"/> AI Insights</h3>
              <div className="space-y-2">{(copilot?.insights||[]).map((ins,i)=>(
                <div key={i} className="flex items-start gap-2 text-sm"><span>{ins.type==='positive'?'✅':ins.type==='negative'?'🔴':'ℹ️'}</span><span className="dark:text-surface-300">{ins.text}</span></div>
              ))}</div>
            </div>
          )}
        </div>)}

        {/* ═══ PLATFORMS ═══ */}
        {tab === 'platforms' && (<div className="space-y-6">
          {data?.platforms?.map((p,i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:platformColor[p.platform]||'#6366f1'}}>{p.platform?.slice(0,2).toUpperCase()}</div>
                <div><div className="font-display font-bold text-lg capitalize">{p.platform}</div><div className="text-xs text-surface-400">{fmt.number(p.impressions)} impressions</div></div>
                <div className="ml-auto text-right">
                  <div className={`text-2xl font-display font-bold ${+p.roas>=3?'text-emerald-600':+p.roas>=1.5?'text-blue-600':'text-red-600'}`}>{((+p.roas)||0).toFixed(1)}x</div>
                  <div className="text-xs text-surface-400">ROAS</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Spend</div><div className="font-mono text-sm font-bold text-red-500">{fmt.currency(p.spend)}</div></div>
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Revenue</div><div className="font-mono text-sm font-bold text-emerald-600">{fmt.currency(p.revenue)}</div></div>
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Clicks</div><div className="font-mono text-sm">{fmt.number(p.clicks)}</div></div>
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">CTR</div><div className="font-mono text-sm">{p.ctr}%</div></div>
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">CPC</div><div className="font-mono text-sm">{fmt.currency(p.cpc)}</div></div>
                <div className="bg-surface-50 dark:bg-surface-700 rounded-lg p-2"><div className="text-[10px] text-surface-400 uppercase">Conv.</div><div className="font-mono text-sm font-bold">{fmt.number(p.conversions)}</div></div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ═══ CAMPAIGNS ═══ */}
        {tab === 'campaigns' && (<div className="space-y-6">
          {data?.campaigns?.length > 0 ? (
            <DataTable columns={[
              {key:'platform',label:'Platform',render:v=><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{backgroundColor:platformColor[v]||'#6366f1'}}>{v}</span>},
              {key:'campaign_name',label:'Campaign',render:v=><span className="font-semibold text-sm dark:text-surface-200">{v||'Unnamed'}</span>},
              {key:'spend',label:'Spend',align:'right',render:v=><span className="font-mono text-red-500">{fmt.currency(v)}</span>},
              {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono text-emerald-600">{fmt.currency(v)}</span>},
              {key:'roas',label:'ROAS',align:'right',render:v=><span className={`font-mono font-bold ${+v>=3?'text-emerald-600':+v>=1.5?'text-blue-600':'text-red-600'}`}>{((+v)||0).toFixed(1)}x</span>},
              {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
              {key:'ctr',label:'CTR',align:'right',render:v=><span className="font-mono">{v}%</span>},
              {key:'cpc',label:'CPC',align:'right',render:v=>fmt.currency(v)},
              {key:'conversions',label:'Conv.',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
            ]} data={data.campaigns} searchable={['campaign_name','platform']} />
          ) : <p className="text-center py-12 text-surface-400">No campaign data. Sync your ad platforms.</p>}
        </div>)}

        {/* ═══ DAYPARTING ═══ */}
        {tab === 'dayparting' && (<div className="space-y-6">
          {!daypart?.byDayOfWeek?.length && !daypart?.byHour?.length ? (
            <div className="text-center py-16 text-surface-400 dark:text-surface-500"><Clock size={48} className="mx-auto mb-4 opacity-30"/><div className="text-lg font-display font-bold mb-2">No dayparting data yet</div><p className="text-sm">Sync your ad platforms to see performance by day of week and hour. Click "Sync Ads" then come back.</p>{!daypart?.hasHourlyData && <p className="text-xs text-surface-400 mt-2">For hourly data, go to Settings and ensure Meta Ads credentials are configured.</p>}</div>
          ) : (<>
            {/* Day of Week */}
            {daypart?.byDayOfWeek?.length > 0 && (<>
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Performance by Day of Week</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daypart.byDayOfWeek}>
                    <XAxis dataKey="day_name" tick={{fontSize:11}}/><YAxis yAxisId="left" tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:10}}/>
                    <Tooltip formatter={(v,n) => [n==='roas'?(+((v))||0).toFixed(1)+'x':n==='ctr'?v+'%':fmt.currency(v), n]}/><Legend/>
                    <Bar yAxisId="left" dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4,4,0,0]}/>
                    <Bar yAxisId="left" dataKey="spend" fill="#ef4444" name="Spend" radius={[4,4,0,0]}/>
                    <Bar yAxisId="right" dataKey="conversions" fill="#8b5cf6" name="Conversions" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">ROAS & CTR by Day</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daypart.byDayOfWeek}>
                    <XAxis dataKey="day_name" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/>
                    <Bar dataKey="roas" name="ROAS" radius={[4,4,0,0]}>
                      {(daypart?.byDayOfWeek||[]).map((d,i) => <Cell key={i} fill={+d.roas>=3?'#22c55e':+d.roas>=1.5?'#3b82f6':+d.roas>0?'#f59e0b':'#ef4444'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <DataTable columns={[
                {key:'day_name',label:'Day',render:v=><span className="font-semibold dark:text-surface-200">{v}</span>},
                {key:'spend',label:'Spend',align:'right',render:v=><span className="font-mono text-red-500">{fmt.currency(v)}</span>},
                {key:'clicks',label:'Clicks',align:'right',render:v=>fmt.number(v)},
                {key:'ctr',label:'CTR',align:'right',render:v=><span className="font-mono">{v}%</span>},
                {key:'conversions',label:'Conv.',align:'right',render:v=><span className="font-bold">{fmt.number(v)}</span>},
                {key:'revenue',label:'Revenue',align:'right',render:v=><span className="font-mono text-emerald-600">{fmt.currency(v)}</span>},
                {key:'roas',label:'ROAS',align:'right',render:v=><span className={`font-mono font-bold ${+v>=3?'text-emerald-600':+v>=1.5?'text-blue-600':'text-red-600'}`}>{((+v)||0).toFixed(1)}x</span>},
                {key:'cpa',label:'CPA',align:'right',render:v=>fmt.currency(v)},
              ]} data={daypart.byDayOfWeek}/>
            </>)}

            {/* Hourly */}
            {daypart?.byHour?.length > 0 && (<>
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Performance by Hour of Day</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daypart.byHour}>
                    <XAxis dataKey="hour" tick={{fontSize:10}} tickFormatter={h=>h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p'}/><YAxis tick={{fontSize:10}} tickFormatter={v=>'$'+fmt.compact(v)}/>
                    <Tooltip formatter={(v,n)=>[n==='roas'?((+v)||0).toFixed(1)+'x':fmt.currency(v),n]} labelFormatter={h=>h===0?'12 AM':h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'}/><Legend/>
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[2,2,0,0]}/>
                    <Bar dataKey="spend" fill="#ef4444" name="Spend" radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Hourly ROAS Heatmap</h3>
                <div className="flex flex-wrap gap-1">{(daypart?.byHour||[]).map((h,i) => {
                  const r = +h.roas;
                  const bg = r>=4?'bg-emerald-600':r>=3?'bg-emerald-500':r>=2?'bg-emerald-400':r>=1?'bg-blue-400':r>0?'bg-amber-400':'bg-surface-200 dark:bg-surface-700';
                  const hr = +h.hour;
                  const label = hr===0?'12a':hr<12?hr+'a':hr===12?'12p':(hr-12)+'p';
                  return <div key={i} className={`${bg} rounded px-2 py-1 text-[10px] font-mono text-white min-w-[42px] text-center`} title={label+': ROAS '+(+r||0).toFixed(1)+'x, $'+Math.round(+h.spend)+' spend'}>{label}<br/>{(+r||0).toFixed(1)}x</div>;
                })}</div>
                <div className="flex gap-4 mt-2 text-[10px] text-surface-400"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-600"/> 4x+</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400"/> 2-4x</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400"/> 1-2x</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400"/> {'<'}1x</span></div>
              </div>
            </>)}

            {/* Best campaigns by day */}
            {daypart?.topCampsByDay && Object.keys(daypart.topCampsByDay).length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <h3 className="font-display font-bold text-sm mb-4">Top Campaigns by Day</h3>
                <div className="space-y-3">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,dow) => {
                  const camps = daypart.topCampsByDay[dow];
                  if (!camps?.length) return null;
                  return <div key={dow}><div className="text-xs font-bold text-surface-400 uppercase mb-1">{day}</div>{(camps||[]).slice(0,2).map((camp,j) => (
                    <div key={j} className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-700 rounded-lg mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{backgroundColor:platformColor[camp.platform]||'#6366f1'}}>{camp.platform}</span>
                      <span className="text-xs font-semibold flex-1 truncate dark:text-surface-200">{camp.campaign_name}</span>
                      <span className={`text-xs font-mono font-bold ${+camp.roas>=3?'text-emerald-600':+camp.roas>=1.5?'text-blue-600':'text-amber-600'}`}>{((+camp.roas)||0).toFixed(1)}x</span>
                      <span className="text-xs text-surface-400">${Math.round(+camp.revenue)}</span>
                    </div>
                  ))}</div>;
                })}</div>
              </div>
            )}

            {/* AI Recommendations */}
            {daypart?.recommendations?.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
                <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><Zap size={16} className="text-indigo-500"/> AI Bid Recommendations</h3>
                <div className="space-y-3">{(daypart?.recommendations||[]).map((rec,i) => (
                  <div key={i} className={`rounded-xl p-4 border ${rec.priority==='high'?'bg-white dark:bg-surface-800 border-red-200 dark:border-red-800':'bg-white dark:bg-surface-800 border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{rec.type==='increase_bid'?'📈':rec.type==='decrease_bid'?'📉':rec.type==='peak_hours'?'⏰':rec.type==='dead_hours'?'💤':'📊'}</span>
                      <span className="font-semibold text-sm dark:text-surface-200">{rec.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rec.priority==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{rec.priority}</span>
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">{rec.detail}</div>
                  </div>
                ))}</div>
              </div>
            )}

            {!daypart?.hasHourlyData && daypart?.byDayOfWeek?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
                <span className="font-semibold">Want hourly breakdown?</span> The day-of-week analysis uses daily data from all platforms. For hourly heatmaps and peak-hour optimization, sync Meta Ads hourly data from Settings.
              </div>
            )}
          </>)}
        </div>)}

        {/* ═══ AI COPILOT ═══ */}
        {tab === 'copilot' && (<div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4 sm:p-6">
            <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2"><Zap size={20} className="text-indigo-500"/> AI Performance Copilot</h3>
            <p className="text-xs text-surface-400 mb-4">Analyzed {copilot?.campaignsAnalyzed||0} campaigns across ${fmt.number(copilot?.totalSpend||0)} ad spend</p>
            {copilot?.insights?.map((ins,i) => (
              <div key={i} className="flex items-start gap-2 text-sm mb-2"><span>{ins.type==='positive'?'✅':ins.type==='negative'?'🔴':'ℹ️'}</span><span className="dark:text-surface-300">{ins.text}</span></div>
            ))}
          </div>

          {copilot?.actions?.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm">Recommended Actions ({copilot.actions.length})</h3>
              {(copilot?.actions||[]).map((a,i) => (
                <div key={i} className={`rounded-xl p-4 border ${a.priority==='high'?'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800':a.priority==='medium'?'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800':'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                  <div className="flex items-start gap-3">
                    {actionIcon(a.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm dark:text-surface-200">{a.title}</span>
                        {a.platform && <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white" style={{backgroundColor:platformColor[a.platform]||'#6366f1'}}>{a.platform}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.priority==='high'?'bg-red-200 text-red-800':a.priority==='medium'?'bg-amber-200 text-amber-800':'bg-emerald-200 text-emerald-800'}`}>{a.priority}</span>
                      </div>
                      <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">{a.detail}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-surface-400"><Zap size={48} className="mx-auto mb-4 opacity-30"/><div className="font-display font-bold">No actions needed</div><p className="text-sm">All campaigns are performing well.</p></div>
          )}
        </div>)}
      </>))}
    </div>
  );
}
