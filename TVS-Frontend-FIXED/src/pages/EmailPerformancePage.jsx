import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, DollarSign, MousePointer, Eye, ShoppingCart, TrendingUp } from 'lucide-react';

export default function EmailPerformancePage() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('overview');
  const { data, loading } = useApi('/analytics/email-performance', { period }, [period]);
  const s = data?.summary || {};

  const providerCols = [
    { key: 'source', label: 'Provider', render: v => <span className="font-semibold text-sm capitalize">{v}</span> },
    { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
    { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span> },
    { key: 'profit', label: 'Profit', align: 'right', render: v => <span className="font-mono">{fmt.currency(v)}</span> },
    { key: 'aov', label: 'AOV', align: 'right', render: v => fmt.currency(v) },
  ];

  const opensCols = [
    { key: 'campaign', label: 'Campaign', render: v => <span className="font-semibold text-sm">{(v||'').replace(/_/g,' ')}</span> },
    { key: 'email_id', label: 'Email', render: v => <span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{v}</span> },
    { key: 'unique_opens', label: 'Unique Opens', align: 'right', render: v => fmt.number(v) },
    { key: 'total_opens', label: 'Total Opens', align: 'right', render: v => fmt.number(v) },
  ];

  const campaignOpensCols = [
    { key: 'campaign', label: 'Campaign', render: v => <span className="font-semibold text-sm">{(v||'').replace(/_/g,' ')}</span> },
    { key: 'emails_tracked', label: 'Emails Tracked', align: 'right', render: v => fmt.number(v) },
    { key: 'unique_opens', label: 'Unique Opens', align: 'right', render: v => fmt.number(v) },
    { key: 'opens', label: 'Total Opens', align: 'right', render: v => <span className="font-bold">{fmt.number(v)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Email Performance" subtitle="Track every email series — opens, clicks, sales, and revenue">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="inline-flex bg-white dark:bg-surface-800 rounded-xl border border-surface-200 p-1 mb-6">
        {[['overview','Overview'],['opens','Opens & Tracking'],['sales','Sales by Email']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===k?'bg-brand-500 text-white':'text-surface-500 hover:text-surface-700'}`}>{l}</button>
        ))}
      </div>

      {loading ? <><SkeletonCards count={4}/><SkeletonTable/></> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6 stagger">
            <MetricCard label="Email Orders" value={s.total_email_orders} format="number" icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
            <MetricCard label="Email Revenue" value={s.total_email_revenue} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="Email Profit" value={s.total_email_profit} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
            <MetricCard label="Total Opens" value={s.total_opens} format="number" icon={Eye} color="bg-amber-50 text-amber-600" />
            <MetricCard label="Unique Openers" value={s.unique_openers} format="number" icon={Mail} color="bg-indigo-50 text-indigo-600" />
            <MetricCard label="Campaigns Tracked" value={s.campaigns_tracked} format="number" icon={MousePointer} color="bg-rose-50 text-rose-600" />
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Daily email revenue trend */}
              {data?.daily?.length > 0 && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Daily Email-Attributed Revenue</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.daily}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '$' + fmt.compact(v)} />
                      <Tooltip formatter={v => typeof v === 'number' ? fmt.currency(v) : v} />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf630" strokeWidth={2} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Revenue by provider */}
              {data?.byProvider?.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Revenue by Email Provider</h3>
                  <DataTable columns={providerCols} data={data.byProvider} />
                </div>
              )}

              {(!data?.daily?.length && !data?.byProvider?.length) && (
                <div className="text-center py-16 text-surface-400">
                  <Mail size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No email tracking data yet</div>
                  <p className="text-sm max-w-md mx-auto">Add UTM tracking links to your email CTAs using the master spreadsheet. Once customers click and buy, data will appear here automatically.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'opens' && (
            <div className="space-y-6">
              {/* Opens by campaign */}
              {data?.opensByCampaign?.length > 0 ? (
                <>
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                    <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-4">Opens by Campaign</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.opensByCampaign.slice(0, 15)} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="campaign" tick={{ fontSize: 10 }} width={160} tickFormatter={v => (v||'').replace(/_/g,' ').slice(0,25)} />
                        <Tooltip />
                        <Bar dataKey="unique_opens" fill="#f1c349" radius={[0, 8, 8, 0]} name="Unique Opens" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <DataTable columns={campaignOpensCols} data={data.opensByCampaign} searchable={['campaign']} />
                </>
              ) : (
                <div className="text-center py-16 text-surface-400">
                  <Eye size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No open tracking data yet</div>
                  <p className="text-sm max-w-md mx-auto">Add the tracking pixel from the master spreadsheet to your email templates. Opens will be tracked automatically.</p>
                </div>
              )}

              {/* Individual email opens */}
              {data?.opens?.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3">Opens by Individual Email</h3>
                  <DataTable columns={opensCols} data={data.opens} searchable={['campaign','email_id']} />
                </div>
              )}
            </div>
          )}

          {tab === 'sales' && (
            <div className="space-y-6">
              {data?.byCampaign?.length > 0 ? (
                <DataTable
                  columns={[
                    { key: 'campaign', label: 'Campaign', render: v => <span className="font-semibold text-sm">{(v||'unknown').replace(/_/g,' ')}</span> },
                    { key: 'provider', label: 'Provider', render: v => <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700">{v}</span> },
                    { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
                    { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span> },
                    { key: 'profit', label: 'Profit', align: 'right', render: v => <span className="font-mono">{fmt.currency(v)}</span> },
                    { key: 'aov', label: 'AOV', align: 'right', render: v => fmt.currency(v) },
                  ]}
                  data={data.byCampaign}
                  searchable={['campaign','provider']}
                />
              ) : null}

              {data?.byEmail?.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-surface-800 dark:text-surface-200 text-sm mb-3 mt-6">Sales by Individual Email CTA</h3>
                  <DataTable
                    columns={[
                      { key: 'campaign', label: 'Campaign', render: v => <span className="font-semibold text-xs">{(v||'').replace(/_/g,' ')}</span> },
                      { key: 'email_cta', label: 'CTA', render: v => <span className="text-xs font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{(v||'').replace(/_/g,' ')}</span> },
                      { key: 'provider', label: 'Provider', render: v => <span className="text-xs">{v}</span> },
                      { key: 'orders', label: 'Orders', align: 'right', render: v => fmt.number(v) },
                      { key: 'revenue', label: 'Revenue', align: 'right', render: v => <span className="font-mono font-bold text-emerald-600">{fmt.currency(v)}</span> },
                    ]}
                    data={data.byEmail}
                    searchable={['campaign','email_cta']}
                  />
                </div>
              )}

              {(!data?.byCampaign?.length && !data?.byEmail?.length) && (
                <div className="text-center py-16 text-surface-400">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                  <div className="text-lg font-display font-bold mb-2">No email sales data yet</div>
                  <p className="text-sm max-w-md mx-auto">When customers click UTM-tracked links in your emails and purchase, their orders will appear here with full revenue attribution.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
